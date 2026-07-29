/**
 * Match synchronization — multi-competition.
 * Loops over each registered competition and syncs matches from the appropriate API.
 */

const prisma = require("../database/prisma");
const fifaApi = require("../services/fifaApi");
const footballDataApi = require("../services/footballDataApi");
const cbfApi = require("../services/cbfApi");
const apiFootball = require("../services/apiFootball");
const conmebolScraper = require("../services/conmebolScraper");
const { competitions } = require("../config/competitions");
const { isSameTeam } = require("../utils/textUtils");
const aliases = require("../../data/teamAliases.json");

function extractReferee(match) {
  if (!match.Officials || match.Officials.length === 0) return null;
  return match.Officials[0]?.Name?.[0]?.Description || null;
}

function extractTeamName(team) {
  return team?.TeamName?.[0]?.Description || null;
}

function extractTeamFlag(team) {
  return team?.PictureUrl
    ?.replace("{format}", "sq")
    ?.replace("{size}", "4");
}

function buildFifaMatchData(match, compId) {
  return {
    competitionId: compId,
    seasonId: match.IdSeason,
    stageId: match.IdStage,
    groupId: match.IdGroup,
    groupName: match.GroupName?.[0]?.Description || null,
    stageName: match.StageName?.[0]?.Description || null,
    homeTeam: extractTeamName(match.Home),
    homeFlag: extractTeamFlag(match.Home),
    awayTeam: extractTeamName(match.Away),
    awayFlag: extractTeamFlag(match.Away),
    homeCode: match.Home?.Abbreviation || null,
    awayCode: match.Away?.Abbreviation || null,
    date: new Date(match.Date),
    round: match.MatchDay || null,
    stadium: match.Stadium?.Name?.[0]?.Description || null,
    city: match.Stadium?.CityName?.[0]?.Description || null,
    referee: extractReferee(match),
    attendance: match.Attendance,
    status: match.MatchStatus,
    homeScore: match.HomeTeamScore,
    awayScore: match.AwayTeamScore
  };
}

function mapFbStatus(status) {
  if (status === "FINISHED" || status === "AWARDED") return 0;
  if (status === "LIVE" || status === "IN_PLAY" || status === "PAUSED" || status === "HALFTIME") return 3;
  if (status === "CANCELLED" || status === "POSTPONED" || status === "SUSPENDED") return 4;
  return 1;
}

/**
 * Map football-data.org stage codes to friendly Portuguese labels used in
 * the UI. The football-data "stage" field is a string identifier, not an
 * object, so we normalise it here.
 *
 * Competition-specific overrides are applied first:
 * - Libertadores: PLAY_OFFS maps to "Oitavas de Final" (no Repescagem round)
 * - Sulamericana: PLAY_OFFS maps to "Repescagem" (has a distinct playoff round)
 */
const FB_STAGE_LABELS = {
  GROUP_STAGE: "Fase de Grupos",
  ROUND_1: "1ª Fase",
  ROUND_2: "2ª Fase",
  ROUND_3: "3ª Fase",
  PLAY_OFFS: "Repescagem",
  ROUND_OF_16: "Oitavas de Final",
  QUARTER_FINALS: "Quartas de Final",
  SEMI_FINALS: "Semifinal",
  FINAL: "Final"
};

const FB_STAGE_OVERRIDES = {
  libertadores2026: {
    PLAY_OFFS: "Oitavas de Final"
  }
};

function normaliseFbStage(rawStage, competitionId) {
  if (!rawStage) return "Fase de Grupos";
  const override = FB_STAGE_OVERRIDES[competitionId]?.[rawStage];
  if (override) return override;
  return FB_STAGE_LABELS[rawStage] || rawStage;
}

