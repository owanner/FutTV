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
const annotateQualifies = require("../utils/annotateQualifies");
const { competitionFilter } = require("../utils/competitionFilter");

router.get("/", async (req, res) => {
  try {
    const standings = await prisma.standing.findMany({
      where: competitionFilter(req),
      orderBy: [{ groupName: "asc" }, { position: "asc" }]
    });
    const formatted = standings.map(formatStanding);
    res.json(annotateQualifies(formatted));
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

    const formatted = annotateQualifies(standings.map(formatStanding));

    const groups = {};
    for (const team of formatted) {
      if (!groups[team.groupName]) {
        groups[team.groupName] = [];
      }
      groups[team.groupName].push(team);
    }

    res.json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar grupos" });
  }
});

module.exports = router;
