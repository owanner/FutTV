/**
 * CONMEBOL scraper for Libertadores & Copa Sulamericana.
 * Extracts fixtures (teams, date, stage, venue, score, broadcasts) from
 * gol.conmebol.com fixture pages.
 *
 * Broadcast (and Sulamericana match) data is not available via any free API,
 * so we scrape static HTML fixture pages. Each fixture exposes rich Drupal
 * metadata in a JSON blob.
 */

const axios = require("axios");
const cheerio = require("cheerio");

const BASE_URL = "https://gol.conmebol.com";
const BATCH_SIZE = 12;
const REQUEST_TIMEOUT_MS = 6000;

/**
 * Build the canonical crest URL for a CONMEBOL team id.
 * favours the highest-resolution 3x asset (300px) since that's what the
 * site uses in its `srcset`.
 */
function buildTeamCrestUrl(teamId) {
  if (!teamId) return null;
  return `https://gol-cdn.conmebol.com/icons/team/light/3x/id/${teamId}.png`;
}

/**
 * Try to fetch a single fixture page and extract match + broadcast data.
 * Returns null if the page doesn't exist, has no team data, or belongs to
 * a different competition than the one we're scraping (filtered by
 * `expectedCompetitionId`).
 *
 * @param {number} fixtureId
 * @param {string} slug — competition slug ("libertadores" | "sudamericana")
 * @param {object} [opts]
 * @param {string} [opts.expectedCompetitionId] — CONMEBOL competition_id to
 *   keep (e.g. "13" for Libertadores 2026, "102" for Sudamericana 2026).
 *   When provided, fixtures whose `competition_id` differs are rejected,
 *   which prevents U17 / Libertadores games from leaking into Sudamericana.
 */
async function scrapeFixturePage(fixtureId, slug = "libertadores", opts = {}) {
  const url = `${BASE_URL}/${slug}/pt-br/fixture/view/${fixtureId}`;
  const { data: html } = await axios.get(url, {
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "Accept-Language": "pt-BR,pt;q=0.9"
    }
  });

  const $ = cheerio.load(html);

  const scriptTag = $('script[data-drupal-selector="drupal-settings-json"]');
  if (!scriptTag.length) return null;

  const settings = JSON.parse(scriptTag.html());
  const t = settings?.metadata?.targeting;
  if (!t?.fixture_home_team_title || !t?.fixture_away_team_title) return null;

  // Filter out fixtures that belong to a different competition
  // (e.g. CONMEBOL U17 Femenino, Libertadores games appearing on the
  // Sudamericana domain). We compare against the `competition_id` Drupal
  // metadata field, which is stable per fixture regardless of the URL slug.
  const fixtureCompetitionId = t.fixture_competition_id ?? t.competition_id ?? null;
  if (opts.expectedCompetitionId && String(fixtureCompetitionId) !== String(opts.expectedCompetitionId)) {
    return null;
  }

  // Extract broadcasts from the page
  const broadcasts = [];
  $(".m-broadcast-list__item").each((_, el) => {
    const name = $(el).find("img").attr("alt") || $(el).find("a").text().trim();
    if (name && name !== "Social / Facebook" && name !== "Unknown") {
      broadcasts.push({
        name,
        logo: $(el).find("img").attr("src") || null,
        url: $(el).find("a").attr("href") || null
      });
    }
  });

  // Extract team crests. The hero renders two `m-match-centre-hero__team-badge`
  // blocks (home first, away second); each holds an <img> whose `src` is the
  // 1x variant of the same asset used for the 3x `srcset`. We prefer the
  // stable CDN URL derived from the team id so we don't depend on the DOM
  // order, but fall back to the scraped `src` when the id is missing.
  const homeTeamId = t.fixture_home_team_id || null;
  const awayTeamId = t.fixture_away_team_id || null;

  const badgeImgs = [];
  $(".m-match-centre-hero__team-badge img").each((_, el) => {
    const src = $(el).attr("src");
    if (src) badgeImgs.push(src);
  });

  const homeCrest = buildTeamCrestUrl(homeTeamId) || badgeImgs[0] || null;
  const awayCrest = buildTeamCrestUrl(awayTeamId) || badgeImgs[1] || badgeImgs[0] || null;

  const fixtureDate = typeof t.fixture_date === "number"
    ? new Date(t.fixture_date * 1000)
    : null;

  return {
    conmebolFixtureId: String(fixtureId),
    slug,
    competitionId: fixtureCompetitionId,
    homeTeam: t.fixture_home_team_title,
    awayTeam: t.fixture_away_team_title,
    homeTeamId,
    awayTeamId,
    homeCrest,
    awayCrest,
    fixtureDate,
    externalId: t.external_id || null,
    stageName: t.fixture_stage_title || null,
    competitionName: t.fixture_competition_title || null,
    tournamentName: t.fixture_tournament_title || null,
    venue: t.relations?.cc_venue_vocab?.[0]?.label || null,
    broadcasts
  };
}

