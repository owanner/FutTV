/**
 * Search route.
 *
 * GET /search?q=brasil&competitionId=wc2026
 */

const express = require("express");
const router = express.Router();
const prisma = require("../database/prisma");
const { competitionFilter } = require("../utils/competitionFilter");
const { setCacheHeaders, getCachedOrFetch } = require("../utils/routeHelpers");

router.get("/", async (req, res) => {
  try {
    setCacheHeaders(res, 30, 120);
    await getCachedOrFetch(req, res, async () => {
      const query = req.query.q;

      if (!query || query.trim() === "") {
        return { query, teams: [], matches: [], groups: [] };
      }

      const compFilter = competitionFilter(req);
      const trimmed = query.trim();

      const [teams, matches, groups] = await Promise.all([
        prisma.standing.findMany({
          where: {
            OR: [
              { teamName: { contains: trimmed } },
              { teamCode: { contains: query.toUpperCase() } }
            ],
            ...compFilter
          },
          orderBy: { teamName: "asc" }
        }),
        prisma.match.findMany({
          where: {
            OR: [
              { homeTeam: { contains: trimmed } },
              { awayTeam: { contains: trimmed } },
              { groupName: { contains: trimmed } },
              { stageName: { contains: trimmed } }
            ],
            ...compFilter
          },
          include: { broadcasts: true },
          orderBy: { date: "asc" }
        }),
        prisma.standing.findMany({
          where: {
            groupName: { contains: trimmed },
            ...compFilter
          },
          orderBy: [{ groupName: "asc" }, { position: "asc" }]
        })
      ]);

      return { query, teams, matches, groups };
    }, 30_000);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao pesquisar" });
  }
});

module.exports = router;
