/**
 * Match synchronization from the FIFA API.
 * Fetches all matches across all stages, upserts them into the database,
 * and syncs broadcast information for each match.
 *
 * Cron scheduling is handled in server.js, not here.
 */

const prisma = require("../database/prisma");
const fifaApi = require("../services/fifaApi");

/**
 * Extracts referee name from FIFA match officials array.
 */
function extractReferee(match) {
  if (!match.Officials || match.Officials.length === 0) return null;
  return match.Officials[0]?.Name?.[0]?.Description || null;
}

/**
 * Extracts team name from FIFA team object.
 */
function extractTeamName(team) {
  return team?.TeamName?.[0]?.Description || null;
}

/**
 * Extracts team flag URL, replacing format/size placeholders.
 */
function extractTeamFlag(team) {
  return team?.PictureUrl
    ?.replace("{format}", "sq")
    ?.replace("{size}", "4");
}

/**
 * Builds the common match data object for create/update operations.
 */
function buildMatchData(match) {
  return {
    competitionId: match.IdCompetition,
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

/**
 * Syncs broadcast channels for a single match.
 * Deletes existing broadcasts and recreates them from the FIFA API.
 */
async function syncBroadcasts(matchId, seasonId) {
  const broadcasts = await fifaApi.getBroadcasts(seasonId, matchId);

  // Atomic-like: delete all then create new ones
  await prisma.broadcast.deleteMany({ where: { matchId } });

  if (broadcasts.length > 0) {
    await prisma.broadcast.createMany({
      data: broadcasts.map(channel => ({
        matchId,
        channelId: channel.IdChannel,
        name: channel.Name,
        logo: channel.Logo,
        url: channel.Url,
        language: channel.Language
      }))
    });
  }
}

/**
 * Main synchronization function.
 * Fetches all matches from FIFA API and upserts them into the local database,
 * including broadcast information for each match.
 */
async function syncMatches() {
  try {
    console.log("\n⚽ Iniciando sincronização FIFA...");

    const matches = await fifaApi.getAllMatches();
    console.log(`📅 Total de jogos encontrados: ${matches.length}`);

    for (const match of matches) {
      const matchId = match.IdMatch;
      const matchData = buildMatchData(match);

      // Upsert match record
      await prisma.match.upsert({
        where: { id: matchId },
        update: matchData,
        create: { id: matchId, ...matchData }
      });

      // Sync broadcasts (non-critical, won't crash the sync)
      try {
        await syncBroadcasts(matchId, match.IdSeason);
      } catch (error) {
        console.log(`⚠ Sem transmissões para ${matchId}`);
      }
    }

    console.log("\n✅ Sincronização concluída\n");
  } catch (error) {
    console.error("❌ Erro na sincronização:", error.message);
  }
}

module.exports = syncMatches;
