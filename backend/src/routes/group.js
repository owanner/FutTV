/**
 * Group detail route.
 *
 * GET /group/:letter?competitionId=wc2026
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

    const [standings, matches] = await Promise.all([
      prisma.standing.findMany({ where, orderBy: { position: "asc" } }),
      prisma.match.findMany({ where, orderBy: { date: "asc" } })
    ]);

    if (standings.length === 0) {
      return res.status(404).json({ error: "Grupo não encontrado" });
    }

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
