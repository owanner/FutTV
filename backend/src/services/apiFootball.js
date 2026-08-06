const axios = require("axios");
const { isSameTeam } = require("../utils/textUtils");

const api = axios.create({
  baseURL: "https://v3.football.api-sports.io",
  timeout: 15000,
  headers: {
    "x-apisports-key": process.env.APISPORTS_KEY || ""
  }
});

function isConfigured() {
  return !!process.env.APISPORTS_KEY;
}

async function getRequest(url, params = {}) {
  if (!isConfigured()) return null;
  const { data } = await api.get(url, { params });
  return data;
}

const LEAGUE_MAP = {
  brasileirao2026: 71,
  copadobrasil2026: 73,
  libertadores2026: 13,
  sulamericana2026: 11
};

async function findFixture(leagueId, season, homeTeam, awayTeam, matchDate) {
  const dateStr = matchDate
    ? new Date(matchDate).toISOString().split("T")[0]
    : null;

  const params = { league: leagueId, season };
  if (dateStr) params.date = dateStr;

  const result = await getRequest("/fixtures", params);
  if (!result || !result.response) return null;

  const fixtures = result.response;
  for (const f of fixtures) {
    const fHome = f.teams?.home?.name || "";
    const fAway = f.teams?.away?.name || "";
    if (!fHome || !fAway) continue;
    if (isSameTeam(fHome, homeTeam) && isSameTeam(fAway, awayTeam)) {
      return f;
    }
  }
  return null;
}

async function getMatchDetails(match) {
  const leagueId = LEAGUE_MAP[match.competitionId];
  if (!leagueId) return { timeline: null, live: null };
  if (!isConfigured()) return { timeline: null, live: null };

  const season = match.seasonId || "2026";

  try {
    const fixture = await findFixture(
      leagueId, season,
      match.homeTeam, match.awayTeam,
      match.date
    );
    if (!fixture) return { timeline: null, live: null };
    const fixtureId = fixture.fixture?.id;
    if (!fixtureId) return { timeline: null, live: null };

    const [eventsResult, lineupsResult] = await Promise.allSettled([
      fixture.events
        ? Promise.resolve(fixture.events)
        : getRequest("/fixtures/events", { fixture: fixtureId }).then(r => r?.response || []),
      getRequest("/fixtures/lineups", { fixture: fixtureId }).then(r => r?.response || [])
    ]);

    const events = eventsResult.status === "fulfilled" ? eventsResult.value : [];
    const lineups = lineupsResult.status === "fulfilled" ? lineupsResult.value : [];

    return {
      timeline: normalizeTimeline(events, fixture),
      live: normalizeLineups(lineups, match)
    };
  } catch {
    return { timeline: null, live: null };
  }
}

function getEventType(event) {
  const type = event.type || "";
  const detail = event.detail || "";
  if (type === "Card") return detail?.includes("Red") ? 3 : 2;
  if (type === "Goal") return 0;
  if (type === "subst" || type === "Substitution") return 5;
  if (type === "Var" || type === "Video VAR") return 71;
  return null;
}

function normalizeTimeline(events, fixture) {
  if (!events || !Array.isArray(events) || events.length === 0) return null;

  const fifaEvents = events
    .map((e, i) => {
      const type = getEventType(e);
      if (type === null) return null;

      const playerName = e.player?.name || "";
      const assistName = e.assist?.name || "";
      let description = playerName;
      let detail = "";

      if (e.type === "subst" || e.type === "Substitution") {
        description = `Entrada: ${playerName}`;
        detail = e.assist?.name ? `Saída: ${e.assist.name}` : "";
      } else if (e.detail?.includes("Own Goal")) {
        description = `Gol contra de ${playerName}`;
      } else if (e.detail?.includes("Penalty")) {
        description = `${playerName} (pênalti)`;
      } else if (e.type === "Goal") {
        description = playerName;
        detail = assistName ? `Assistência: ${assistName}` : "";
      }

      return {
        EventId: `afs_${fixture?.fixture?.id || "?"}_${i}`,
        Type: type,
        MatchMinute: String(e.time?.elapsed ?? e.minute ?? ""),
        TypeLocalized: [{ Description: description }],
        EventDescription: detail ? [{ Description: detail }] : []
      };
    })
    .filter(Boolean);

  if (fifaEvents.length === 0) return null;
  return { Event: fifaEvents };
}

function normalizeLineups(lineups, match) {
  if (!lineups || !Array.isArray(lineups) || lineups.length === 0) return null;

  let homeLineup = null;
  let awayLineup = null;

  for (const lu of lineups) {
    const luTeam = lu.team?.name || "";
    if (!homeLineup && isSameTeam(luTeam, match.homeTeam)) {
      homeLineup = lu;
    } else if (!awayLineup && isSameTeam(luTeam, match.awayTeam)) {
      awayLineup = lu;
    }
  }

  if (!homeLineup || !awayLineup) return null;

  function extractPlayers(arr, status) {
    return (arr || []).map((entry, i) => ({
      IdPlayer: String(entry.player?.id || `afs_p_${i}`),
      ShirtNumber: entry.number || entry.player?.number || 0,
      PlayerName: [{ Description: entry.player?.name || "" }],
      Status: status
    }));
  }

  return {
    HomeTeam: {
      TeamName: [{ Description: homeLineup.team?.name || match.homeTeam }],
      Players: [
        ...extractPlayers(homeLineup.startXI, 1),
        ...extractPlayers(homeLineup.substitutes, 2)
      ]
    },
    AwayTeam: {
      TeamName: [{ Description: awayLineup.team?.name || match.awayTeam }],
      Players: [
        ...extractPlayers(awayLineup.startXI, 1),
        ...extractPlayers(awayLineup.substitutes, 2)
      ]
    }
  };
}

/**
 * Fetch all live + recently finished fixtures for a competition.
 * Returns an array of { homeTeam, awayTeam, homeGoals, awayGoals, status, statusShort }.
 * Used by refreshLiveScores to update CONMEBOL match scores.
 */
async function getLiveScores(competitionId, season) {
  const leagueId = LEAGUE_MAP[competitionId];
  if (!leagueId || !isConfigured()) return [];

  try {
    const result = await getRequest("/fixtures", { league: leagueId, season: season || "2026" });
    if (!result?.response) return [];

    return result.response
      .filter((f) => {
        const s = f.fixture?.status?.short;
        // Include live (1H, 2H, HT, ET, P, BT) and finished (FT, AET, PEN) matches
        return ["1H", "2H", "HT", "ET", "P", "BT", "FT", "AET", "PEN"].includes(s);
      })
      .map((f) => ({
        homeTeam: f.teams?.home?.name || "",
        awayTeam: f.teams?.away?.name || "",
        homeGoals: f.goals?.home ?? null,
        awayGoals: f.goals?.away ?? null,
        status: f.fixture?.status?.short || "",
        statusLong: f.fixture?.status?.long || ""
      }));
  } catch {
    return [];
  }
}

module.exports = { getMatchDetails, getLiveScores, findFixture, isConfigured, normalizeTimeline, normalizeLineups, getRequest };
