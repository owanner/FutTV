const fifaApi = require("./fifaApi");
const footballDataApi = require("./footballDataApi");
const apiFootball = require("./apiFootball");
const { competitions } = require("../config/competitions");
const { normalizeFbTimeline, normalizeFbLineups } = require("../utils/normalizeDetails");

function getProvider(competitionId) {
  const comp = competitions.find((c) => c.id === competitionId);
  return comp?.apiProvider || null;
}

function getCompConfig(competitionId) {
  return competitions.find((c) => c.id === competitionId)?.config || null;
}

function extractFbMatchId(matchId) {
  if (typeof matchId !== "string") return null;
  const prefix = "fb_";
  if (!matchId.startsWith(prefix)) return null;
  const num = parseInt(matchId.slice(prefix.length), 10);
  return Number.isFinite(num) ? num : null;
}

function extractApiFootballFixtureId(matchId) {
  if (typeof matchId !== "string") return null;
  const prefix = "af_";
  if (!matchId.startsWith(prefix)) return null;
  const num = parseInt(matchId.slice(prefix.length), 10);
  return Number.isFinite(num) ? num : null;
}

async function fetchFifaDetails(matchId) {
  const [timelineResult, liveResult] = await Promise.allSettled([
    fifaApi.getTimeline(matchId),
    fifaApi.getLive(matchId)
  ]);
  return {
    timeline: timelineResult.status === "fulfilled" ? timelineResult.value : null,
    live: liveResult.status === "fulfilled" ? liveResult.value : null
  };
}

async function fetchFootballDataDetails(matchId, match) {
  const fbMatchId = extractFbMatchId(matchId);
  if (!fbMatchId) return { timeline: null, live: null };
  const data = await footballDataApi.getMatchDetails(fbMatchId);
  if (!data?.match) return { timeline: null, live: null };
  const fbMatch = data.match;
  return {
    timeline: normalizeFbTimeline(fbMatch),
    live: normalizeFbLineups(fbMatch, match.homeTeam, match.awayTeam)
  };
}

async function fetchApiFootballDetails(matchId, match) {
  const fixtureId = extractApiFootballFixtureId(matchId);
  if (!fixtureId) return { timeline: null, live: null };

  try {
    const [eventsResult, lineupsResult] = await Promise.allSettled([
      apiFootball.getRequest("/fixtures/events", { fixture: fixtureId }).then(r => r?.response || []),
      apiFootball.getRequest("/fixtures/lineups", { fixture: fixtureId }).then(r => r?.response || [])
    ]);

    const events = eventsResult.status === "fulfilled" ? eventsResult.value : [];
    const lineups = lineupsResult.status === "fulfilled" ? lineupsResult.value : [];

    return {
      timeline: apiFootball.normalizeTimeline(events, { fixture: { id: fixtureId } }),
      live: apiFootball.normalizeLineups(lineups, match)
    };
  } catch {
    return { timeline: null, live: null };
  }
}

async function fetchCbfDetails(match) {
  if (match.status === 1) return { timeline: null, live: null };

  // Try API-Football first using stored fixture ID if available
  const fixtureId = extractApiFootballFixtureId(match.id);
  if (fixtureId) {
    try {
      const [eventsResult, lineupsResult] = await Promise.allSettled([
        apiFootball.getRequest("/fixtures/events", { fixture: fixtureId }).then(r => r?.response || []),
        apiFootball.getRequest("/fixtures/lineups", { fixture: fixtureId }).then(r => r?.response || [])
      ]);
      const events = eventsResult.status === "fulfilled" ? eventsResult.value : [];
      const lineups = lineupsResult.status === "fulfilled" ? lineupsResult.value : [];
      if (events.length || lineups.length) {
        return {
          timeline: apiFootball.normalizeTimeline(events, { fixture: { id: fixtureId } }),
          live: apiFootball.normalizeLineups(lineups, match)
        };
      }
    } catch {
      // fallback
    }
  }

  // Fall back to team-name search (slower)
  const afResult = await apiFootball.getMatchDetails(match);
  if (afResult.timeline || afResult.live) return afResult;

  // Fall back to football-data.org for Brasileirão (BSA)
  const config = getCompConfig(match.competitionId);
  if (config?.footballDataLeagueId && config?.footballDataSeason) {
    try {
      const found = await footballDataApi.findMatchByTeams(
        config.footballDataLeagueId,
        String(config.footballDataSeason),
        match.homeTeam,
        match.awayTeam
      );
      if (found) {
        const data = await footballDataApi.getMatchDetails(found.matchId);
        if (data?.match) {
          return {
            timeline: normalizeFbTimeline(data.match),
            live: normalizeFbLineups(data.match, match.homeTeam, match.awayTeam)
          };
        }
      }
    } catch {
      // ignore
    }
  }
  return { timeline: null, live: null };
}

async function fetchConmebolDetails(match) {
  // Try API-Football using stored fixture ID if available
  const fixtureId = extractApiFootballFixtureId(match.id);
  if (fixtureId) {
    try {
      const [eventsResult, lineupsResult] = await Promise.allSettled([
        apiFootball.getRequest("/fixtures/events", { fixture: fixtureId }).then(r => r?.response || []),
        apiFootball.getRequest("/fixtures/lineups", { fixture: fixtureId }).then(r => r?.response || [])
      ]);
      const events = eventsResult.status === "fulfilled" ? eventsResult.value : [];
      const lineups = lineupsResult.status === "fulfilled" ? lineupsResult.value : [];
      if (events.length || lineups.length) {
        return {
          timeline: apiFootball.normalizeTimeline(events, { fixture: { id: fixtureId } }),
          live: apiFootball.normalizeLineups(lineups, match)
        };
      }
    } catch {
      // fallback
    }
  }

  // Fall back to team-name search
  const afResult = await apiFootball.getMatchDetails(match);
  if (afResult.timeline || afResult.live) return afResult;

  return { timeline: null, live: null };
}

async function fetchDetails(match) {
  try {
    const provider = getProvider(match.competitionId);

    if (provider === "fifa") return fetchFifaDetails(match.id);
    if (provider === "football-data") return fetchFootballDataDetails(match.id, match);
    if (provider === "cbf") return fetchCbfDetails(match);
    if (provider === "conmebol") return fetchConmebolDetails(match);

    // Fallback: try API-Football
    const afResult = await apiFootball.getMatchDetails(match);
    if (afResult.timeline || afResult.live) return afResult;

    return { timeline: null, live: null };
  } catch (error) {
    console.error("[detailsService] Error fetching details:", error.message);
    return { timeline: null, live: null };
  }
}

module.exports = { fetchDetails };
