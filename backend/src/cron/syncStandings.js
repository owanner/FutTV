/**
 * Standings synchronization — multi-competition.
 * Loops over each registered competition and syncs standings from the appropriate API.
 */

const prisma = require("../database/prisma");
const fifaApi = require("../services/fifaApi");
const footballDataApi = require("../services/footballDataApi");
const { competitions } = require("../config/competitions");

async function syncFifaStandings(comp) {
  const config = comp.config;
  console.log(`📊 [${comp.name}] Sincronizando classificação...`);

  const standings = await fifaApi.getStandings(config);
  console.log(`${standings.length} registros encontrados`);

  await prisma.standing.deleteMany({
    where: { competitionId: comp.id, seasonId: config.seasonId }
  });

  await prisma.standing.createMany({
    data: standings.map(team => ({
      competitionId: comp.id,
      seasonId: config.seasonId,
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
}

const GROUP_LABELS = {
  GROUP_A: "Grupo A",
  GROUP_B: "Grupo B",
  GROUP_C: "Grupo C",
  GROUP_D: "Grupo D",
  GROUP_E: "Grupo E",
  GROUP_F: "Grupo F",
  GROUP_G: "Grupo G",
  GROUP_H: "Grupo H"
};

function computeGroupStandingsFromMatches(matches) {
  const stats = {};

  for (const match of matches) {
    if (match.status !== "FINISHED") continue;
    const home = match.homeTeam;
    const away = match.awayTeam;
    const homeGoals = match.score?.fullTime?.home ?? null;
    const awayGoals = match.score?.fullTime?.away ?? null;
    if (homeGoals === null || awayGoals === null) continue;

    if (!stats[home.id]) {
      stats[home.id] = { team: home, played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 };
    }
    if (!stats[away.id]) {
      stats[away.id] = { team: away, played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 };
    }

    const h = stats[home.id];
    const a = stats[away.id];

    h.played++;
    a.played++;
    h.goalsFor += homeGoals;
    h.goalsAgainst += awayGoals;
    a.goalsFor += awayGoals;
    a.goalsAgainst += homeGoals;

    if (homeGoals > awayGoals) {
      h.won++;
      h.points += 3;
      a.lost++;
    } else if (homeGoals < awayGoals) {
      a.won++;
      a.points += 3;
      h.lost++;
    } else {
      h.draw++;
      a.draw++;
      h.points += 1;
      a.points += 1;
    }
  }

  for (const id of Object.keys(stats)) {
    stats[id].goalDifference = stats[id].goalsFor - stats[id].goalsAgainst;
  }

  const sorted = Object.values(stats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  sorted.forEach((entry, i) => { entry.position = i + 1; });
  return sorted;
}

function computeFlatStandingsFromMatches(matches) {
  const stats = {};

  for (const match of matches) {
    if (match.status !== "FINISHED") continue;
    const home = match.homeTeam;
    const away = match.awayTeam;
    const homeGoals = match.score?.fullTime?.home ?? null;
    const awayGoals = match.score?.fullTime?.away ?? null;
    if (homeGoals === null || awayGoals === null) continue;

    if (!stats[home.id]) {
      stats[home.id] = { team: home, played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 };
    }
    if (!stats[away.id]) {
      stats[away.id] = { team: away, played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 };
    }

    const h = stats[home.id];
    const a = stats[away.id];

    h.played++;
    a.played++;
    h.goalsFor += homeGoals;
    h.goalsAgainst += awayGoals;
    a.goalsFor += awayGoals;
    a.goalsAgainst += homeGoals;

    if (homeGoals > awayGoals) {
      h.won++;
      h.points += 3;
      a.lost++;
    } else if (homeGoals < awayGoals) {
      a.won++;
      a.points += 3;
      h.lost++;
    } else {
      h.draw++;
      a.draw++;
      h.points += 1;
      a.points += 1;
    }
  }

  for (const id of Object.keys(stats)) {
    stats[id].goalDifference = stats[id].goalsFor - stats[id].goalsAgainst;
  }

  return Object.values(stats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });
}

function buildFlatStandingRowsFromMatches(comp, seasonId, sorted) {
  const rows = [];
  sorted.forEach((entry, i) => {
    const team = entry.team || {};
    rows.push({
      competitionId: comp.id,
      seasonId,
      groupId: "Classificação",
      groupName: "Classificação",
      teamId: String(team.id),
      teamName: team.name || "Time desconhecido",
      teamCode: team.tla || null,
      badge: team.crest || null,
      position: i + 1,
      played: entry.played,
      wins: entry.won,
      draws: entry.draw,
      losses: entry.lost,
      goalsFor: entry.goalsFor,
      goalsAgainst: entry.goalsAgainst,
      goalDifference: entry.goalDifference,
      points: entry.points
    });
  });
  return rows;
}

function buildGroupStandingRows(comp, seasonId, matchesByGroup) {
  const rows = [];
  for (const [apiGroupName, groupMatches] of Object.entries(matchesByGroup)) {
    const displayName = GROUP_LABELS[apiGroupName] || apiGroupName;
    const sorted = computeGroupStandingsFromMatches(groupMatches);

    for (const entry of sorted) {
      const team = entry.team || {};
      rows.push({
        competitionId: comp.id,
        seasonId,
        groupId: apiGroupName,
        groupName: displayName,
        teamId: String(team.id),
        teamName: team.name || "Time desconhecido",
        teamCode: team.tla || null,
        badge: team.crest || null,
        position: entry.position,
        played: entry.played,
        wins: entry.won,
        draws: entry.draw,
        losses: entry.lost,
        goalsFor: entry.goalsFor,
        goalsAgainst: entry.goalsAgainst,
        goalDifference: entry.goalDifference,
        points: entry.points
      });
    }
  }
  return rows;
}

async function applyManualAdjustments(compId, seasonId) {
  const manualMatches = await prisma.match.findMany({
    where: {
      competitionId: compId,
      status: 0,
      manuallyAdjusted: true,
      homeScore: { not: null },
      awayScore: { not: null }
    }
  });

  if (manualMatches.length === 0) return;

  console.log(`  🔧 Reaplicando ${manualMatches.length} resultado(s) manual(is)...`);

  for (const match of manualMatches) {
    const homeStanding = await prisma.standing.findFirst({
      where: { competitionId: compId, seasonId, teamName: match.homeTeam }
    });
    const awayStanding = await prisma.standing.findFirst({
      where: { competitionId: compId, seasonId, teamName: match.awayTeam }
    });

    if (!homeStanding || !awayStanding) {
      console.log(`    ⚠ Time não encontrado na classificação: ${match.homeTeam} ou ${match.awayTeam}`);
      continue;
    }

    const homeGoals = match.homeScore;
    const awayGoals = match.awayScore;

    // Update home team
    const hUpdates = { played: homeStanding.played + 1, goalsFor: homeStanding.goalsFor + homeGoals, goalsAgainst: homeStanding.goalsAgainst + awayGoals };
    if (homeGoals > awayGoals) { hUpdates.wins = homeStanding.wins + 1; hUpdates.points = homeStanding.points + 3; }
    else if (homeGoals < awayGoals) { hUpdates.losses = homeStanding.losses + 1; }
    else { hUpdates.draws = homeStanding.draws + 1; hUpdates.points = homeStanding.points + 1; }
    hUpdates.goalDifference = hUpdates.goalsFor - hUpdates.goalsAgainst;

    await prisma.standing.update({ where: { id: homeStanding.id }, data: hUpdates });

    // Update away team
    const aUpdates = { played: awayStanding.played + 1, goalsFor: awayStanding.goalsFor + awayGoals, goalsAgainst: awayStanding.goalsAgainst + homeGoals };
    if (awayGoals > homeGoals) { aUpdates.wins = awayStanding.wins + 1; aUpdates.points = awayStanding.points + 3; }
    else if (awayGoals < homeGoals) { aUpdates.losses = awayStanding.losses + 1; }
    else { aUpdates.draws = awayStanding.draws + 1; aUpdates.points = awayStanding.points + 1; }
    aUpdates.goalDifference = aUpdates.goalsFor - aUpdates.goalsAgainst;

    await prisma.standing.update({ where: { id: awayStanding.id }, data: aUpdates });

    console.log(`    ✅ ${match.homeTeam} ${homeGoals}x${awayGoals} ${match.awayTeam}`);
  }
}

async function syncFootballDataStandings(comp) {
  const { footballDataLeagueId, footballDataSeason } = comp.config;
  const seasonId = String(footballDataSeason);
  console.log(`📊 [${comp.name}] Sincronizando classificação...`);

  await prisma.standing.deleteMany({
    where: { competitionId: comp.id, seasonId }
  });

  const matches = await footballDataApi.getMatches(footballDataLeagueId, footballDataSeason);

  // Fetch manually adjusted match IDs so we can exclude them from API-based computation
  const manualMatches = await prisma.match.findMany({
    where: { competitionId: comp.id, manuallyAdjusted: true },
    select: { id: true }
  });
  const manualMatchIds = new Set(manualMatches.map(m => m.id));

  const matchesByGroup = {};
  for (const match of matches) {
    if (match.stage !== "GROUP_STAGE") continue;
    const groupName = typeof match.group === "string" ? match.group : match.group?.name;
    if (!groupName) continue;

    // Skip manually adjusted matches — they'll be re-applied below
    const matchId = `fb_${match.id}`;
    if (manualMatchIds.has(matchId)) {
      console.log(`  ⏭ Pulando ${matchId} do cálculo (ajuste manual)`);
      continue;
    }

    if (!matchesByGroup[groupName]) matchesByGroup[groupName] = [];
    matchesByGroup[groupName].push(match);
  }

  let rows;
  if (Object.keys(matchesByGroup).length > 0) {
    rows = buildGroupStandingRows(comp, seasonId, matchesByGroup);
    console.log(`  ${rows.length} registros de grupos calculados`);
  } else {
    // Compute flat standings from all matches (excluding manually adjusted)
    const nonManualMatches = matches.filter(m => !manualMatchIds.has(`fb_${m.id}`));
    const sorted = computeFlatStandingsFromMatches(nonManualMatches);
    rows = buildFlatStandingRowsFromMatches(comp, seasonId, sorted);
    console.log(`  ${rows.length} registros (tabela geral calculada)`);
  }

  if (rows.length > 0) {
    await prisma.standing.createMany({ data: rows });
  }

  // Re-apply manually adjusted match results (W.O., score corrections)
  await applyManualAdjustments(comp.id, seasonId);
}

async function syncStandings() {
  for (const comp of competitions) {
    try {
      if (comp.apiProvider === "fifa") {
        await syncFifaStandings(comp);
      } else if (comp.apiProvider === "football-data" || comp.config.footballDataLeagueId) {
        await syncFootballDataStandings(comp);
      }
    } catch (error) {
      console.error(`❌ [${comp.name}] Erro ao sincronizar classificação: ${error.message}`);
    }
  }
  console.log("✅ Sincronização de classificação concluída\n");
}

module.exports = syncStandings;
