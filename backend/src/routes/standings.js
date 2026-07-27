/**
 * Standings routes.
 *
 * GET /standings       — flat list of all standings
 * GET /standings/groups — standings grouped by group name
 *
 * Both accept ?competitionId= query param.
 */

const express = require("express");
const router = express.Router();
const prisma = require("../database/prisma");
const cache = require("../utils/cache");
const formatStanding = require("../utils/formatStanding");
const annotateQualifies = require("../utils/annotateQualifies");
const { competitionFilter } = require("../utils/competitionFilter");

function setCacheHeaders(res, maxAge, sMaxAge) {
  res.set("Cache-Control", `public, max-age=${maxAge}, s-maxage=${sMaxAge}`);
}

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

router.get("/", async (req, res) => {
  try {
    setCacheHeaders(res, 120, 600);
    await getCachedOrFetch(req, res, async () => {
      const standings = await prisma.standing.findMany({
        where: competitionFilter(req),
        orderBy: [{ groupName: "asc" }, { position: "asc" }]
      });
      return annotateQualifies(standings.map(formatStanding));
    }, 120_000);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar classificação" });
  }
});

router.get("/groups", async (req, res) => {
  try {
    setCacheHeaders(res, 120, 600);
    await getCachedOrFetch(req, res, async () => {
      const standings = await prisma.standing.findMany({
        where: competitionFilter(req),
        orderBy: [{ groupName: "asc" }, { position: "asc" }]
      });

      const formatted = annotateQualifies(standings.map(formatStanding));

      const groups = {};
      for (const team of formatted) {
        if (!groups[team.groupName]) {
          groups[team.groupName] = [];
        }
        groups[team.groupName].push(team);
      }

      return groups;
    }, 120_000);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar grupos" });
  }
});

module.exports = router;