/**
 * Discover all valid fixture IDs by scanning a range in parallel batches.
 * Returns only pages that have valid team metadata and (when provided) match
 * the expected CONMEBOL competition_id.
 *
 * @param {string} slug
 * @param {number} [startId=1500]
 * @param {number} [endId=1800]
 * @param {object} [opts]
 * @param {string} [opts.expectedCompetitionId] — keep only fixtures whose
 *   `competition_id` matches this value.
 */
async function discoverFixtureIds(slug, startId = 1500, endId = 1800, opts = {}) {
  const results = [];

  for (let batchStart = startId; batchStart <= endId; batchStart += BATCH_SIZE) {
    const ids = [];
    for (let id = batchStart; id < batchStart + BATCH_SIZE && id <= endId; id++) {
      ids.push(id);
    }

    const batch = ids.map(id =>
      scrapeFixturePage(id, slug, opts).then(data => (data ? { id, ...data } : null)).catch(() => null)
    );

    const batchResults = await Promise.all(batch);
    for (const result of batchResults) {
      if (result) results.push(result);
    }
  }

  return results;
}

/**
 * Map a CONMEBOL fixture stage name (English) to a normalised Portuguese
 * stage label used in our DB.
 *
 * Competition-specific overrides are applied first:
 * - Libertadores: "Knockout Round Play-offs" → "Oitavas de Final" (no Repescagem)
 * - Sulamericana: "Knockout Round Play-offs" → "Repescagem" (has a distinct playoff)
 */
const STAGE_LABELS = {
  "Group Stage": "Fase de Grupos",
  "Knockout Round Play-offs": "Repescagem",
  "2nd Round": "2ª Fase",
  "8th Finals": "Oitavas de Final",
  "Quarter-finals": "Quartas de Final",
  "Semi-finals": "Semifinal",
  "Final": "Final",
  "Finals": "Final"
};

const STAGE_OVERRIDES = {
  libertadores2026: {
    "Knockout Round Play-offs": "Oitavas de Final"
  }
};

function normaliseStage(rawStage, competitionId) {
  if (!rawStage) return "Outros";
  const override = STAGE_OVERRIDES[competitionId]?.[rawStage];
  if (override) return override;
  return STAGE_LABELS[rawStage] || rawStage;
}

/**
 * Scrape broadcast data for all matches of a CONMEBOL competition slug.
 * Returns only fixtures that have at least one broadcast channel.
 *
 * @param {string} [slug="libertadores"]
 * @param {object} [opts] — forwarded to `discoverFixtureIds`.
 */
