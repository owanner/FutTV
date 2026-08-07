/**
 * Competitions route.
 *
 * GET /competitions        — list available competitions
 * GET /competitions/status — per-competition status flags (active vs finished)
 */

const express = require("express");
const router = express.Router();
const { getAllCompetitions, competitions } = require("../config/competitions");
const prisma = require("../database/prisma");
const { STATUS } = require("../utils/matchStatus");

router.get("/", (req, res) => {
  res.json(getAllCompetitions());
});

/**
 * Returns, for every competition, an object with:
 *   id, hasUpcoming, hasLive, isActive, nextMatchDate, lastFinishedDate
 *
 * `hasUpcoming` true  -> competition still has scheduled matches in the future
 * `hasLive`     true  -> competition currently has a live match
 * `isActive`    true  -> competition is still in progress (format-aware)
 *
 * For knockout / groups-then-knockout formats the competition is only
 * considered "encerrada" once the final match has been played.
 * For league / round-robin formats, "encerrada" means no more scheduled or
 * live matches.
 */
router.get("/status", async (req, res) => {
  try {
    const rows = await prisma.match.groupBy({
      by: ["competitionId", "status"],
      _count: { _all: true },
      _min: { date: true },
      _max: { date: true }
    });

    const map = {};
    for (const r of rows) {
      const id = r.competitionId;
      if (!map[id]) {
        map[id] = {
          id,
          hasUpcoming: false,
          hasLive: false,
          hasFinishedMatch: false,
          nextMatchDate: null,
          lastFinishedDate: null
        };
      }
      if (r.status === STATUS.SCHEDULED) {
        map[id].hasUpcoming = true;
        map[id].nextMatchDate = r._min.date;
      }
      if (r.status === STATUS.LIVE) {
        map[id].hasLive = true;
      }
      if (r.status === STATUS.FINISHED) {
        map[id].hasFinishedMatch = true;
        map[id].lastFinishedDate = r._max.date;
      }
    }

    // Check which competitions have a finished final match.
    const finishedFinals = await prisma.match.findMany({
      where: {
        status: STATUS.FINISHED,
        OR: [
          { stageId: "FINAL" },
          { stageName: "Final" }
        ]
      },
      select: { competitionId: true }
    });
    const finalsByComp = new Set(finishedFinals.map((m) => m.competitionId));

    // Make sure every configured competition shows up, even with no matches.
    const result = competitions.map((c) => {
      const entry = map[c.id] || {
        id: c.id,
        hasUpcoming: false,
        hasLive: false,
        hasFinishedMatch: false,
        nextMatchDate: null,
        lastFinishedDate: null
      };

      const hasFinishedFinal = finalsByComp.has(c.id);
      const format = c.format || "groups";

      // Determine if the competition is still active.
      let isActive;
      if (format === "knockout" || format === "groups-then-knockout") {
        // Knockout: active as long as the final hasn't been played yet
        isActive = entry.hasUpcoming || entry.hasLive || !hasFinishedFinal;
      } else {
        // League / round-robin: active while there are upcoming or live matches
        isActive = entry.hasUpcoming || entry.hasLive;
      }

      return {
        id: c.id,
        hasUpcoming: entry.hasUpcoming,
        hasLive: entry.hasLive,
        isActive,
        nextMatchDate: entry.nextMatchDate,
        lastFinishedDate: entry.lastFinishedDate
      };
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao gerar status das competições" });
  }
});

module.exports = router;

