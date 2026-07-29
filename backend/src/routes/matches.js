/**
 * Matches routes.
 *
 * GET /matches
 * GET /matches/upcoming
 * GET /matches/live
 * GET /matches/finished
 * GET /matches/:id
 * GET /matches/:id/details
 */

const express = require("express");
const router = express.Router();
const prisma = require("../database/prisma");
const detailsService = require("../services/detailsService");
const { competitionFilter } = require("../utils/competitionFilter");
const { STATUS } = require("../utils/matchStatus");
const { MATCH_SELECT, setCacheHeaders, getCachedOrFetch } = require("../utils/routeHelpers");

const CACHE_TTL = {
  LIVE: 15_000,
  UPCOMING: 120_000,
  FINISHED: 300_000,
  DEFAULT: 60_000,
  DETAILS: 15_000,
};

router.get("/", async (req, res) => {
  try {
    setCacheHeaders(res, 60, 300);
    await getCachedOrFetch(req, res, () =>
      prisma.match.findMany({
        where: { status: { not: STATUS.CANCELLED }, ...competitionFilter(req) },
        select: MATCH_SELECT,
        orderBy: { date: "asc" }
      }),
      CACHE_TTL.DEFAULT
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar partidas" });
  }
});

/**
 * Knockout stage ordering. Stages are sorted by this map (lowest first).
 * Unknown stages fall back to a high number so they appear last.
 */
const STAGE_ORDER = [
  "Primeira Fase",
  "Segunda Fase",
  "Terceira Fase",
  "Repescagem",
  "2ª Fase",
  "3ª Fase",
  "Oitavas de Final",
  "8th Finals",
  "Quartas de Final",
  "Quarter-finals",
  "Semifinal",
  "Semi-finals",
  "Final",
  "Finals"
];
function stageOrderIndex(name) {
  const i = STAGE_ORDER.indexOf(name);
  return i === -1 ? 999 : i;
}

/**
 * GET /matches/stages — group matches by stage for knockout competitions.
 * Returns { stages: [{ name, matches: [...] }] } ordered by stage order.
 */
router.get("/stages", async (req, res) => {
  try {
    setCacheHeaders(res, 60, 300);
    await getCachedOrFetch(req, res, async () => {
      const matches = await prisma.match.findMany({
        where: { status: { not: STATUS.CANCELLED }, ...competitionFilter(req) },
        select: MATCH_SELECT,
        orderBy: { date: "asc" }
      });

      const GROUP_STAGES = new Set(["Fase de Grupos", "Group Stage", "1ª Fase"]);
      const knockoutMatches = matches.filter((m) => {
        const stage = m.stageName || m.stageId || "";
        return stage && !GROUP_STAGES.has(stage);
      });

      const groups = {};
      for (const m of knockoutMatches) {
        const stage = m.stageName || "Outros";
        if (!groups[stage]) groups[stage] = [];
        groups[stage].push(m);
      }

      const stages = Object.entries(groups)
        .map(([name, list]) => ({ name, order: stageOrderIndex(name), matches: list }))
        .sort((a, b) => a.order - b.order);

      return { stages };
    }, CACHE_TTL.DEFAULT);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar fases eliminatórias" });
  }
});

router.get("/upcoming", async (req, res) => {
  try {
    setCacheHeaders(res, 120, 600);
    await getCachedOrFetch(req, res, () =>
      prisma.match.findMany({
        where: { status: STATUS.SCHEDULED, ...competitionFilter(req) },
        select: MATCH_SELECT,
        orderBy: { date: "asc" }
      }),
      CACHE_TTL.UPCOMING
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar jogos futuros" });
  }
});

router.get("/live", async (req, res) => {
  try {
    setCacheHeaders(res, 15, 30);
    await getCachedOrFetch(req, res, () =>
      prisma.match.findMany({
        where: { status: STATUS.LIVE, ...competitionFilter(req) },
        select: MATCH_SELECT
      }),
      CACHE_TTL.LIVE
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar jogos ao vivo" });
  }
});

router.get("/finished", async (req, res) => {
  try {
    setCacheHeaders(res, 300, 600);
    await getCachedOrFetch(req, res, () =>
      prisma.match.findMany({
        where: { status: STATUS.FINISHED, ...competitionFilter(req) },
        select: MATCH_SELECT,
        orderBy: { date: "desc" }
      }),
      CACHE_TTL.FINISHED
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar resultados" });
  }
});

router.get("/:id/details", async (req, res) => {
  try {
    setCacheHeaders(res, 15, 30);
    await getCachedOrFetch(req, res, async () => {
      const match = await prisma.match.findUnique({
        where: { id: req.params.id },
        select: MATCH_SELECT
      });

      if (!match) {
        const err = new Error("Partida não encontrada");
        err.statusCode = 404;
        throw err;
      }

      let details = { timeline: null, live: null };
      try {
        details = await detailsService.fetchDetails(match);
      } catch (detailError) {
        console.error("[match details] fetchDetails error:", detailError.message);
      }

      return {
        match,
        timeline: details.timeline,
        live: details.live
      };
    }, CACHE_TTL.DETAILS);
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ error: error.message });
    }
    console.error("[match details] Error:", error);
    res.status(500).json({ error: "Erro ao buscar detalhes" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    setCacheHeaders(res, 30, 120);
    await getCachedOrFetch(req, res, async () => {
      const match = await prisma.match.findUnique({
        where: { id: req.params.id },
        select: MATCH_SELECT
      });

      if (!match) {
        const err = new Error("Partida não encontrada");
        err.statusCode = 404;
        throw err;
      }

      return match;
    }, CACHE_TTL.DEFAULT);
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar partida" });
  }
});

module.exports = router;
