/**
 * FIFA API service.
 * Functions accept a config object with competitionId, seasonId, groupStageId.
 */

const axios = require("axios");

const api = axios.create({
  baseURL: "https://api.fifa.com/api/v3",
  timeout: 30000
});

const DEFAULT_CONFIG = {
  competitionId: "17",
  seasonId: "285023",
  groupStageId: "289273"
};

async function getStages(config = DEFAULT_CONFIG) {
  const response = await api.get("/stages", {
    params: { idSeason: config.seasonId, language: "pt" }
  });
  return response.data.Results || [];
}

async function getMatchesByStage(stageId, config = DEFAULT_CONFIG) {
  const response = await api.get("/calendar/matches", {
    params: {
      language: "pt",
      idCompetition: config.competitionId,
      idSeason: config.seasonId,
      idStage: stageId,
      count: 400
    }
  });
  return response.data.Results || [];
}

async function getAllMatches(config = DEFAULT_CONFIG) {
  const stages = await getStages(config);
  const stageMatches = await Promise.all(
    stages.map(stage => getMatchesByStage(stage.IdStage, config))
  );
  return stageMatches.flat();
}

async function getBroadcasts(seasonId, matchId) {
  const response = await api.get(`/watch/match/${seasonId}/${matchId}/BR`, {
    params: { language: "pt" }
  });
  return response.data.Sources || [];
}

async function getStandings(config = DEFAULT_CONFIG) {
  const response = await api.get(
    `/calendar/${config.competitionId}/${config.seasonId}/${config.groupStageId}/standing`,
    { params: { language: "pt", count: 200 } }
  );
  return response.data.Results || [];
}

async function getTimeline(matchId) {
  const response = await api.get(`/timelines/${matchId}`, {
    params: { language: "pt" }
  });
  return response.data;
}

async function getLive(matchId) {
  const response = await api.get(`/live/football/${matchId}`, {
    params: { language: "pt" }
  });
  return response.data;
}

module.exports = {
  getAllMatches,
  getBroadcasts,
  getStandings,
  getTimeline,
  getLive
};
