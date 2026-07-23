/**
 * football-data.org API service.
 * Used for Copa Libertadores match data, standings, and teams.
 * Free tier covers Libertadores (competition code: CLI).
 */

const axios = require("axios");

const api = axios.create({
  baseURL: "https://api.football-data.org/v4",
  timeout: 30000,
  headers: {
    "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY || ""
  }
});

/**
 * Fetch all matches for a competition/season.
 */
async function getMatches(leagueCode, season) {
  const response = await api.get(`/competitions/${leagueCode}/matches`, {
    params: { season }
  });
  return response.data.matches || [];
}

/**
 * Fetch current standings for a competition/season.
 */
async function getStandings(leagueCode, season) {
  const response = await api.get(`/competitions/${leagueCode}/standings`, {
    params: { season }
  });
  return response.data.standings || [];
}

module.exports = { getMatches, getStandings };
