/**
 * Bracket service — generates the Copa do Mundo 2026 knockout bracket.
 */

const prisma = require("../database/prisma");

async function getGroups(competitionId) {
  const standings = await prisma.standing.findMany({
    where: competitionId ? { competitionId } : {},
    orderBy: [{ groupName: "asc" }, { position: "asc" }]
  });

  const groups = {};
  for (const team of standings) {
    if (!groups[team.groupName]) groups[team.groupName] = [];
    groups[team.groupName].push(team);
  }
  return groups;
}

function getBestThirds(groups) {
  const thirds = [];
  Object.values(groups).forEach(group => {
    if (group[2]) thirds.push(group[2]);
  });

  thirds.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  return thirds.slice(0, 8);
}

function generateRoundOf32(groups, bestThirds) {
  return [
    { match: 1, home: groups["Grupo A"]?.[0], away: bestThirds[0] },
    { match: 2, home: groups["Grupo I"]?.[0], away: bestThirds[1] },
    { match: 3, home: groups["Grupo B"]?.[0], away: bestThirds[2] },
    { match: 4, home: groups["Grupo F"]?.[0], away: bestThirds[3] },
    { match: 5, home: groups["Grupo C"]?.[0], away: bestThirds[4] },
    { match: 6, home: groups["Grupo H"]?.[0], away: bestThirds[5] },
    { match: 7, home: groups["Grupo D"]?.[0], away: bestThirds[6] },
    { match: 8, home: groups["Grupo E"]?.[0], away: bestThirds[7] }
  ];
}

async function generateBracket(competitionId) {
  const groups = await getGroups(competitionId);
  const bestThirds = getBestThirds(groups);
  const round32 = generateRoundOf32(groups, bestThirds);

  return {
    generatedAt: new Date(),
    groups,
    bestThirds,
    round32
  };
}

module.exports = { generateBracket };