async function getAllBroadcasts(slug = "libertadores", opts = {}) {
  console.log(`[Conmebol:${slug}] Scanning fixture pages for broadcast data...`);
  const allFixtures = await discoverFixtureIds(slug, opts.startId, opts.endId, opts);
  console.log(`[Conmebol:${slug}] ${allFixtures.length} valid fixtures found`);

  const withBroadcasts = allFixtures.filter(f => f.broadcasts.length > 0);
  console.log(`[Conmebol:${slug}] ${withBroadcasts.length} fixtures have broadcast data`);

  return withBroadcasts;
}

/**
 * Scrape all valid fixtures (with or without broadcasts) for a competition slug.
 * Used to populate match data for the Sulamericana (no API available).
 *
 * @param {string} slug
 * @param {number} [startId]
 * @param {number} [endId]
 * @param {object} [opts] — forwarded to `discoverFixtureIds`.
 */
async function getAllFixtures(slug, startId, endId, opts = {}) {
  console.log(`[Conmebol:${slug}] Scanning fixtures for matches...`);
  const all = await discoverFixtureIds(slug, startId, endId, opts);
  console.log(`[Conmebol:${slug}] ${all.length} valid fixtures found`);
  return all;
}

/**
 * Map Opta `rankStatus` to a normalised qualification label.
 *  - "8th Finals"  -> 1st of group, directly qualified to Oitavas
 *  - "Play-off"    -> 2nd of group, goes to Repescagem
 *  - null / other  -> eliminated (3rd/4th)
 */
function rankStatusToQualifies(rankStatus) {
  if (rankStatus === "8th Finals") return "qualified";
  if (rankStatus === "Play-off") return "playoff";
  return "eliminated";
}

/**
 * Scrape the official group standings for a CONMEBOL competition.
 *
 * The standings are not in the page HTML (rendered client-side by React from
 * Opta's performfeeds.com API). We fetch the same JSON endpoint used by their
 * `leaguetable` widget:
 *
 *   https://api.performfeeds.com/soccerdata/standings/{outletAuthKey}
 *      ?_rt=c&_fmt=json&_lcl={lang}&tmcl={tournamentExternalId}&type=total
 *
 * `outletAuthKey` and the tournament `external_id` (`tmcl`) are read from the
 * Drupal settings JSON embedded in the public `tournament-table/{tournamentId}`
 * page of the competition domain.
 *
 * Returns a flat array of standing rows, one per team, with the shape used by
 * `syncStandings.js`:
 *
 *   { groupId, groupName, teamId, teamName, teamCode, badge, position,
 *     played, wins, draws, losses, goalsFor, goalsAgainst, goalDifference,
 *     points, qualifies }
 *
 * @param {string} slug                       — "libertadores" | "sudamericana"
 * @param {string} tournamentDrupalId        — Drupal tournament id (e.g. "104")
 * @param {object} [opts]
 * @param {string} [opts.expectedCompetitionId] — when provided, the function
 *   validates the tournament's `competition_reference.tid` against it and
 *   returns null if it doesn't match (avoids scraping the wrong competition).
 */
