/**
 * Search route.
 *
 * GET /search?q=brasil&competitionId=wc2026
 *
 * Searches teams, matches, and groups.
 */

const express = require("express");
const router = express.Router();
const prisma = require("../database/prisma");

function competitionFilter(req) {
  const competitionId = req.query.competitionId;
  return competitionId ? { competitionId } : {};
}

router.get("/", async (req, res) => {
  try {
    const query = req.query.q;

    if (!query || query.trim() === "") {
      return res.json({ query, teams: [], matches: [], groups: [] });
    }

    const compFilter = competitionFilter(req);

    const teams = await prisma.standing.findMany({
      where: {
        OR: [
          { teamName: { contains: query.trim() } },
          { teamCode: { contains: query.toUpperCase() } }
        ],
        ...compFilter
      },
      orderBy: { teamName: "asc" }
    });

    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { homeTeam: { contains: query.trim() } },
          { awayTeam: { contains: query.trim() } },
          { groupName: { contains: query.trim() } },
          { stageName: { contains: query.trim() } }
        ],
        ...compFilter
      },
      include: { broadcasts: true },
      orderBy: { date: "asc" }
    });

    const groups = await prisma.standing.findMany({
      where: {
        groupName: { contains: query.trim() },
        ...compFilter
      },
      orderBy: [{ groupName: "asc" }, { position: "asc" }]
    });

    res.json({ query, teams, matches, groups });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao pesquisar" });
  }
});

module.exports = router;
