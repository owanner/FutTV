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
