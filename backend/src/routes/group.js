/**
 * Group detail route.
 *
 * GET /group/:letter?competitionId=wc2026
 */

const express = require("express");
const router = express.Router();
const prisma = require("../database/prisma");
const formatStanding = require("../utils/formatStanding");
const annotateQualifies = require("../utils/annotateQualifies");
const { setCacheHeaders, getCachedOrFetch } = require("../utils/routeHelpers");

router.get("/:letter", async (req, res) => {
  try {
    setCacheHeaders(res, 60, 300);
    await getCachedOrFetch(req, res, async () => {
      const letter = req.params.letter.toUpperCase();
      const groupName = `Grupo ${letter}`;
      const competitionId = req.query.competitionId;
      const where = { groupName, ...(competitionId ? { competitionId } : {}) };

      const [standings, matches] = await Promise.all([
        prisma.standing.findMany({ where, orderBy: { position: "asc" } }),
        prisma.match.findMany({ where, orderBy: { date: "asc" } })
      ]);

      if (standings.length === 0) {
        return null;
      }

      const compId = standings[0].competitionId;
      let formatted = standings.map(formatStanding);

      // For the World Cup, the "best third-placed" ranking is cross-group, so we
      // need the full competition standings to correctly annotate this group.
      if (compId === "wc2026") {
        const allStandings = await prisma.standing.findMany({
          where: { competitionId: compId }
        });
        const allAnnotated = annotateQualifies(allStandings.map(formatStanding));
        const qualifiesById = new Map(
          allAnnotated.map((row) => [row.id, row.qualifies])
        );
        formatted = formatted.map((row) => ({
          ...row,
          qualifies: qualifiesById.get(row.id) || row.qualifies
        }));
      } else {
        formatted = annotateQualifies(formatted);
      }

      return {
        groupName,
        standings: formatted,
        matches
      };
    }, 60_000);

    // Handle null result (group not found)
    if (!res.headersSent) {
      return res.status(404).json({ error: "Grupo não encontrado" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar grupo" });
  }
});

module.exports = router;
