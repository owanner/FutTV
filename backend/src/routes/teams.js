/**
 * Teams routes.
 *
 * GET /teams      — list all teams from standings
 * GET /teams/:code — team detail with matches and stats
 */

const express = require("express");
const router = express.Router();
const prisma = require("../database/prisma");

/**
 * List all teams ordered by group and position.
 */
router.get("/", async (req, res) => {
  try {
    const teams = await prisma.standing.findMany({
      orderBy: [{ groupName: "asc" }, { position: "asc" }]
    });
    res.json(teams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar seleções" });
  }
});

/**
 * Team detail: standing, flag, qualification status, and match history.
 */
router.get("/:code", async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();

    const standing = await prisma.standing.findFirst({
      where: { teamCode: code }
    });

    if (!standing) {
      return res.status(404).json({ error: "Seleção não encontrada" });
    }

    const matches = await prisma.match.findMany({
      where: { OR: [{ homeCode: code }, { awayCode: code }] },
      include: { broadcasts: true },
      orderBy: { date: "asc" }
    });

    const now = new Date();
    const nextMatches = matches.filter(m => m.date > now && m.status === 1);
    const finishedMatches = matches.filter(m => m.status === 0);

    // Determine qualification status based on group position
    const status =
      standing.position <= 2 ? "qualified"
      : standing.position === 3 ? "playoff"
      : "eliminated";

    res.json({
      team: {
        ...standing,
        flag: `https://api.fifa.com/api/v3/picture/flags-sq-4/${code}`,
        status
      },
      nextMatches,
      finishedMatches
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar seleção" });
  }
});

module.exports = router;
