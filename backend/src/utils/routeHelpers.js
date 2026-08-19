/**
 * Shared route helpers for caching and Prisma select patterns.
 */

const cache = require("./cache");

/** Prisma select object for Match queries. Shared across routes. */
const MATCH_SELECT = {
  id: true,
  competitionId: true,
  seasonId: true,
  stageId: true,
  groupId: true,
  groupName: true,
  stageName: true,
  homeTeam: true,
  homeFlag: true,
  awayTeam: true,
  awayFlag: true,
  homeCode: true,
  awayCode: true,
  date: true,
  round: true,
  stadium: true,
  city: true,
  referee: true,
  attendance: true,
  status: true,
  homeScore: true,
  awayScore: true,
  homePenaltyScore: true,
  awayPenaltyScore: true,
  manuallyAdjusted: true,
  broadcasts: { select: { id: true, name: true, logo: true, url: true, language: true } }
};

/**
 * Set Cache-Control headers on response.
 */
function setCacheHeaders(res, maxAge, sMaxAge) {
  res.set("Cache-Control", `public, max-age=${maxAge}, s-maxage=${sMaxAge}`);
}

/**
 * Serve cached data or fetch and cache the result.
 * Returns the response via res.json() — does not return a value.
 */
async function getCachedOrFetch(req, res, fetchFn, ttlMs) {
  const cacheKey = cache.key(req);
  const cached = cache.get(cacheKey);
  if (cached) {
    res.set("X-Cache", "HIT");
    return res.json(cached);
  }
  const data = await fetchFn();
  cache.set(cacheKey, data, ttlMs);
  res.set("X-Cache", "MISS");
  res.json(data);
}

module.exports = { MATCH_SELECT, setCacheHeaders, getCachedOrFetch };
