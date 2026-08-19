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
const { getAdapter } = require("../services/adapters");
const { competitions } = require("../config/competitions");
const { isSameTeam } = require("../utils/textUtils");
const { invalidateTeamIndex } = require("../services/teamIndexService");
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

function mapFbStatus(status, date) {
  if (status === "FINISHED" || status === "AWARDED") return 0;
  if (status === "LIVE" || status === "IN_PLAY" || status === "PAUSED" || status === "HALFTIME") return 3;
  if (status === "CANCELLED" || status === "POSTPONED" || status === "SUSPENDED") return 4;
  if (date) {
    const now = new Date();
    const threeHalfHoursAgo = new Date(now.getTime() - 3.5 * 60 * 60 * 1000);
    if (date > now) return 1;
    if (date >= threeHalfHoursAgo) return 3;
    return 0;
  }
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
  const date = new Date(match.utcDate);

  const hasPenalties = match.score?.penalties?.home != null && match.score?.penalties?.away != null;
  const homeScore = hasPenalties ? (match.score?.regularTime?.home ?? (match.score?.fullTime?.home - match.score.penalties.home)) : (match.score?.fullTime?.home ?? null);
  const awayScore = hasPenalties ? (match.score?.regularTime?.away ?? (match.score?.fullTime?.away - match.score.penalties.away)) : (match.score?.fullTime?.away ?? null);
  const homePenaltyScore = hasPenalties ? match.score.penalties.home : null;
  const awayPenaltyScore = hasPenalties ? match.score.penalties.away : null;

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
    date: date,
    round: match.matchday || null,
    stadium: match.venue || null,
    city: null,
    referee: match.referees?.[0]?.name || null,
    attendance: match.attendance?.toString() || null,
    status: mapFbStatus(match.status, date),
    homeScore,
    awayScore,
    homePenaltyScore,
    awayPenaltyScore
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
 * Enrich CBF matches (Copa do Brasil) with scores + status from apiFootball.
 * Copa do Brasil has no football-data.org integration, so we use apiFootball
 * as the source of truth for scores and live/final status.
 *
 * Accepts an optional `cbfMatches` payload (from CBF API); if not provided,
 * it falls back to using live/recent matches already in the DB.
 */
async function enrichCbfScoresFromApiFootball(comp, cbfMatches) {
  try {
    const liveScores = await apiFootball.getLiveScores(comp.id, comp.config.footballDataSeason || "2026");

    let cbfRows;
    if (cbfMatches && cbfMatches.length) {
      cbfRows = cbfMatches.map((m) => ({
        id: `cbf_${m.id_jogo}`,
        home: m.mandante?.nome || "",
        away: m.visitante?.nome || ""
      }));
    } else {
      // Score-only fallback: consider live, recent scheduled, AND finished
      // matches with 0x0 scores (CBF always returns 0 for goals).
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
      const dbMatches = await prisma.match.findMany({
        where: {
          competitionId: comp.id,
          OR: [
            { status: 3 },
            { status: 1, date: { gte: fourHoursAgo } },
            { status: 0, homeScore: 0, awayScore: 0 }
          ]
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

    for (const ls of liveScores) {
      const row = cbfRows.find(
        (r) => isSameTeam(r.home, ls.homeTeam) && isSameTeam(r.away, ls.awayTeam)
      );
      if (!row) continue;

      if (ls.homeGoals != null && ls.awayGoals != null) {
        await prisma.match.updateMany({
          where: { id: row.id, manuallyAdjusted: false },
          data: { homeScore: ls.homeGoals, awayScore: ls.awayGoals }
        });
        scoresUpdated++;
      }

      const apiStatus = ls.status;
      let newStatus = null;
      if (["FT", "AET", "PEN"].includes(apiStatus)) {
        newStatus = 0;
      } else if (["1H", "2H", "HT", "ET", "P", "BT"].includes(apiStatus)) {
        newStatus = 3;
      }
      if (newStatus !== null) {
        await prisma.match.updateMany({
          where: { id: row.id, manuallyAdjusted: false },
          data: { status: newStatus }
        });
        statusUpdated++;
      }
    }

    if (scoresUpdated > 0) console.log(`  📊 ${scoresUpdated} placares atualizados via apiFootball`);
    if (statusUpdated > 0) console.log(`  📊 ${statusUpdated} status atualizados via apiFootball`);
  } catch (err) {
    console.error(`  ⚠ Não foi possível atualizar placares via apiFootball: ${err.message}`);
  }
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

  // Copa do Brasil has no football-data.org league — use apiFootball instead
  if (!footballDataLeagueId) {
    return enrichCbfScoresFromApiFootball(comp, cbfMatches);
  }
  if (!process.env.FOOTBALL_DATA_API_KEY) return;

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

      const fbStatus = mapFbStatus(fb.status, fb.utcDate ? new Date(fb.utcDate) : null);
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

    // Safety net: finish LIVE matches whose kickoff + 3.5h is in the past.
    // Handles cases where football-data.org is unavailable or doesn't return
    // a match that has already finished.
    const threeHalfHoursAgo = new Date(Date.now() - 3.5 * 60 * 60 * 1000);
    const staleLiveResult = await prisma.match.updateMany({
      where: {
        competitionId: comp.id,
        status: 3,
        date: { lt: threeHalfHoursAgo }
      },
      data: { status: 0 }
    });
    if (staleLiveResult.count > 0) {
      console.log(`  📊 ${staleLiveResult.count} partidas AO VIVO encerradas por timeout (>3.5h)`);
    }
  } catch (err) {
    console.error(`  ⚠ Não foi possível atualizar placares via football-data.org: ${err.message}`);

    // Even if football-data.org fails, finish stale LIVE matches by time
    const threeHalfHoursAgo = new Date(Date.now() - 3.5 * 60 * 60 * 1000);
    const staleLiveResult = await prisma.match.updateMany({
      where: {
        competitionId: comp.id,
        status: 3,
        date: { lt: threeHalfHoursAgo }
      },
      data: { status: 0 }
    });
    if (staleLiveResult.count > 0) {
      console.log(`  📊 ${staleLiveResult.count} partidas AO VIVO encerradas por timeout (>3.5h, fallback)`);
    }
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
      homeTeam: f.homeTeam === "Unknown" ? "A definir" : f.homeTeam,
      homeFlag: f.homeTeam === "Unknown" ? null : (f.homeCrest || null),
      awayTeam: f.awayTeam === "Unknown" ? "A definir" : f.awayTeam,
      awayFlag: f.awayTeam === "Unknown" ? null : (f.awayCrest || null),
      homeCode: null,
      awayCode: null,
      date: f.fixtureDate,
      round: null,
      stadium: f.venue || null,
      city: null,
      referee: f.referee || null,
      attendance: null,
      status,
      homeScore: f.homeScore ?? null,
      awayScore: f.awayScore ?? null
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
    const adapter = getAdapter(comp);
    console.log(`\n⚽ [${comp.name}] Sincronizando partidas via Adapter (${comp.apiProvider})...`);
    const matches = await adapter.getMatches();
    console.log(`📅 ${matches.length} jogos encontrados`);

    let upserted = 0;
    for (const matchData of matches) {
      const existing = await prisma.match.findUnique({
        where: { id: matchData.id },
        select: { manuallyAdjusted: true }
      });
      if (existing?.manuallyAdjusted) {
        console.log(`  ⏭ Pulando ${matchData.id} (ajuste manual)`);
        continue;
      }

      await prisma.match.upsert({
        where: { id: matchData.id },
        update: matchData,
        create: matchData
      });
      upserted++;
    }

    if (comp.apiProvider === "cbf") {
      await enrichCbfMatchesWithTeamCodes(comp);
      await enrichCbfScoresFromFootballData(comp, matches);
    } else if (comp.apiProvider === "fifa") {
      for (const m of matches) {
        try {
          await syncFifaBroadcasts(m.id, m.seasonId);
        } catch {}
      }
    }

    invalidateTeamIndex();
    if (upserted > 0) {
      console.log(`  ✅ ${upserted} partidas sincronizadas`);
    }
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
      if (comp.config.footballDataLeagueId) {
        await enrichCbfScoresFromFootballData(comp);
      } else {
        // Copa do Brasil: no football-data.org, use apiFootball for scores/status
        const liveScores = await apiFootball.getLiveScores(compId, comp.config.footballDataSeason || "2026");
        console.log(`  🔍 apiFootball retornou ${liveScores.length} placares para ${compId}`);
        if (liveScores.length > 0) {
          for (const ls of liveScores) {
            console.log(`    → ${ls.homeTeam} ${ls.homeGoals}–${ls.awayGoals} ${ls.awayTeam} (${ls.status})`);
          }
          // Query all LIVE + recent (last 4h) matches for this competition,
          // then match by team name using isSameTeam (fuzzy match). Using exact
          // DB match (homeTeam: ls.homeTeam) fails when apiFootball returns
          // slightly different names (accents, abbreviations, etc.).
          const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
          const dbMatches = await prisma.match.findMany({
            where: {
              competitionId: compId,
              OR: [{ status: 3 }, { status: 1, date: { gte: fourHoursAgo } }]
            },
            select: { id: true, homeTeam: true, awayTeam: true, status: true, manuallyAdjusted: true }
          });

          let scoresUpdated = 0;
          let statusUpdated = 0;
          let noMatch = 0;
          for (const ls of liveScores) {
            const row = dbMatches.find(
              (m) => isSameTeam(m.homeTeam, ls.homeTeam) && isSameTeam(m.awayTeam, ls.awayTeam)
            );
            if (!row || row.manuallyAdjusted) {
              if (!row) {
                console.log(`    ⚠ Sem correspondência no DB para: ${ls.homeTeam} vs ${ls.awayTeam}`);
                noMatch++;
              }
              continue;
            }

            if (ls.homeGoals != null && ls.awayGoals != null) {
              await prisma.match.update({
                where: { id: row.id },
                data: { homeScore: ls.homeGoals, awayScore: ls.awayGoals }
              });
              scoresUpdated++;
            }

            const apiStatus = ls.status;
            let newStatus = null;
            if (["FT", "AET", "PEN"].includes(apiStatus) && row.status !== 0) {
              newStatus = 0;
            } else if (["1H", "2H", "HT", "ET", "P", "BT"].includes(apiStatus) && row.status !== 3) {
              newStatus = 3;
            }
            if (newStatus !== null) {
              await prisma.match.update({
                where: { id: row.id },
                data: { status: newStatus }
              });
              statusUpdated++;
            }
          }
          if (scoresUpdated > 0) console.log(`  📊 ${scoresUpdated} placares atualizados via apiFootball`);
          if (statusUpdated > 0) console.log(`  📊 ${statusUpdated} status atualizados via apiFootball`);
          if (noMatch > 0) console.log(`  ⚠ ${noMatch} partidas do apiFootball sem correspondência no DB`);
        } else {
          // apiFootball returned 0 results — log LIVE matches still in the DB
          const liveInDb = await prisma.match.findMany({
            where: { competitionId: compId, status: 3 },
            select: { id: true, homeTeam: true, awayTeam: true, date: true }
          });
          if (liveInDb.length > 0) {
            console.log(`  ⚠ apiFootball retornou 0, mas ${liveInDb.length} partidas LIVE no DB:`);
            for (const m of liveInDb) {
              console.log(`    → ${m.homeTeam} vs ${m.awayTeam} (kickoff: ${m.date})`);
            }
          }
        }

        // Safety net: finish LIVE matches whose kickoff + 3.5h is in the past.
        // This handles the case where apiFootball is unavailable or doesn't
        // return the match (rate limit, team name mismatch, etc.).
        const threeHalfHoursAgo = new Date(Date.now() - 3.5 * 60 * 60 * 1000);
        const staleLiveResult = await prisma.match.updateMany({
          where: {
            competitionId: compId,
            status: 3,
            date: { lt: threeHalfHoursAgo }
          },
          data: { status: 0 }
        });
        if (staleLiveResult.count > 0) {
          console.log(`  📊 ${staleLiveResult.count} partidas AO VIVO encerradas por timeout (>3.5h)`);
        }

        // Fallback: finish scheduled matches whose kickoff + 2h is in the past
        await prisma.match.updateMany({
          where: {
            competitionId: compId,
            status: 1,
            date: { lt: new Date(Date.now() - 2 * 60 * 60 * 1000) }
          },
          data: { status: 0 }
        });
        // Promote recently-kicked-off matches to LIVE
        await prisma.match.updateMany({
          where: {
            competitionId: compId,
            status: 1,
            date: { lte: new Date(), gte: new Date(Date.now() - 3 * 60 * 60 * 1000) }
          },
          data: { status: 3 }
        });
      }
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
        // Query all LIVE + recent matches, then match by isSameTeam (fuzzy).
        const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
        const dbMatches = await prisma.match.findMany({
          where: {
            competitionId: compId,
            OR: [{ status: 3 }, { status: 1, date: { gte: fourHoursAgo } }]
          },
          select: { id: true, homeTeam: true, awayTeam: true, status: true, manuallyAdjusted: true }
        });

        let scoresUpdated = 0;
        let statusUpdated = 0;
        for (const ls of liveScores) {
          const row = dbMatches.find(
            (m) => isSameTeam(m.homeTeam, ls.homeTeam) && isSameTeam(m.awayTeam, ls.awayTeam)
          );
          if (!row || row.manuallyAdjusted) continue;

          // Update scores
          if (ls.homeGoals != null && ls.awayGoals != null) {
            await prisma.match.update({
              where: { id: row.id },
              data: { homeScore: ls.homeGoals, awayScore: ls.awayGoals }
            });
            scoresUpdated++;
          }

          // Update status: apiFootball FT/AET/PEN -> FINISHED(0), live statuses -> LIVE(3)
          const apiStatus = ls.status;
          let newStatus = null;
          if (["FT", "AET", "PEN"].includes(apiStatus) && row.status !== 0) {
            newStatus = 0;
          } else if (["1H", "2H", "HT", "ET", "P", "BT"].includes(apiStatus) && row.status !== 3) {
            newStatus = 3;
          }
          if (newStatus !== null) {
            await prisma.match.update({
              where: { id: row.id },
              data: { status: newStatus }
            });
            statusUpdated++;
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
  invalidateTeamIndex();
  console.log("\n✅ Sincronização de jogos concluída\n");
}

/**
 * Refresh scores for recently finished matches that may have 0x0 in the DB.
 * This handles the case where a match finished but its scores were never
 * updated (scraper doesn't expose scores, or the live refresh window was missed).
 *
 * Supported competitions:
 * - CONMEBOL (Sulamericana/Libertadores): scraper doesn't expose scores
 * - Copa do Brasil (CBF without football-data.org): apiFootball may not return the match
 */
async function refreshRecentFinishedScores(compId) {
  const comp = competitions.find((c) => c.id === compId);
  if (!comp) return;
  const isConmebol = comp.apiProvider === "conmebol";
  const isCopaDoBrasil = comp.apiProvider === "cbf" && !comp.config.footballDataLeagueId;
  if (!isConmebol && !isCopaDoBrasil) return;

  try {
    const scores = await apiFootball.getLiveScores(compId, comp.config.footballDataSeason || "2026");
    if (scores.length === 0) return;

    let updated = 0;
    for (const ls of scores) {
      // Only update matches that are FINISHED but have 0x0 (likely wrong)
      const matches = await prisma.match.findMany({
        where: {
          competitionId: compId,
          status: 0,
          homeScore: 0,
          awayScore: 0,
          OR: [
            { homeTeam: ls.homeTeam },
            { awayTeam: ls.awayTeam }
          ]
        },
        select: { id: true, homeTeam: true, awayTeam: true, manuallyAdjusted: true }
      });
      for (const m of matches) {
        if (m.manuallyAdjusted) continue;
        if (!isSameTeam(m.homeTeam, ls.homeTeam) || !isSameTeam(m.awayTeam, ls.awayTeam)) continue;
        if (ls.homeGoals == null || ls.awayGoals == null) continue;

        await prisma.match.update({
          where: { id: m.id },
          data: { homeScore: ls.homeGoals, awayScore: ls.awayGoals }
        });
        updated++;
      }
    }
    if (updated > 0) console.log(`  📊 ${updated} placares de jogos encerrados corrigidos via apiFootball`);
  } catch (error) {
    console.error(`  ⚠ Erro ao corrigir placares recentes: ${error.message}`);
  }
}

module.exports = syncMatches;
module.exports.syncCompetition = syncCompetition;
module.exports.refreshLiveScores = refreshLiveScores;
module.exports.refreshRecentFinishedScores = refreshRecentFinishedScores;
module.exports.enrichCbfScoresFromFootballData = enrichCbfScoresFromFootballData;
