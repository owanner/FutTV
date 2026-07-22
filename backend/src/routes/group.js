/**
 * Group detail route.
 *
 * GET /group/:letter?competitionId=wc2026
 *
 * Returns standings and matches for a specific group.
 */

const express = require("express");
const router = express.Router();
const prisma = require("../database/prisma");
const formatStanding = require("../utils/formatStanding");

router.get("/:letter", async (req, res) => {
  try {
    const letter = req.params.letter.toUpperCase();
    const groupName = `Grupo ${letter}`;
    const competitionId = req.query.competitionId;

    const where = { groupName, ...(competitionId ? { competitionId } : {}) };

    const standings = await prisma.standing.findMany({
      where,
      orderBy: { position: "asc" }
    });

    const matches = await prisma.match.findMany({
      where,
      orderBy: { date: "asc" }
    });

    res.json({
      groupName,
      standings: standings.map(formatStanding),
      matches
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar grupo" });
  }
});

module.exports = router;
