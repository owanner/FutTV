/**
 * Standings synchronization from the FIFA API.
 * Fetches official group stage standings and replaces all local records.
 *
 * Cron scheduling is handled in server.js, not here.
 */

const prisma = require("../database/prisma");
const fifaApi = require("../services/fifaApi");

/**
 * Main synchronization function.
 * Fetches standings from FIFA API and replaces all local standing records.
 */
async function syncStandings() {
  try {
    console.log("\n📊 Sincronizando classificação...");

    const standings = await fifaApi.getStandings();
    console.log(`${standings.length} registros encontrados`);

    // Remove all existing standings and replace with fresh data
    await prisma.standing.deleteMany();

    await prisma.standing.createMany({
      data: standings.map(team => ({
        groupId: team.IdGroup,
        groupName: team.Group?.[0]?.Description || "Grupo desconhecido",
        teamId: team.IdTeam,
        teamName: team.Team?.Name?.[0]?.Description || "Time desconhecido",
        teamCode: team.Team?.Abbreviation || null,
        position: team.Position || 0,
        played: team.Played || 0,
        wins: team.Won || 0,
        draws: team.Drawn || 0,
        losses: team.Lost || 0,
        goalsFor: team.For || 0,
        goalsAgainst: team.Against || 0,
        goalDifference: team.GoalsDiference || 0,
        points: team.Points || 0
      }))
    });

    console.log("✅ Classificação atualizada\n");
  } catch (error) {
    console.error("❌ Erro ao sincronizar classificação:", error.message);
  }
}

module.exports = syncStandings;
