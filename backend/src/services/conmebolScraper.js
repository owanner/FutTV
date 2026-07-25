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
 * Try to fetch a single fixture page and extract match + broadcast data.
 * Returns null if the page doesn't exist or has no team data.
 *
 * @param {number} fixtureId
 * @param {string} slug — competition slug ("libertadores" | "sudamericana")
 */
async function scrapeFixturePage(fixtureId, slug = "libertadores") {
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

  const fixtureDate = typeof t.fixture_date === "number"
    ? new Date(t.fixture_date * 1000)
    : null;

  return {
    conmebolFixtureId: String(fixtureId),
    slug,
    homeTeam: t.fixture_home_team_title,
    awayTeam: t.fixture_away_team_title,
    homeTeamId: t.fixture_home_team_id || null,
    awayTeamId: t.fixture_away_team_id || null,
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
 * Returns only pages that have valid team metadata.
 */
async function discoverFixtureIds(slug, startId = 1500, endId = 1800) {
  const results = [];

  for (let batchStart = startId; batchStart <= endId; batchStart += BATCH_SIZE) {
    const ids = [];
    for (let id = batchStart; id < batchStart + BATCH_SIZE && id <= endId; id++) {
      ids.push(id);
    }

    const batch = ids.map(id =>
      scrapeFixturePage(id, slug).then(data => (data ? { id, ...data } : null)).catch(() => null)
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

function normaliseStage(rawStage) {
  if (!rawStage) return "Outros";
  return STAGE_LABELS[rawStage] || rawStage;
}

/**
 * Scrape broadcast data for all matches of a CONMEBOL competition slug.
 * Returns only fixtures that have at least one broadcast channel.
 */
async function getAllBroadcasts(slug = "libertadores") {
  console.log(`[Conmebol:${slug}] Scanning fixture pages for broadcast data...`);
  const allFixtures = await discoverFixtureIds(slug);
  console.log(`[Conmebol:${slug}] ${allFixtures.length} valid fixtures found`);

  const withBroadcasts = allFixtures.filter(f => f.broadcasts.length > 0);
  console.log(`[Conmebol:${slug}] ${withBroadcasts.length} fixtures have broadcast data`);

  return withBroadcasts;
}

/**
 * Scrape all valid fixtures (with or without broadcasts) for a competition slug.
 * Used to populate match data for the Sulamericana (no API available).
 */
async function getAllFixtures(slug, startId, endId) {
  console.log(`[Conmebol:${slug}] Scanning fixtures for matches...`);
  const all = await discoverFixtureIds(slug, startId, endId);
  console.log(`[Conmebol:${slug}] ${all.length} valid fixtures found`);
  return all;
}

module.exports = {
  scrapeFixturePage,
  discoverFixtureIds,
  getAllBroadcasts,
  getAllFixtures,
  normaliseStage
};
