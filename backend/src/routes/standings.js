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
const formatStanding = require("../utils/formatStanding");

function competitionFilter(req) {
  const competitionId = req.query.competitionId;
  return competitionId ? { competitionId } : {};
}

router.get("/", async (req, res) => {
  try {
    const standings = await prisma.standing.findMany({
      where: competitionFilter(req),
      orderBy: [{ groupName: "asc" }, { position: "asc" }]
    });
    res.json(standings.map(formatStanding));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar classificação" });
  }
});

router.get("/groups", async (req, res) => {
  try {
    const standings = await prisma.standing.findMany({
      where: competitionFilter(req),
      orderBy: [{ groupName: "asc" }, { position: "asc" }]
    });

    const groups = {};
    for (const team of standings) {
      const formatted = formatStanding(team);
      if (!groups[formatted.groupName]) {
        groups[formatted.groupName] = [];
      }
      groups[formatted.groupName].push(formatted);
    }

    res.json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar grupos" });
  }
});

module.exports = router;
