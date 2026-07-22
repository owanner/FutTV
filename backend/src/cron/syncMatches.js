/**
 * Match synchronization — multi-competition.
 * Loops over each registered competition and syncs matches from the appropriate API.
 */

const prisma = require("../database/prisma");
const fifaApi = require("../services/fifaApi");
const footballDataApi = require("../services/footballDataApi");
const cbfApi = require("../services/cbfApi");
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

function buildFootballDataMatchData(match, compId, seasonId) {
  const homeTeam = match.homeTeam || {};
  const awayTeam = match.awayTeam || {};
  return {
    competitionId: compId,
    seasonId: seasonId,
    stageId: match.stage?.id?.toString() || "",
    groupId: match.group?.name || null,
    groupName: match.group?.name || null,
    stageName: match.stage?.name || null,
    homeTeam: homeTeam.name || null,
    homeFlag: homeTeam.crest || null,
    awayTeam: awayTeam.name || null,
    awayFlag: awayTeam.crest || null,
    homeCode: homeTeam.tla || null,
    awayCode: awayTeam.tla || null,
    date: new Date(match.utcDate),
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

  // Update scores from football-data.org (CBF returns 0 for all goals)
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

      if (updated > 0) console.log(`  📊 ${updated} placares atualizados via football-data.org`);
    } catch (err) {
      console.error(`  ⚠ Não foi possível atualizar placares via football-data.org: ${err.message}`);
    }
  }
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
      }
    } catch (error) {
      console.error(`❌ [${comp.name}] Erro na sincronização: ${error.message}`);
    }
  }
  console.log("\n✅ Sincronização de jogos concluída\n");
}

module.exports = syncMatches;
