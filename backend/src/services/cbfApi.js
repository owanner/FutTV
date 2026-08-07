/**
 * CBF API service.
 * Fetches Brasileirão Série A match data from the CBF API.
 * Broadcast data is scraped separately from the CBF website.
 */

const axios = require("axios");

const CBF_API_BASE = "https://www.cbf.com.br/api/cbf/jogos/campeonato";
const REQUEST_TIMEOUT_MS = 30000;

/**
 * Lightweight retry for CBF calls.
 * CBF's API is notoriously flaky (ECONNRESET, TLS handshake drops).
 * Retries network errors with 800ms/1600ms backoff.
 */
async function getMatchesWithRetry(url, attempt = 1, maxAttempts = 3) {
  try {
    const { data } = await axios.get(url, {
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
      },
      httpsAgent: new (require("https").Agent)({ rejectUnauthorized: false })
    });
    return data.jogos || [];
  } catch (err) {
    if (attempt >= maxAttempts) throw err;
    const status = err?.response?.status;
    // Retry on network errors and 5xx; do not retry on 4xx (e.g. real 404s).
    const isRetryable = !err.response || (status >= 500 && status < 600);
    if (!isRetryable) throw err;
    const delay = 800 * Math.pow(2, attempt - 1);
    await new Promise((r) => setTimeout(r, delay));
    return getMatchesWithRetry(url, attempt + 1, maxAttempts);
  }
}

/**
 * Fetch all matches for a CBF competition.
 */
async function getMatches(competitionId) {
  const url = `${CBF_API_BASE}/${competitionId}`;
  return getMatchesWithRetry(url);
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
 * 0 = finished (date + 2h is in the past)
 * 3 = live (date is in the past but < 2h ago)
 * 1 = scheduled (date is in the future)
 */
function inferStatus(match) {
  const matchDate = parseCbfDate(match.data, match.hora);
  if (!matchDate) return 1;

  const now = new Date();
  const kickoffMs = matchDate.getTime();
  const twoHoursMs = 2 * 60 * 60 * 1000;

  if (kickoffMs + twoHoursMs < now.getTime()) {
    return 0; // finished
  }
  if (kickoffMs <= now.getTime()) {
    return 3; // live
  }
  return 1; // scheduled
}

/**
 * Map a CBF Copa do Brasil match to a friendly stage name.
 *
 * The CBF API exposes `rodada` (round) but it does NOT map 1:1 to a knockout
 * phase — the same round holds matches from several real stages. We infer
 * the stage from the round number:
 *
 *   - Rounds 1-2: Oitavas de Final (home leg in round 1, away leg in round 2)
 *   - Rounds 3-4: Quartas de Final
 *   - Rounds 5-6: Semifinal
 *   - Round 7: Final
 *   - Other rounds: "Fase Inicial" (qualifying / early rounds)
 */
function inferCbrStage(round, competitionId, status) {
  if (competitionId !== "copadobrasil2026") return null;

  const r = parseInt(round);
  if (Number.isNaN(r)) return "Fase Inicial";

  if (r === 1 || r === 2) return "Oitavas de Final";
  if (r === 3 || r === 4) return "Quartas de Final";
  if (r === 5 || r === 6) return "Semifinal";
  if (r === 7) return "Final";

  // Rounds outside known knockout phases (qualifying, early rounds).
  return "Fase Inicial";
}

/**
 * Build match data in our DB format from a CBF API match object.
 */
function buildMatchData(match, compId, seasonId) {
  const status = inferStatus(match);
  const isFinished = status === 0;
  const isLive = status === 3;

  // Parse scores — Copa do Brasil and knockouts may go to penalties
  const homeGoals = parseInt(match.mandante?.gols);
  const awayGoals = parseInt(match.visitante?.gols);
  const homePens = parseInt(match.mandante?.panaltis);
  const awayPens = parseInt(match.visitante?.panaltis);

  // For knockout finals, the official score includes penalties.
  // We store the regular-time score in homeScore/awayScore, and the
  // penalty shoot-out score in the `panaltis`-prefixed fields below via
  // stadium note (kept simple — future schema add could store pens).
  let homeScore = (isFinished || isLive) ? (isNaN(homeGoals) ? 0 : homeGoals) : null;
  let awayScore = (isFinished || isLive) ? (isNaN(awayGoals) ? 0 : awayGoals) : null;

  const stageName = match.campeonato?.nome_categoria
    || inferCbrStage(match.rodada, compId, status)
    || null;

  // For Copa do Brasil knockouts, embed the penalty result in the stadium
  // string when there was a shoot-out, so the UI can show it.
  let stadium = match.local || null;
  if (isFinished && !isNaN(homePens) && !isNaN(awayPens) && (homePens > 0 || awayPens > 0) && homeScore === awayScore) {
    stadium = `${stadium || ""} (pênaltis ${homePens} x ${awayPens})`.trim();
  }

  return {
    competitionId: compId,
    seasonId,
    stageId: match.rodada ? `RODADA_${match.rodada}` : null,
    groupId: null,
    groupName: null,
    stageName,
    homeTeam: match.mandante?.nome || null,
    homeFlag: match.mandante?.url_escudo || null,
    awayTeam: match.visitante?.nome || null,
    awayFlag: match.visitante?.url_escudo || null,
    homeCode: null,
    awayCode: null,
    date: parseCbfDate(match.data, match.hora),
    round: match.rodada ? parseInt(match.rodada) || null : null,
    stadium,
    city: null,
    referee: null,
    attendance: null,
    status,
    homeScore,
    awayScore
  };
}

module.exports = { getMatches, buildMatchData, inferCbrStage };