async function scrapeStandings(slug, tournamentDrupalId, opts = {}) {
  const tableUrl = `${BASE_URL}/${slug}/en/tournament-table/${tournamentDrupalId}`;
  const { data: html } = await axios.get(tableUrl, {
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "Accept-Language": "en,en-US;q=0.9"
    }
  });

  const $ = cheerio.load(html);
  const scriptTag = $('script[data-drupal-selector="drupal-settings-json"]');
  if (!scriptTag.length) return null;

  const settings = JSON.parse(scriptTag.html());
  const opta = settings?.clubcastOpta;
  const outletAuthKey = opta?.clubcastSdApi?.outletAuthKey;
  const lang = opta?.clubcastSdApi?.langcode || "en";
  const tournaments = opta?.leagueTable?.tournaments || [];

  if (!outletAuthKey || tournaments.length === 0) {
    console.warn(`[Conmebol:${slug}] No Opta outlet key / tournaments found`);
    return null;
  }

  // Pick the tournament whose drupal_id matches the requested one; defensively
  // fall back to the first one in the list.
  let tournament = tournaments.find(
    (t) => String(t?.drupal_id) === String(tournamentDrupalId)
  ) || tournaments[0];

  // Validate against the expected CONMEBOL `competition_id` when provided.
  if (opts.expectedCompetitionId && tournament?.tournament?.field_cc_competition_reference?.tid != null) {
    const tid = String(tournament.tournament.field_cc_competition_reference.tid);
    if (tid !== String(opts.expectedCompetitionId)) {
      console.warn(`[Conmebol:${slug}] Tournament's competition_id ${tid} !== expected ${opts.expectedCompetitionId}; skipping standings`);
      return null;
    }
  }

  const tournamentExternalId = tournament?.external_id;
  if (!tournamentExternalId) {
    console.warn(`[Conmebol:${slug}] No external_id (tmcl) found for tournament ${tournamentDrupalId}`);
    return null;
  }

  const apiBase = settings?.metadata?.schemeAndHttpHost || `https://gol.conmebol.com`;
  const apiUrl = `https://api.performfeeds.com/soccerdata/standings/${outletAuthKey}` +
    `?_rt=c&_fmt=json&_lcl=${encodeURIComponent(lang)}` +
    `&tmcl=${encodeURIComponent(tournamentExternalId)}&type=total`;

  let payload;
  try {
    const resp = await axios.get(apiUrl, {
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json",
        "Referer": `${apiBase}/`,
        "Origin": apiBase
      }
    });
    payload = resp.data;
  } catch (err) {
    console.error(`[Conmebol:${slug}] Opta standings request failed: ${err.message}`);
    return null;
  }

  const stages = payload?.stage || [];
  const rows = [];

  for (const stage of stages) {
    const divisions = stage?.division || [];
    for (const div of divisions) {
      const groupName = div?.groupName || null;
      const groupId = div?.groupId || groupName;
      if (!groupName) continue;

      // Opta returns "Group A".."Group H" in English. Translate to the
      // Portuguese "Grupo A" used across the rest of the app so the frontend
      // renders them consistently with the Libertadores / WC groups.
      const groupNamePt = groupName.replace(/^Group\s/, "Grupo ");

      const ranking = div?.ranking || [];
      for (const r of ranking) {
        const teamId = r?.contestantId || null;
        const name = r?.contestantClubName || r?.contestantName || "Time desconhecido";
        const code = r?.contestantCode || null;
        // The Opta payload doesn't include the crest URL, but the Drupal JSON
        // (in the same page) gives us the canonical CDN path; build it from the
        // contestant's `legacyId` if present.
        const teamLegacyId = r?.legacy?.id;

        rows.push({
          groupId: String(groupId),
          groupName: groupNamePt,
          teamId: String(teamId || name),
          teamName: name,
          teamCode: code,
          badge: null, // crests come from the scraper's fixture data
          position: Number.isFinite(r?.rank) ? r.rank : null,
          played: Number(r?.matchesPlayed) || 0,
          wins: Number(r?.matchesWon) || 0,
          draws: Number(r?.matchesDrawn) || 0,
          losses: Number(r?.matchesLost) || 0,
          goalsFor: Number(r?.goalsFor) || 0,
          goalsAgainst: Number(r?.goalsAgainst) || 0,
          goalDifference: Number(r?.goaldifference?.replace(/[^-\d]/g, "")) || (Number(r?.goalsFor) || 0) - (Number(r?.goalsAgainst) || 0),
          points: Number(r?.points) || 0,
          qualifies: rankStatusToQualifies(r?.rankStatus)
        });
      }
    }
  }

  return rows;
}

module.exports = {
  scrapeFixturePage,
  discoverFixtureIds,
  getAllBroadcasts,
  getAllFixtures,
  scrapeStandings,
  normaliseStage,
  buildTeamCrestUrl
};
