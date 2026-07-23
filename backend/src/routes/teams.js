/**
 * Teams routes.
 *
 * GET /teams?competitionId=wc2026      — list all teams from standings
 * GET /teams/:code?competitionId=wc2026 — team detail with matches and stats
 */

const express = require("express");
const router = express.Router();
const prisma = require("../database/prisma");
const { competitionFilter } = require("../utils/competitionFilter");
const { STATUS } = require("../utils/matchStatus");

const FIFA_FLAG_BASE = "https://api.fifa.com/api/v3/picture/flags-sq-4";

router.get("/", async (req, res) => {
  try {
    const teams = await prisma.standing.findMany({
      where: competitionFilter(req),
      orderBy: [{ groupName: "asc" }, { position: "asc" }]
    });
    res.json(teams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar clubes" });
  }
});

router.get("/:code", async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const compFilter = competitionFilter(req);

    const standing = await prisma.standing.findFirst({
      where: { teamCode: code, ...compFilter }
    });

    if (!standing) {
      return res.status(404).json({ error: "Clube não encontrado" });
    }

    const matches = await prisma.match.findMany({
      where: {
        OR: [{ homeCode: code }, { awayCode: code }],
        ...compFilter
      },
      include: { broadcasts: true },
      orderBy: { date: "asc" }
    });

    const now = new Date();
    const nextMatches = matches.filter(m => m.date > now && m.status === STATUS.SCHEDULED);
    const finishedMatches = matches.filter(m => m.status === STATUS.FINISHED);

    const status =
      standing.position <= 2 ? "qualified"
      : standing.position === 3 ? "playoff"
      : "eliminated";

    res.json({
      team: {
        ...standing,
        flag: standing.badge || `${FIFA_FLAG_BASE}/${code}`,
        status
      },
      nextMatches,
      finishedMatches
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar clube" });
  }
});

module.exports = router;
