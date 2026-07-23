/**
 * CBF API service.
 * Fetches Brasileirão Série A match data from the CBF API.
 * Broadcast data is scraped separately from the CBF website.
 */

const axios = require("axios");

const CBF_API_BASE = "https://www.cbf.com.br/api/cbf/jogos/campeonato";
const REQUEST_TIMEOUT_MS = 30000;

/**
 * Fetch all matches for a CBF competition.
 */
async function getMatches(competitionId) {
  const url = `${CBF_API_BASE}/${competitionId}`;
  const { data } = await axios.get(url, {
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    },
    httpsAgent: new (require("https").Agent)({ rejectUnauthorized: false })
  });
  return data.jogos || [];
}

/**
 * Parse CBF date (DD/MM/YYYY) and time (HH:MM) to ISO Date.
 */
function parseCbfDate(dateStr, timeStr) {
  const date = (dateStr || "").trim();
  const time = (timeStr || "").trim();
  if (!date) return null;

  const parts = date.split("/");
  if (parts.length !== 3) return null;

  const [day, month, year] = parts;
  const timePart = time || "00:00";

  return new Date(`${year}-${month}-${day}T${timePart}:00-03:00`);
}

/**
 * Infer match status from CBF data.
 * CBF doesn't have an explicit status field — we infer from date comparison.
 * 0 = finished (date is in the past), 1 = scheduled (date is in the future)
 */
function inferStatus(match) {
  const matchDate = parseCbfDate(match.data, match.hora);
  if (!matchDate) return 1;

  const now = new Date();
  // Consider a match finished if it's at least 2 hours old (to account for match duration)
  const twoHoursMs = 2 * 60 * 60 * 1000;
  if (matchDate.getTime() + twoHoursMs < now.getTime()) {
    return 0; // finished
  }
  return 1; // scheduled
}

/**
 * Build match data in our DB format from a CBF API match object.
 */
function buildMatchData(match, compId, seasonId) {
  const status = inferStatus(match);
  const isFinished = status === 0;

  return {
    competitionId: compId,
    seasonId,
    stageId: "",
    groupId: null,
    groupName: null,
    stageName: match.campeonato?.nome_categoria || null,
    homeTeam: match.mandante?.nome || null,
    homeFlag: match.mandante?.url_escudo || null,
    awayTeam: match.visitante?.nome || null,
    awayFlag: match.visitante?.url_escudo || null,
    homeCode: null,
    awayCode: null,
    date: parseCbfDate(match.data, match.hora),
    round: match.rodada ? parseInt(match.rodada) || null : null,
    stadium: match.local || null,
    city: null,
    referee: null,
    attendance: null,
    status,
    homeScore: isFinished ? parseInt(match.mandante?.gols) || 0 : null,
    awayScore: isFinished ? parseInt(match.visitante?.gols) || 0 : null
  };
}

module.exports = { getMatches, buildMatchData, parseCbfDate };