function buildFootballDataMatchData(match, compId, seasonId) {
  const homeTeam = match.homeTeam || {};
  const awayTeam = match.awayTeam || {};
  const stageRaw = typeof match.stage === "string" ? match.stage : match.stage?.name;
  const group = match.group?.name || (stageRaw === "GROUP_STAGE" ? null : null);
  return {
    competitionId: compId,
    seasonId: seasonId,
    stageId: stageRaw || "",
    groupId: group || null,
    groupName: group || null,
    stageName: normaliseFbStage(stageRaw, compId),
    homeTeam: homeTeam.name || null,
    homeFlag: homeTeam.crest || null,
    awayTeam: awayTeam.name || null,
    awayFlag: awayTeam.crest || null,
    homeCode: homeTeam.tla || null,
    awayCode: awayTeam.tla || null,
    date: new Date(match.utcDate),
    round: match.matchday || null,
    stadium: match.venue || null,
    city: null,
    referee: match.referees?.[0]?.name || null,
    attendance: match.attendance?.toString() || null,
    status: mapFbStatus(match.status),
    homeScore: match.score?.fullTime?.home ?? null,
    awayScore: match.score?.fullTime?.away ?? null
  };
}

async function syncFifaBroadcasts(matchId, seasonId) {
  const broadcasts = await fifaApi.getBroadcasts(seasonId, matchId);
  await prisma.broadcast.deleteMany({ where: { matchId } });
  if (broadcasts.length > 0) {
    await prisma.broadcast.createMany({
      data: broadcasts.map(ch => ({
        matchId,
        channelId: ch.IdChannel,
        name: ch.Name,
        logo: ch.Logo,
        url: ch.Url,
        language: ch.Language
      }))
    });
  }
}

async function syncFifaCompetition(comp) {
  const config = comp.config;
  console.log(`\n⚽ [${comp.name}] Buscando jogos...`);

  const matches = await fifaApi.getAllMatches(config);
  console.log(`📅 ${matches.length} jogos encontrados`);

  for (const match of matches) {
    const matchId = match.IdMatch;
    const matchData = buildFifaMatchData(match, comp.id);

    await prisma.match.upsert({
      where: { id: matchId },
      update: matchData,
      create: { id: matchId, ...matchData }
    });

    try {
      await syncFifaBroadcasts(matchId, match.IdSeason);
    } catch {
      // No broadcasts for this match
    }
  }
}

async function syncFootballDataCompetition(comp) {
  const { footballDataLeagueId, footballDataSeason } = comp.config;
  console.log(`\n⚽ [${comp.name}] Buscando jogos...`);

  const matches = await footballDataApi.getMatches(footballDataLeagueId, footballDataSeason);
  console.log(`📅 ${matches.length} jogos encontrados`);

  for (const match of matches) {
    const matchId = `fb_${match.id}`;

    // Skip matches that were manually adjusted (e.g. W.O., score corrections)
    const existing = await prisma.match.findUnique({ where: { id: matchId }, select: { manuallyAdjusted: true } });
    if (existing?.manuallyAdjusted) {
      console.log(`  ⏭ Pulando ${matchId} (ajuste manual)`);
      continue;
    }

    const matchData = buildFootballDataMatchData(match, comp.id, String(footballDataSeason));

    await prisma.match.upsert({
      where: { id: matchId },
      update: matchData,
      create: { id: matchId, ...matchData }
    });
  }
}
 
