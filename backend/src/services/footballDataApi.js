/**
 * football-data.org API service.
 * Used for Copa Libertadores match data, standings, and teams.
 * Free tier covers Libertadores (competition code: CLI).
 * Also used to enrich CBF (Brasileirão / Copa do Brasil) with live scores,
 * so it must be resilient to rate-limits and transient network errors.
 */

const axios = require("axios");
const { isSameTeam } = require("../utils/textUtils");

const api = axios.create({
  baseURL: "https://api.football-data.org/v4",
  timeout: 30000,
  headers: {
    "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY || ""
  }
});

/**
 * Lightweight retry wrapper for football-data.org calls.
 * - Retries on network errors and 429/5xx.
 * - Exponential backoff: 1s, 2s, 4s (max 3 attempts).
 * - Respecting a 429 Retry-After header when present.
 */
async function withRetry(fn, maxAttempts = 3) {
  let attempt = 0;
  /* eslint-disable no-constant-condition */
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      const status = err?.response?.status;
      const isRetryable =
        !err.response || // network error
        status === 429 ||
        (status >= 500 && status < 600);
      if (attempt >= maxAttempts || !isRetryable) throw err;

      const retryAfter = err.response?.headers?.["retry-after"];
      let delay;
      if (retryAfter) {
        // Retry-After may be either seconds or HTTP-date
        delay = /^\d+$/.test(retryAfter)
          ? parseInt(retryAfter, 10) * 1000
          : Math.max(0, new Date(retryAfter).getTime() - Date.now());
      } else {
        delay = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s
      }
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  /* eslint-enable no-constant-condition */
}

/**
 * Fetch all matches for a competition/season. Optionally filter by status.
 * @param {string} leagueCode e.g. "BSA", "CLI"
 * @param {number|string} season e.g. 2026
 * @param {string} [status] e.g. "LIVE", "FINISHED", "SCHEDULED"
 */
async function getMatches(leagueCode, season, status) {
  const params = { season };
  if (status) params.status = status;
  return withRetry(async () => {
    const response = await api.get(`/competitions/${leagueCode}/matches`, { params });
    return response.data.matches || [];
  });
}

/**
 * Fetch current standings for a competition/season.
 */
async function getStandings(leagueCode, season) {
  return withRetry(async () => {
    const response = await api.get(`/competitions/${leagueCode}/standings`, { params: { season } });
    return response.data.standings || [];
  });
}

/**
 * Fetch match details (events + lineups) for a specific match.
 * @param {number} matchId — football-data.org match id
 * @returns {object|null} { match: { events, lineups, ... } } or null on failure
 */
async function getMatchDetails(matchId) {
  return withRetry(async () => {
    const response = await api.get(`/matches/${matchId}`);
    return response.data;
  }).catch(() => null);
}

/**
 * Find a football-data.org match by team names within a competition/season.
 * Returns the match's numeric ID (or the full match object) if a match between
 * those teams is found, otherwise null.
 * @param {string} leagueCode  e.g. "BSA", "CLI"
 * @param {string} season      e.g. "2026"
 * @param {string} homeTeamName
 * @param {string} awayTeamName
 * @returns {object|null} { matchId, match } or null
 */
async function findMatchByTeams(leagueCode, season, homeTeamName, awayTeamName) {
  try {
    const matches = await getMatches(leagueCode, season);
    for (const m of matches) {
      if (!m.homeTeam?.name || !m.awayTeam?.name) continue;
      if (isSameTeam(m.homeTeam.name, homeTeamName) && isSameTeam(m.awayTeam.name, awayTeamName)) {
        return { matchId: m.id, match: m };
      }
    }
  } catch {
    return null;
  }
  return null;
}

module.exports = { getMatches, getStandings, getMatchDetails, findMatchByTeams, withRetry };
