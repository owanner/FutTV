/**
 * Matches routes.
 *
 * GET /matches
 * GET /matches/upcoming
 * GET /matches/live
 * GET /matches/finished
 * GET /matches/:id
 * GET /matches/:id/details
 *
 * All list endpoints accept ?competitionId= query param.
 */

const express = require("express");
const router = express.Router();
const prisma = require("../database/prisma");
const fifaApi = require("../services/fifaApi");

function competitionFilter(req) {
  const competitionId = req.query.competitionId;
  return competitionId ? { competitionId } : {};
}

router.get("/", async (req, res) => {
  try {
    const matches = await prisma.match.findMany({
      where: { status: { not: 4 }, ...competitionFilter(req) },
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
      where: { status: 1, ...competitionFilter(req) },
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
      where: { status: 3, ...competitionFilter(req) },
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
      where: { status: 0, ...competitionFilter(req) },
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
    const matchId = req.params.id;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { broadcasts: true }
    });

    if (!match) {
      return res.status(404).json({ error: "Partida não encontrada" });
    }

    let timeline = null;
    let live = null;

    try {
      timeline = await fifaApi.getTimeline(matchId);
    } catch {
      timeline = null;
    }

    try {
      live = await fifaApi.getLive(matchId);
    } catch {
      live = null;
    }

    res.json({ match, timeline, live });
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