function normalizeKey(s) {
  if (!s) return "";
  return s
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function normalizeTeamName(raw) {
  if (!raw) return "";
  const key = normalizeKey(raw);
  if (!key) return String(raw);
  const direct = aliases[key];
  if (direct) return direct;

  const COMMON_PREFIXES = [
    "SE", "SC", "SA", "SP", "EC", "AC", "AA", "CR", "CS", "CA", "CD", "CAR",
    "CDP", "CT", "CE", "CAP"
  ];
  const COMMON_SUFFIXES = [
    "S.A.F.", "SAF", "F.C.", "FC", "Futebol Clube", "Esporte Clube",
    "Clube de Futebol", "Atletico Clube", "Atlético Clube"
  ];

  let n = raw.trim().replace(/\s+/g, " ");
  const firstWordRaw = n.split(" ")[0] || "";
  const firstWord = firstWordRaw.replace(/\./g, "");
  if (COMMON_PREFIXES.includes(firstWord.toUpperCase())) {
    n = n.slice(firstWordRaw.length).trim();
  }
  for (const suf of COMMON_SUFFIXES) {
    const re = new RegExp(`${suf.replace(/\./g, "\\.")}$`, "i");
    if (re.test(n)) {
      n = n.replace(re, "").trim();
      break;
    }
  }
  return n;
}

/**
 * Build a lookup map of normalized team name -> teamCode from standings for a competition.
 * Uses the same normalization logic as the frontend for consistent matching.
 */
async function buildTeamCodeLookup(compId) {
  const standings = await prisma.standing.findMany({
    where: { competitionId: compId },
    select: { teamName: true, teamCode: true }
  });

  const lookup = new Map();
  for (const s of standings) {
    if (s.teamCode && s.teamName) {
      const normalized = normalizeTeamName(s.teamName);
      const key = normalizeKey(normalized);
      lookup.set(key, s.teamCode);
    }
  }
  return lookup;
}

/**
 * Enrich CBF matches with team codes by matching team names against standings.
 * This is needed because CBF API doesn't provide team abbreviations (TLA).
 */
async function enrichCbfMatchesWithTeamCodes(comp) {
  const codeLookup = await buildTeamCodeLookup(comp.id);
  if (codeLookup.size === 0) return;

  const matches = await prisma.match.findMany({
    where: { competitionId: comp.id, OR: [{ homeCode: null }, { awayCode: null }] },
    select: { id: true, homeTeam: true, awayTeam: true }
  });

  let updated = 0;
  for (const match of matches) {
    const homeCode = match.homeTeam ? codeLookup.get(normalizeKey(normalizeTeamName(match.homeTeam))) : null;
    const awayCode = match.awayTeam ? codeLookup.get(normalizeKey(normalizeTeamName(match.awayTeam))) : null;

    if (homeCode || awayCode) {
      await prisma.match.update({
        where: { id: match.id },
        data: {
          homeCode: homeCode || match.homeCode,
          awayCode: awayCode || match.awayCode
        }
      });
      updated++;
    }
  }
  if (updated > 0) console.log(`  🏷️ ${updated} partidas enriquecidas com códigos de time`);
}

/**
 * Enrich CBF matches with live scores + status from football-data.org.
 * CBF itself returns 0 for all goals, so football-data is the source of truth
 * for scores and live/final status.
 *
 * Accepts an optional `cbfMatches` payload (from CBF API); if not provided,
 * it falls back to using matches already in the DB (useful for the
 * lightweight "score-only" sync path that avoids re-fetching CBF).
 *
 * In score-only mode (no `cbfMatches`), we ask football-data only for LIVE
 * matches (smaller payload) and dislike the full season query.
 */
async function enrichCbfScoresFromFootballData(comp, cbfMatches) {
  const { footballDataLeagueId, footballDataSeason } = comp.config;
  if (!footballDataLeagueId || !process.env.FOOTBALL_DATA_API_KEY) return;

  const scoreOnly = !cbfMatches;
  try {
    // Note: we deliberately do NOT pass `status=LIVE` to football-data here.
    // Its `?status=LIVE` filter has been observed to return 0 even when the
    // unfiltered call returns matches marked `status: "LIVE"` — likely a
    // cache/indexing lag on their side. Fetching the full season is cheap
    // enough (~1s) and guarantees we always see live + just-finished games.
    const fbMatches = await footballDataApi.getMatches(
      footballDataLeagueId,
      footballDataSeason
    );

    let cbfRows;
    if (cbfMatches && cbfMatches.length) {
      cbfRows = cbfMatches.map((m) => ({
        id: `cbf_${m.id_jogo}`,
        home: m.mandante?.nome || "",
        away: m.visitante?.nome || ""
      }));
    } else {
      // Score-only fallback: only consider live + recent (last 4h) matches
      // in the DB, since football-data was asked only for LIVE matches.
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
      const dbMatches = await prisma.match.findMany({
        where: {
          competitionId: comp.id,
          OR: [{ status: 3 }, { status: 1, date: { gte: fourHoursAgo } }]
        },
        select: { id: true, homeTeam: true, awayTeam: true }
      });
      cbfRows = dbMatches.map((m) => ({
        id: m.id,
        home: m.homeTeam || "",
        away: m.awayTeam || ""
      }));
    }

    let scoresUpdated = 0;
    let statusUpdated = 0;

    for (const fb of fbMatches) {
      const liveOrFinished = ["LIVE", "IN_PLAY", "PAUSED", "HALFTIME", "FINISHED", "AWARDED"].includes(fb.status);
      if (!liveOrFinished) continue;

      const fbHome = fb.homeTeam?.name || "";
      const fbAway = fb.awayTeam?.name || "";
      const row = cbfRows.find(
        (r) => isSameTeam(r.home, fbHome) && isSameTeam(r.away, fbAway)
      );
      if (!row) continue;

      const homeGoals = fb.score?.fullTime?.home;
      const awayGoals = fb.score?.fullTime?.away;

      if (homeGoals != null && awayGoals != null) {
        await prisma.match.updateMany({
          where: { id: row.id, manuallyAdjusted: false },
          data: { homeScore: homeGoals, awayScore: awayGoals }
        });
        scoresUpdated++;
      }

      const fbStatus = mapFbStatus(fb.status);
      if (fbStatus !== 1) {
        await prisma.match.updateMany({
          where: { id: row.id, manuallyAdjusted: false },
          data: { status: fbStatus }
        });
        statusUpdated++;
      }
    }

    if (scoresUpdated > 0) console.log(`  📊 ${scoresUpdated} placares atualizados via football-data.org`);
    if (statusUpdated > 0) console.log(`  📊 ${statusUpdated} status atualizados via football-data.org`);
  } catch (err) {
    console.error(`  ⚠ Não foi possível atualizar placares via football-data.org: ${err.message}`);
  }
}

async function syncCbfCompetition(comp) {
  const { cbfCompetitionId, footballDataLeagueId, footballDataSeason } = comp.config;
  const seasonId = String(footballDataSeason);
  console.log(`\n⚽ [${comp.name}] Buscando jogos...`);

  const matches = await cbfApi.getMatches(cbfCompetitionId);
  console.log(`📅 ${matches.length} jogos encontrados`);

  for (const match of matches) {
    const matchId = `cbf_${match.id_jogo}`;

    const existing = await prisma.match.findUnique({ where: { id: matchId }, select: { manuallyAdjusted: true } });
    if (existing?.manuallyAdjusted) {
      console.log(`  ⏭ Pulando ${matchId} (ajuste manual)`);
      continue;
    }

    const matchData = cbfApi.buildMatchData(match, comp.id, seasonId);

    await prisma.match.upsert({
      where: { id: matchId },
      update: matchData,
      create: { id: matchId, ...matchData }
    });
  }

  // Enrich CBF matches with team codes from standings
  await enrichCbfMatchesWithTeamCodes(comp);

  // Update scores and status from football-data.org (CBF returns 0 for all goals)
  await enrichCbfScoresFromFootballData(comp, matches);
}

async function syncConmebolCompetition(comp) {
  const { conmebolSlug, fixtureIdRange, conmebolCompetitionId } = comp.config;
  const seasonId = String(comp.config.footballDataSeason || comp.config.conmebolTournamentId || "2026");
  console.log(`\n⚽ [${comp.name}] Buscando jogos via scraping CONMEBOL...`);

  const start = fixtureIdRange?.start ?? 680;
  const end = fixtureIdRange?.end ?? 1800;

  // Filter by CONMEBOL `competition_id` so fixtures from other tournaments
  // (e.g. CONMEBOL U17 Femenino, or Libertadores games exposed on the
  // Sudamericana domain) don't leak into this competition. The id is stable
  // per season — for 2026: Libertadores=13, Sudamericana=102.
  const scraperOpts = conmebolCompetitionId ? { expectedCompetitionId: String(conmebolCompetitionId) } : {};

  const fixtures = await conmebolScraper.getAllFixtures(conmebolSlug, start, end, scraperOpts);
  console.log(`📅 ${fixtures.length} fixtures encontrados`);

  let created = 0;
  for (const f of fixtures) {
    const matchId = `conmebol_${conmebolSlug}_${f.conmebolFixtureId}`;
    if (!f.fixtureDate) continue; // skip fixtures without a date (future TBC)

    // Skip manual overrides
    const existing = await prisma.match.findUnique({ where: { id: matchId }, select: { manuallyAdjusted: true, status: true, homeScore: true, awayScore: true } });
    if (existing?.manuallyAdjusted) {
      console.log(`  ⏭ Pulando ${matchId} (ajuste manual)`);
      continue;
    }

    // Infer status by date (CONMEBOL pages don't expose status explicitly)
    const now = new Date();
    const twoHours = 2 * 60 * 60 * 1000;
    const isFinished = f.fixtureDate.getTime() + twoHours < now.getTime();
    const isLive = !isFinished && f.fixtureDate.getTime() <= now.getTime();
    const status = isFinished ? 0 : isLive ? 3 : 1;

    const matchData = {
      competitionId: comp.id,
      seasonId,
      stageId: f.stageName || null,
      groupId: null,
      groupName: null,
      stageName: conmebolScraper.normaliseStage(f.stageName, comp.id),
      homeTeam: f.homeTeam,
      homeFlag: f.homeCrest || null,
      awayTeam: f.awayTeam,
      awayFlag: f.awayCrest || null,
      homeCode: null,
      awayCode: null,
      date: f.fixtureDate,
      round: null,
      stadium: f.venue || null,
      city: null,
      referee: null,
      attendance: null,
      status,
      homeScore: null, // CONMEBOL pages don't expose scores
      awayScore: null
    };

    await prisma.match.upsert({
      where: { id: matchId },
      update: matchData,
      create: { id: matchId, ...matchData }
    });
    created++;
  }
  console.log(`  ✅ ${created} partidas sincronizadas`);

  // Cleanup: remove matches that belong to this competition but are no longer
  // returned by the scraper (e.g. U17 / Libertadores fixtures that used to leak
  // into Sudamericana before we added the competition_id filter). We keep any
  // match that still appears in this sync run + any manually-adjusted row.
  const validIds = new Set(fixtures.map(f => `conmebol_${conmebolSlug}_${f.conmebolFixtureId}`));
  const staleRows = await prisma.match.findMany({
    where: { competitionId: comp.id },
    select: { id: true, manuallyAdjusted: true, homeTeam: true, awayTeam: true }
  });
  const staleIds = staleRows
    .filter(r => !validIds.has(r.id) && !r.manuallyAdjusted)
    .map(r => r.id);

  if (staleIds.length > 0) {
    // Broadcasts cascade-delete automatically (see schema).
    await prisma.match.deleteMany({ where: { id: { in: staleIds } } });
    console.log(`  🧹 ${staleIds.length} partidas obsoletas removidas (U17/Libertadores filtrados)`);
  }
}

/**
 * Run a full sync for a single competition by its id.
 * Useful for the DB-driven scheduler to refresh one competition on demand.
 */
async function syncCompetition(compId) {
  const comp = competitions.find((c) => c.id === compId);
  if (!comp) return;
  try {
    if (comp.apiProvider === "fifa") await syncFifaCompetition(comp);
    else if (comp.apiProvider === "football-data") await syncFootballDataCompetition(comp);
    else if (comp.apiProvider === "cbf") await syncCbfCompetition(comp);
    else if (comp.apiProvider === "conmebol") await syncConmebolCompetition(comp);
  } catch (error) {
    console.error(`❌ [${comp.name}] Erro na sincronização: ${error.message}`);
  }
}

/**
 * Lightweight "score-only" sync that updates live scores and status for a
 * competition without re-fetching the heavy CBF/conmebol payload.
 *
 * - CBF competitions: pulls scores+status from football-data.org and matches
 *   against existing DB rows (no CBF API call required).
 * - football-data competitions: full refresh (already light — single endpoint).
 * - fifa competitions: full refresh (FIFA API matches include scores+status).
 * - conmebol competitions: promote stale-scheduled matches to LIVE by date
 *   (no cheap score-only path, but at least status gets corrected quickly).
 *
 * Used by the scheduler for the "1-minute live cadence" path.
 */
async function refreshLiveScores(compId) {
  const comp = competitions.find((c) => c.id === compId);
  if (!comp) return;

  try {
    if (comp.apiProvider === "cbf") {
      await enrichCbfScoresFromFootballData(comp);
    } else if (comp.apiProvider === "football-data") {
      // Libertadores — football-data is the source itself, so a normal sync here
      // both updates scores and status in one cheap call.
      await syncFootballDataCompetition(comp);
    } else if (comp.apiProvider === "fifa") {
      // FIFA API returns live scores and status directly in the match data.
      await syncFifaCompetition(comp);
    } else if (comp.apiProvider === "conmebol") {
      // Fetch live scores from apiFootball (CONMEBOL scraper doesn't expose scores)
      const liveScores = await apiFootball.getLiveScores(compId, comp.config.footballDataSeason || "2026");
      if (liveScores.length > 0) {
        let scoresUpdated = 0;
        let statusUpdated = 0;
        for (const ls of liveScores) {
          const matches = await prisma.match.findMany({
            where: {
              competitionId: compId,
              OR: [
                { homeTeam: ls.homeTeam },
                { awayTeam: ls.awayTeam }
              ]
            },
            select: { id: true, homeTeam: true, awayTeam: true, status: true, manuallyAdjusted: true }
          });
          for (const m of matches) {
            if (m.manuallyAdjusted) continue;
            if (!isSameTeam(m.homeTeam, ls.homeTeam) || !isSameTeam(m.awayTeam, ls.awayTeam)) continue;

            // Update scores
            if (ls.homeGoals != null && ls.awayGoals != null) {
              await prisma.match.update({
                where: { id: m.id },
                data: { homeScore: ls.homeGoals, awayScore: ls.awayGoals }
              });
              scoresUpdated++;
            }

            // Update status: apiFootball FT/AET/PEN -> FINISHED(0), live statuses -> LIVE(3)
            const apiStatus = ls.status;
            let newStatus = null;
            if (["FT", "AET", "PEN"].includes(apiStatus) && m.status !== 0) {
              newStatus = 0;
            } else if (["1H", "2H", "HT", "ET", "P", "BT"].includes(apiStatus) && m.status !== 3) {
              newStatus = 3;
            }
            if (newStatus !== null) {
              await prisma.match.update({
                where: { id: m.id },
                data: { status: newStatus }
              });
              statusUpdated++;
            }
          }
        }
        if (scoresUpdated > 0) console.log(`  📊 ${scoresUpdated} placares atualizados via apiFootball`);
        if (statusUpdated > 0) console.log(`  📊 ${statusUpdated} status atualizados via apiFootball`);
      }

      // Promote recently-kicked-off matches to LIVE.
      await prisma.match.updateMany({
        where: {
          competitionId: comp.id,
          status: 1,
          date: { lte: new Date(), gte: new Date(Date.now() - 3 * 60 * 60 * 1000) }
        },
        data: { status: 3 }
      });
      // Finish matches that ended more than 2 hours ago.
      await prisma.match.updateMany({
        where: {
          competitionId: comp.id,
          status: 3,
          date: { lt: new Date(Date.now() - 2 * 60 * 60 * 1000) }
        },
        data: { status: 0 }
      });
    }
  } catch (error) {
    console.error(`❌ [${comp.name}] Erro no refresh de placares: ${error.message}`);
  }
}

async function syncMatches() {
  for (const comp of competitions) {
    await syncCompetition(comp.id);
  }
  console.log("\n✅ Sincronização de jogos concluída\n");
}

module.exports = syncMatches;
module.exports.syncCompetition = syncCompetition;
module.exports.refreshLiveScores = refreshLiveScores;
module.exports.enrichCbfScoresFromFootballData = enrichCbfScoresFromFootballData;
