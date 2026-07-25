/**
 * Match synchronization — multi-competition.
 * Loops over each registered competition and syncs matches from the appropriate API.
 */

const prisma = require("../database/prisma");
const fifaApi = require("../services/fifaApi");
const footballDataApi = require("../services/footballDataApi");
const cbfApi = require("../services/cbfApi");
const conmebolScraper = require("../services/conmebolScraper");
const { competitions } = require("../config/competitions");

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
  if (status === "IN_PLAY" || status === "PAUSED" || status === "HALFTIME") return 3;
  if (status === "CANCELLED" || status === "POSTPONED" || status === "SUSPENDED") return 4;
  return 1;
}

/**
 * Map football-data.org stage codes to friendly Portuguese labels used in
 * the UI. The football-data "stage" field is a string identifier, not an
 * object, so we normalise it here.
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

function normaliseFbStage(rawStage) {
  if (!rawStage) return "Fase de Grupos";
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
    stageName: normaliseFbStage(stageRaw),
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

  // Update scores and status from football-data.org (CBF returns 0 for all goals)
  if (footballDataLeagueId && process.env.FOOTBALL_DATA_API_KEY) {
    try {
      const fbMatches = await footballDataApi.getMatches(footballDataLeagueId, footballDataSeason);
      let updated = 0;

      for (const fb of fbMatches) {
        if (fb.status !== "FINISHED") continue;
        const homeGoals = fb.score?.fullTime?.home;
        const awayGoals = fb.score?.fullTime?.away;
        if (homeGoals == null || awayGoals == null) continue;

        const fbHome = fb.homeTeam?.name || "";
        const fbAway = fb.awayTeam?.name || "";

        // Find matching CBF match by team name overlap
        const cbfMatch = matches.find((m) => {
          const home = (m.mandante?.nome || "").toLowerCase();
          const away = (m.visitante?.nome || "").toLowerCase();
          return (
            (fbHome.toLowerCase().includes(home.slice(0, 5)) || home.includes(fbHome.toLowerCase().slice(0, 5))) &&
            (fbAway.toLowerCase().includes(away.slice(0, 5)) || away.includes(fbAway.toLowerCase().slice(0, 5)))
          );
        });

        if (cbfMatch) {
          const cbfId = `cbf_${cbfMatch.id_jogo}`;
          await prisma.match.updateMany({
            where: { id: cbfId, status: 0, OR: [{ homeScore: 0 }, { homeScore: null }] },
            data: { homeScore: homeGoals, awayScore: awayGoals }
          });
          updated++;
        }
      }

      // Update live/finished/scheduled status from football-data.org
      let statusUpdated = 0;
      for (const fb of fbMatches) {
        const fbStatus = mapFbStatus(fb.status);
        if (fbStatus === 1) continue;

        const fbHome = fb.homeTeam?.name || "";
        const fbAway = fb.awayTeam?.name || "";

        const cbfMatch = matches.find((m) => {
          const home = (m.mandante?.nome || "").toLowerCase();
          const away = (m.visitante?.nome || "").toLowerCase();
          return (
            (fbHome.toLowerCase().includes(home.slice(0, 5)) || home.includes(fbHome.toLowerCase().slice(0, 5))) &&
            (fbAway.toLowerCase().includes(away.slice(0, 5)) || away.includes(fbAway.toLowerCase().slice(0, 5)))
          );
        });

        if (cbfMatch) {
          const cbfId = `cbf_${cbfMatch.id_jogo}`;
          await prisma.match.updateMany({
            where: { id: cbfId, manuallyAdjusted: false },
            data: { status: fbStatus }
          });
          statusUpdated++;
        }
      }

      if (updated > 0) console.log(`  📊 ${updated} placares atualizados via football-data.org`);
      if (statusUpdated > 0) console.log(`  📊 ${statusUpdated} status atualizados via football-data.org`);
    } catch (err) {
      console.error(`  ⚠ Não foi possível atualizar placares via football-data.org: ${err.message}`);
    }
  }
}

async function syncConmebolCompetition(comp) {
  const { conmebolSlug, fixtureIdRange } = comp.config;
  const seasonId = String(comp.config.footballDataSeason || comp.config.conmebolTournamentId || "2026");
  console.log(`\n⚽ [${comp.name}] Buscando jogos via scraping CONMEBOL...`);

  const start = fixtureIdRange?.start ?? 680;
  const end = fixtureIdRange?.end ?? 1800;

  const fixtures = await conmebolScraper.getAllFixtures(conmebolSlug, start, end);
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
    const status = isFinished ? 0 : 1;

    const matchData = {
      competitionId: comp.id,
      seasonId,
      stageId: f.stageName || null,
      groupId: null,
      groupName: null,
      stageName: conmebolScraper.normaliseStage(f.stageName),
      homeTeam: f.homeTeam,
      homeFlag: null,
      awayTeam: f.awayTeam,
      awayFlag: null,
      homeCode: null,
      awayCode: null,
      date: f.fixtureDate,
      round: null,
      stadium: f.venue || null,
      city: null,
      referee: null,
      attendance: null,
      status,
      homeScore: isFinished ? null : null, // CONMEBOL pages don't expose scores
      awayScore: isFinished ? null : null
    };

    await prisma.match.upsert({
      where: { id: matchId },
      update: matchData,
      create: { id: matchId, ...matchData }
    });
    created++;
  }
  console.log(`  ✅ ${created} partidas sincronizadas`);
}

async function syncMatches() {
  for (const comp of competitions) {
    try {
      if (comp.apiProvider === "fifa") {
        await syncFifaCompetition(comp);
      } else if (comp.apiProvider === "football-data") {
        await syncFootballDataCompetition(comp);
      } else if (comp.apiProvider === "cbf") {
        await syncCbfCompetition(comp);
      } else if (comp.apiProvider === "conmebol") {
        await syncConmebolCompetition(comp);
      }
    } catch (error) {
      console.error(`❌ [${comp.name}] Erro na sincronização: ${error.message}`);
    }
  }
  console.log("\n✅ Sincronização de jogos concluída\n");
}

module.exports = syncMatches;
