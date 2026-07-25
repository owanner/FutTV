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
const fifaApi = require("../services/fifaApi");
const { competitionFilter } = require("../utils/competitionFilter");
const { STATUS } = require("../utils/matchStatus");

router.get("/", async (req, res) => {
  try {
    const matches = await prisma.match.findMany({
      where: { status: { not: STATUS.CANCELLED }, ...competitionFilter(req) },
      include: { broadcasts: true },
      orderBy: { date: "asc" }
    });
    res.json(matches);
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
    const matches = await prisma.match.findMany({
      where: { status: { not: STATUS.CANCELLED }, ...competitionFilter(req) },
      include: { broadcasts: true },
      orderBy: { date: "asc" }
    });

    // Only keep knockout-style stages — exclude group stage matches.
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

    res.json({ stages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar fases mata-mata" });
  }
});

router.get("/upcoming", async (req, res) => {
  try {
    const matches = await prisma.match.findMany({
      where: { status: STATUS.SCHEDULED, ...competitionFilter(req) },
      include: { broadcasts: true },
      orderBy: { date: "asc" }
    });
    res.json(matches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar jogos futuros" });
  }
});

router.get("/live", async (req, res) => {
  try {
    const matches = await prisma.match.findMany({
      where: { status: STATUS.LIVE, ...competitionFilter(req) },
      include: { broadcasts: true }
    });
    res.json(matches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar jogos ao vivo" });
  }
});

router.get("/finished", async (req, res) => {
  try {
    const matches = await prisma.match.findMany({
      where: { status: STATUS.FINISHED, ...competitionFilter(req) },
      include: { broadcasts: true },
      orderBy: { date: "desc" }
    });
    res.json(matches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar resultados" });
  }
});

router.get("/:id/details", async (req, res) => {
  try {
    const match = await prisma.match.findUnique({
      where: { id: req.params.id },
      include: { broadcasts: true }
    });

    if (!match) {
      return res.status(404).json({ error: "Partida não encontrada" });
    }

    const [timelineResult, liveResult] = await Promise.allSettled([
      fifaApi.getTimeline(req.params.id),
      fifaApi.getLive(req.params.id)
    ]);

    res.json({
      match,
      timeline: timelineResult.status === "fulfilled" ? timelineResult.value : null,
      live: liveResult.status === "fulfilled" ? liveResult.value : null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar detalhes" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const match = await prisma.match.findUnique({
      where: { id: req.params.id },
      include: { broadcasts: true }
    });

    if (!match) {
      return res.status(404).json({ error: "Partida não encontrada" });
    }

    res.json(match);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar partida" });
  }
});

module.exports = router;
