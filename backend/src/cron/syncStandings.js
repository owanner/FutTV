/**
 * Standings synchronization — multi-competition.
 * Loops over each registered competition and syncs standings from the appropriate API.
 */

const prisma = require("../database/prisma");
const fifaApi = require("../services/fifaApi");
const footballDataApi = require("../services/footballDataApi");
const conmebolScraper = require("../services/conmebolScraper");
const { competitions } = require("../config/competitions");
const { STATUS } = require("../utils/matchStatus");

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

function computeStandingsFromMatches(matches, { assignPosition = false } = {}) {
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

  if (assignPosition) {
    sorted.forEach((entry, i) => { entry.position = i + 1; });
  }
  return sorted;
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
    const sorted = computeStandingsFromMatches(groupMatches, { assignPosition: true });

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
      status: STATUS.FINISHED,
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

function buildRowsFromOfficialStandings(comp, seasonId, officialStandings) {
  const rows = [];
  const totalStandings = officialStandings.filter(s => s.type === "TOTAL");

  for (const standing of totalStandings) {
    const groupName = standing.group?.name || null;
    const table = standing.table || [];

    for (const entry of table) {
      const team = entry.team || {};
      rows.push({
        competitionId: comp.id,
        seasonId,
        groupId: groupName || standing.type || "TOTAL",
        groupName: groupName || standing.type || "Classificação",
        teamId: String(team.id),
        teamName: team.shortName || team.name || "Time desconhecido",
        teamCode: team.tla || null,
        badge: team.crest || null,
        position: entry.position || 0,
        played: entry.playedGames || 0,
        wins: entry.won || 0,
        draws: entry.draw || 0,
        losses: entry.lost || 0,
        goalsFor: entry.goalsFor || 0,
        goalsAgainst: entry.goalsAgainst || 0,
        goalDifference: entry.goalDifference || 0,
        points: entry.points || 0
      });
    }
  }
  return rows;
}

function buildRowsFromMatchData(comp, seasonId, matches) {
  const matchesByGroup = {};
  for (const match of matches) {
    const groupName = typeof match.group === "string" ? match.group : match.group?.name;
    if (!groupName) continue;
    if (!matchesByGroup[groupName]) matchesByGroup[groupName] = [];
    matchesByGroup[groupName].push(match);
  }

  if (Object.keys(matchesByGroup).length > 0) {
    return buildGroupStandingRows(comp, seasonId, matchesByGroup);
  }

  const sorted = computeStandingsFromMatches(matches);
  return buildFlatStandingRowsFromMatches(comp, seasonId, sorted);
}

async function syncFootballDataStandings(comp) {
  const { footballDataLeagueId, footballDataSeason } = comp.config;
  const seasonId = String(footballDataSeason);
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;

  console.log(`📊 [${comp.name}] Sincronizando classificação...`);

  let rows = [];

  const matchesResponse = apiKey
    ? await footballDataApi.getMatches(footballDataLeagueId, footballDataSeason).catch(err => {
        console.error(`  ⚠ football-data.org matches API falhou: ${err.message}`);
        return null;
      })
    : null;

  if (matchesResponse && matchesResponse.length > 0) {
    rows = buildRowsFromMatchData(comp, seasonId, matchesResponse);
    console.log(`  Calculando a partir de ${matchesResponse.length} jogos da API...`);
  }

  if (rows.length === 0 && apiKey) {
    const officialStandings = await footballDataApi
      .getStandings(footballDataLeagueId, footballDataSeason)
      .catch(err => {
        console.error(`  ⚠ football-data.org standings API falhou: ${err.message}`);
        return null;
      });

    if (officialStandings && officialStandings.length > 0) {
      rows = buildRowsFromOfficialStandings(comp, seasonId, officialStandings);
      console.log(`  Usando classificação oficial (TOTAL) da API...`);
    }
  }

  if (rows.length === 0) {
    console.log(`  ⚠ Dados da API indisponíveis — calculando do banco local...`);
    await syncStandingsFromLocalMatches(comp, seasonId);
    return;
  }

  const filteredRows = rows.filter(r => r.teamName && r.teamId);
  if (filteredRows.length === 0) {
    console.log(`  ⚠ Nenhuma linha válida para criar`);
    return;
  }

  console.log(`  Criando ${filteredRows.length} registros...`);
  await prisma.$transaction([
    prisma.standing.deleteMany({
      where: { competitionId: comp.id, seasonId }
    }),
    prisma.standing.createMany({ data: filteredRows })
  ]);
  console.log(`  ✅ ${filteredRows.length} registros criados`);

  await applyManualAdjustments(comp.id, seasonId).catch(err => {
    console.error(`  ⚠ Erro ao aplicar ajustes manuais: ${err.message}`);
  });
}

/**
 * Compute standings from local DB matches (fallback when football-data.org API is unavailable).
 * Works for Brasileirão where CBF match scores have been updated from football-data.org.
 */
async function syncStandingsFromLocalMatches(comp, seasonId) {
  const dbMatches = await prisma.match.findMany({
    where: { competitionId: comp.id, status: STATUS.FINISHED },
    select: { homeTeam: true, awayTeam: true, homeScore: true, awayScore: true, homeCode: true, awayCode: true, homeFlag: true, awayFlag: true }
  });

  if (dbMatches.length === 0) {
    console.log(`  ⚠ Nenhum jogo finalizado encontrado no banco de dados local`);
    return;
  }

  const converted = dbMatches
    .filter(m => m.homeScore != null && m.awayScore != null)
    .map(m => ({
      status: "FINISHED",
      homeTeam: { id: m.homeTeam, name: m.homeTeam, tla: m.homeCode, crest: m.homeFlag },
      awayTeam: { id: m.awayTeam, name: m.awayTeam, tla: m.awayCode, crest: m.awayFlag },
      score: { fullTime: { home: m.homeScore, away: m.awayScore } }
    }));

  const sorted = computeStandingsFromMatches(converted);
  const rows = buildFlatStandingRowsFromMatches(comp, seasonId, sorted);

  if (rows.length === 0) {
    console.log(`  ⚠ Não foi possível calcular classificação (placares ausentes)`);
    return;
  }

  await prisma.$transaction([
    prisma.standing.deleteMany({ where: { competitionId: comp.id, seasonId } }),
    prisma.standing.createMany({ data: rows })
  ]);
  console.log(`  ${rows.length} registros calculados do banco local`);
}

async function syncStandings() {
  for (const comp of competitions) {
    try {
      if (comp.apiProvider === "fifa") {
        await syncFifaStandings(comp);
      } else if (comp.apiProvider === "football-data" || comp.config.footballDataLeagueId) {
        await syncFootballDataStandings(comp);
      } else if (comp.apiProvider === "conmebol") {
        // Sulamericana: no free API; compute from locally-scraped matches.
        const seasonId = String(comp.config.footballDataSeason || comp.config.conmebolTournamentId || "2026");
        console.log(`📊 [${comp.name}] Sincronizando classificação a partir de jogos locais...`);
        await syncConmebolStandings(comp, seasonId);
      }
    } catch (error) {
      console.error(`❌ [${comp.name}] Erro ao sincronizar classificação: ${error.message}`);
    }
  }
  console.log("✅ Sincronização de classificação concluída\n");
}

/**
 * Sync standings for a CONMEBOL competition (Sulamericana).
 *
 * The CONMEBOL site renders the group standings client-side from Opta's
 * performfeeds.com API; we proxy the same endpoint via the scraper
 * (`conmebolScraper.scrapeStandings`) so we get the OFFICIAL standings
 * (including the qualified/repescagem/eliminated status, which the local
 * matches alone can't tell us).
 *
 * The Opta payload doesn't include team crests, so we cross-reference each
 * team in a group with the locally-scraped match rows (which store the home/
 * away crest URLs) to fill the `badge` field when possible.
 *
 * Falls back to computing from local matches if the Opta scrape fails.
 */
async function syncConmebolStandings(comp, seasonId) {
  const { conmebolSlug, conmebolTournamentDrupalId, conmebolCompetitionId } = comp.config;

  // First, fetch the official standings from Opta via the scraper.
  const scraperOpts = conmebolCompetitionId ? { expectedCompetitionId: String(conmebolCompetitionId) } : {};
  let optaRows = null;
  if (conmebolTournamentDrupalId) {
    try {
      console.log(`📊 [${comp.name}] Sincronizando classificação via Opta/CONMEBOL...`);
      optaRows = await conmebolScraper.scrapeStandings(conmebolSlug, conmebolTournamentDrupalId, scraperOpts);
    } catch (err) {
      console.warn(`  ⚠ Opta standings scrape falhou: ${err.message}`);
    }
  }

  if (optaRows && optaRows.length > 0) {
    // Build a tidy -> crest map from the locally-scraped match teams so we can
    // decorate Opta rows with their club badge (the Opta payload doesn't ship
    // crests). We match by `teamCode` (most reliable, both come from CONMEBOL).
    const codeToCrest = {};
    const nameToCrest = {};
    const localMatches = await prisma.match.findMany({
      where: { competitionId: comp.id },
      select: { homeTeam: true, awayTeam: true, homeCode: true, awayCode: true, homeFlag: true, awayFlag: true }
    });
    for (const m of localMatches) {
      if (m.homeFlag) {
        if (m.homeCode) codeToCrest[m.homeCode] = m.homeFlag;
        nameToCrest[String(m.homeTeam || "").trim().toLowerCase()] = m.homeFlag;
      }
      if (m.awayFlag) {
        if (m.awayCode) codeToCrest[m.awayCode] = m.awayFlag;
        nameToCrest[String(m.awayTeam || "").trim().toLowerCase()] = m.awayFlag;
      }
    }

    function resolveCrest(row) {
      if (row.teamCode && codeToCrest[row.teamCode]) return codeToCrest[row.teamCode];
      const key = String(row.teamName || "").trim().toLowerCase();
      if (nameToCrest[key]) return nameToCrest[key];
      // The Opta name sometimes is the official name (e.g. "CA Mineiro") while
      // the fixture pages use the short name (e.g. "Atlético Mineiro"); try a
      // last-word match as a last resort.
      const lastWord = key.split(/\s+/).pop();
      if (lastWord) {
        for (const [n, c] of Object.entries(nameToCrest)) {
          if (n.endsWith(lastWord) || n.includes(lastWord)) return c;
        }
      }
      return null;
    }

    const rows = optaRows.map((r) => ({
      competitionId: comp.id,
      seasonId,
      groupId: r.groupId,
      groupName: r.groupName,
      teamId: r.teamId,
      teamName: r.teamName,
      teamCode: r.teamCode || null,
      badge: resolveCrest(r) || r.badge || null,
      position: r.position || 0,
      played: r.played,
      wins: r.wins,
      draws: r.draws,
      losses: r.losses,
      goalsFor: r.goalsFor,
      goalsAgainst: r.goalsAgainst,
      goalDifference: r.goalDifference,
      points: r.points,
      qualifies: r.qualifies || null
    }));

    const filteredRows = rows.filter((r) => r.teamName && r.teamId);
    if (filteredRows.length > 0) {
      await prisma.$transaction([
        prisma.standing.deleteMany({ where: { competitionId: comp.id, seasonId } }),
        prisma.standing.createMany({ data: filteredRows })
      ]);
      console.log(`  ✅ ${filteredRows.length} registros criados via Opta (com status de qualificação)`);
      await applyManualAdjustments(comp.id, seasonId).catch((err) => {
        console.error(`  ⚠ Erro ao aplicar ajustes manuais: ${err.message}`);
      });
      return;
    }
  }

  // Fallback: compute from locally-scraped matches (matches the previous
  // implementation, but with the bug fixed).
  console.log(`  ⚠ Opta indisponível — calculando classificação a partir de jogos locais...`);
  await syncConmebolStandingsFromLocalMatches(comp, seasonId);
}

/**
 * Fallback path: compute Sulamericana group standings from locally-scraped
 * matches. Used only when the Opta standings scrape fails. Note that this
 * cannot derive qualification status (qualified / playoff / eliminated)
 * because group ordering alone doesn't capture cross-group comparisons.
 */
async function syncConmebolStandingsFromLocalMatches(comp, seasonId) {
  const matches = await prisma.match.findMany({
    where: {
      competitionId: comp.id,
      stageName: "Fase de Grupos",
      OR: [{ status: 0 }, { status: 3 }]
    }
  });

  const byGroup = {};
  matches.forEach((m) => {
    const gid = m.groupName || "Classificação";
    if (!byGroup[gid]) byGroup[gid] = [];
    byGroup[gid].push(m);
  });

  if (Object.keys(byGroup).length === 0) {
    console.log(`  ⚠ Nenhum jogo da fase de grupos encontrado; pulando Sulamericana.`);
    return;
  }

  const rows = [];
  let nextId = 1;
  for (const [groupName, groupMatches] of Object.entries(byGroup)) {
    const stats = {};
    for (const m of groupMatches) {
      if (m.status !== 0) continue;
      if (m.homeScore == null || m.awayScore == null) continue;
      if (!stats[m.homeTeam]) stats[m.homeTeam] = { teamName: m.homeTeam, badge: m.homeFlag, tla: m.homeCode, played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
      if (!stats[m.awayTeam]) stats[m.awayTeam] = { teamName: m.awayTeam, badge: m.awayFlag, tla: m.awayCode, played: 0, won: 0, draw: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
      const h = stats[m.homeTeam], a = stats[m.awayTeam];
      h.played++; a.played++;
      h.goalsFor += m.homeScore; h.goalsAgainst += m.awayScore;
      a.goalsFor += m.awayScore; a.goalsAgainst += m.homeScore;
      if (m.homeScore > m.awayScore) { h.won++; h.points += 3; a.lost++; }
      else if (m.homeScore < m.awayScore) { a.won++; a.points += 3; h.lost++; }
      else { h.draw++; a.draw++; h.points++; a.points++; }
    }
    const sorted = Object.values(stats).sort((a, b) =>
      b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) || b.goalsFor - a.goalsFor
    );
    sorted.forEach((entry, i) => {
      rows.push({
        competitionId: comp.id,
        seasonId,
        groupId: groupName,
        groupName,
        teamId: `${comp.id}_${entry.teamName}_${nextId++}`,
        teamName: entry.teamName,
        teamCode: entry.tla || null,
        badge: entry.badge || null,
        position: i + 1,
        played: entry.played,
        wins: entry.won,
        draws: entry.draw,
        losses: entry.lost,
        goalsFor: entry.goalsFor,
        goalsAgainst: entry.goalsAgainst,
        goalDifference: entry.goalsFor - entry.goalsAgainst,
        points: entry.points
      });
    });
  }

  await prisma.$transaction([
    prisma.standing.deleteMany({ where: { competitionId: comp.id, seasonId } }),
    prisma.standing.createMany({ data: rows })
  ]);
  console.log(`  ${rows.length} registros calculados do banco local (sem status de qualificação)`);
}

module.exports = syncStandings;
