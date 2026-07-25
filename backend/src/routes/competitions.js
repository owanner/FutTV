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
 *   id, hasUpcoming, hasLive, nextMatchDate, lastFinishedDate
 *
 * `hasUpcoming` true  -> competition still has scheduled matches in the future
 * `hasLive`     true  -> competition currently has a live match
 * A competition with neither is considered "Encerrada".
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
        map[id].lastFinishedDate = r._max.date;
      }
    }

    // Make sure every configured competition shows up, even with no matches.
    const result = competitions.map((c) =>
      map[c.id] || {
        id: c.id,
        hasUpcoming: false,
        hasLive: false,
        nextMatchDate: null,
        lastFinishedDate: null
      }
    );

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao gerar status das competições" });
  }
});

module.exports = router;

