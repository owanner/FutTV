/**
 * Home routes.
 *
 * GET /home              — single-competition home data
 * GET /home/all          — unified cross-competition feed (live + upcoming + recent)
 *
 * The /all endpoint powers the unified home page, returning matches from
 * every competition sorted by date with competition metadata attached.
 */

const express = require("express");
const router = express.Router();
const prisma = require("../database/prisma");
const { competitions } = require("../config/competitions");
const {
  startOfToday,
  endOfToday,
  startOfTomorrow,
  endOfTomorrow
} = require("../utils/dateHelpers");

function competitionFilter(req) {
  const competitionId = req.query.competitionId;
  return competitionId ? { competitionId } : {};
}

/**
 * Single-competition home data (unchanged).
 */
router.get("/", async (req, res) => {
  try {
    const now = new Date();
    const compFilter = competitionFilter(req);

    let featuredMatch = await prisma.match.findFirst({
      where: { status: 3, ...compFilter },
      include: { broadcasts: true }
    });

    if (!featuredMatch) {
      featuredMatch = await prisma.match.findFirst({
        where: { status: { equals: 1, not: 4 }, date: { gte: now }, ...compFilter },
        include: { broadcasts: true },
        orderBy: { date: "asc" }
      });
    }

    const liveMatches = await prisma.match.findMany({
      where: { status: 3, ...compFilter },
      include: { broadcasts: true }
    });

    const todayMatches = await prisma.match.findMany({
      where: { date: { gte: startOfToday(), lte: endOfToday() }, status: { not: 4 }, ...compFilter },
      include: { broadcasts: true },
      orderBy: { date: "asc" }
    });

    const todayResults = await prisma.match.findMany({
      where: { status: 0, date: { gte: startOfToday(), lte: endOfToday() }, ...compFilter },
      orderBy: { date: "desc" }
    });

    const tomorrowMatches = await prisma.match.findMany({
      where: { date: { gte: startOfTomorrow(), lte: endOfTomorrow() }, status: { not: 4 }, ...compFilter },
      include: { broadcasts: true },
      orderBy: { date: "asc" }
    });

    const groupLeaders = await prisma.standing.findMany({
      where: { position: 1, ...compFilter },
      orderBy: { groupName: "asc" }
    });

    res.json({
      generatedAt: new Date(),
      featuredMatch,
      liveMatches,
      todayMatches,
      todayResults,
      tomorrowMatches,
      groupLeaders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao gerar Home" });
  }
});

/**
 * Build a lookup from competitionId → competition metadata (name, colors, slug).
 */
const compMeta = Object.fromEntries(
  competitions.map(c => [c.id, { name: c.name, slug: c.slug, colors: c.colors }])
);

/**
 * GET /home/all
 *
 * Returns a unified feed of live, upcoming (next 7 days), and recent (last 2 days)
 * matches across all competitions, each enriched with competition metadata.
 *
 * Query params:
 *   ?competition=wc2026        — optional, filter to a single competition
 *   ?status=live|upcoming|recent|all  — optional, default "all"
 */
router.get("/all", async (req, res) => {
  try {
    const now = new Date();
    const compId = req.query.competitionId || null;
    const statusFilter = req.query.status || "all";

    const baseWhere = { status: { not: 4 } };
    if (compId) baseWhere.competitionId = compId;

    const fetches = [];

    if (statusFilter === "all" || statusFilter === "live") {
      fetches.push(
        prisma.match.findMany({
          where: { ...baseWhere, status: 3 },
          include: { broadcasts: true }
        }).then(matches => matches.map(m => ({ ...m, _feedSection: "live" })))
      );
    }

    if (statusFilter === "all" || statusFilter === "upcoming") {
      const sevenDays = new Date(now);
      sevenDays.setDate(sevenDays.getDate() + 7);

      fetches.push(
        prisma.match.findMany({
          where: {
            ...baseWhere,
            status: { not: 3, not: 0 },
            date: { gte: now, lte: sevenDays }
          },
          include: { broadcasts: true },
          orderBy: { date: "asc" }
        }).then(matches => matches.map(m => ({ ...m, _feedSection: "upcoming" })))
      );
    }

    if (statusFilter === "all" || statusFilter === "recent") {
      const twoDaysAgo = new Date(now);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      fetches.push(
        prisma.match.findMany({
          where: {
            ...baseWhere,
            status: 0,
            date: { gte: twoDaysAgo, lte: now }
          },
          include: { broadcasts: true },
          orderBy: { date: "desc" }
        }).then(matches => matches.map(m => ({ ...m, _feedSection: "recent" })))
      );
    }

    const sections = await Promise.all(fetches);
    const allMatches = sections.flat();

    const enriched = allMatches.map(match => {
      const meta = compMeta[match.competitionId] || { name: match.competitionId, slug: "", colors: {} };
      return {
        ...match,
        competitionName: meta.name,
        competitionSlug: meta.slug,
        competitionColors: meta.colors
      };
    });

    const byDate = [...enriched].sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      generatedAt: new Date(),
      live: byDate.filter(m => m._feedSection === "live"),
      upcoming: byDate.filter(m => m._feedSection === "upcoming"),
      recent: byDate.filter(m => m._feedSection === "recent")
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao gerar Home unificada" });
  }
});

module.exports = router;
