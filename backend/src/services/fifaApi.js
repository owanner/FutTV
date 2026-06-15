/**
 * ==========================================================
 * FIFA API SERVICE
 * ==========================================================
 *
 * Centraliza todas as chamadas para a API da FIFA.
 *
 * Nenhum outro arquivo deve usar axios diretamente.
 *
 * ==========================================================
 */

const axios = require("axios");

/**
 * Cliente HTTP
 */
const api = axios.create({
  baseURL: "https://api.fifa.com/api/v3",
  timeout: 30000
});

/**
 * ==========================================================
 * CONFIGURAÇÕES DA COPA 2026
 * ==========================================================
 */

const COMPETITION_ID = "17";
const SEASON_ID = "285023";
const GROUP_STAGE_ID = "289273";

/**
 * ==========================================================
 * LISTA TODAS AS FASES
 * ==========================================================
 */
async function getStages() {

  const response = await api.get(
    "/stages",
    {
      params: {
        idSeason: SEASON_ID,
        language: "pt"
      }
    }
  );

  return response.data.Results || [];
}

/**
 * ==========================================================
 * LISTA TODOS OS JOGOS DE UMA FASE
 * ==========================================================
 */
async function getMatchesByStage(stageId) {

  const response = await api.get(
    "/calendar/matches",
    {
      params: {
        language: "pt",
        idCompetition: COMPETITION_ID,
        idSeason: SEASON_ID,
        idStage: stageId,
        count: 400
      }
    }
  );

  return response.data.Results || [];
}

/**
 * ==========================================================
 * LISTA TODOS OS JOGOS DA COPA
 * ==========================================================
 *
 * Busca todas as fases automaticamente.
 */
async function getAllMatches() {

  const stages =
    await getStages();

  let allMatches = [];

  for (const stage of stages) {

    const stageName =
      stage.Name?.[0]?.Description ||
      "Sem nome";

    console.log(
      `📂 Buscando fase: ${stageName}`
    );

    const matches =
      await getMatchesByStage(
        stage.IdStage
      );

    console.log(
      `   ${matches.length} jogos encontrados`
    );

    allMatches.push(...matches);
  }

  return allMatches;
}

/**
 * ==========================================================
 * DETALHES DA PARTIDA
 * ==========================================================
 */
async function getMatch(matchId) {

  const response = await api.get(
    `/calendar/${matchId}`,
    {
      params: {
        language: "pt"
      }
    }
  );

  return response.data;
}

/**
 * ==========================================================
 * TRANSMISSÕES
 * ==========================================================
 */
async function getBroadcasts(
  seasonId,
  matchId
) {

  const response = await api.get(
    `/watch/match/${seasonId}/${matchId}/BR`,
    {
      params: {
        language: "pt"
      }
    }
  );

  return response.data.Sources || [];
}

/**
 * ==========================================================
 * CLASSIFICAÇÃO
 * ==========================================================
 */
async function getStandings() {

  const response = await api.get(
    `/calendar/${COMPETITION_ID}/${SEASON_ID}/${GROUP_STAGE_ID}/standing`,
    {
      params: {
        language: "pt",
        count: 200
      }
    }
  );

  return response.data.Results || [];
}

/**
 * ==========================================================
 * TIMELINE
 * ==========================================================
 */
async function getTimeline(matchId) {

  const response = await api.get(
    `/timelines/${matchId}`,
    {
      params: {
        language: "pt"
      }
    }
  );

  return response.data;
}

/**
 * ==========================================================
 * PARTIDA AO VIVO
 * ==========================================================
 */
async function getLive(matchId) {

  const response = await api.get(
    `/live/football/${matchId}`,
    {
      params: {
        language: "pt"
      }
    }
  );

  return response.data;
}

/**
 * ==========================================================
 * EXPORTS
 * ==========================================================
 */

module.exports = {

  COMPETITION_ID,
  SEASON_ID,
  GROUP_STAGE_ID,

  getStages,
  getMatchesByStage,
  getAllMatches,

  getMatch,
  getBroadcasts,
  getStandings,
  getTimeline,
  getLive
};