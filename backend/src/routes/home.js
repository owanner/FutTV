/**
 * Home routes.
 *
 * GET /home     — single-competition home data
 * GET /home/all — unified cross-competition feed (live + upcoming + recent)
 */

const express = require("express");
const router = express.Router();
const prisma = require("../database/prisma");
const { competitions } = require("../config/competitions");
const { competitionFilter } = require("../utils/competitionFilter");
const {
  startOfToday,
  endOfToday,
  startOfTomorrow,
  endOfTomorrow
} = require("../utils/dateHelpers");
const { STATUS } = require("../utils/matchStatus");

router.get("/", async (req, res) => {
  try {
    const now = new Date();
    const compFilter = competitionFilter(req);

    const [liveMatches, todayMatches, todayResults, tomorrowMatches, groupLeaders] = await Promise.all([
      prisma.match.findMany({
        where: { status: STATUS.LIVE, ...compFilter },
        include: { broadcasts: true }
      }),
      prisma.match.findMany({
        where: { date: { gte: startOfToday(), lte: endOfToday() }, status: { not: STATUS.CANCELLED }, ...compFilter },
        include: { broadcasts: true },
        orderBy: { date: "asc" }
      }),
      prisma.match.findMany({
        where: { status: STATUS.FINISHED, date: { gte: startOfToday(), lte: endOfToday() }, ...compFilter },
        orderBy: { date: "desc" }
      }),
      prisma.match.findMany({
        where: { date: { gte: startOfTomorrow(), lte: endOfTomorrow() }, status: { not: STATUS.CANCELLED }, ...compFilter },
        include: { broadcasts: true },
        orderBy: { date: "asc" }
      }),
      prisma.standing.findMany({
        where: { position: 1, ...compFilter },
        orderBy: { groupName: "asc" }
      })
    ]);

    let featuredMatch = liveMatches[0] || null;
    if (!featuredMatch) {
      featuredMatch = await prisma.match.findFirst({
        where: { status: STATUS.SCHEDULED, date: { gte: now }, ...compFilter },
        include: { broadcasts: true },
        orderBy: { date: "asc" }
      });
    }

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

const compMeta = Object.fromEntries(
  competitions.map(c => [c.id, { name: c.shortName || c.name, slug: c.slug, colors: c.colors }])
);

router.get("/all", async (req, res) => {
  try {
    const now = new Date();
    const compId = req.query.competitionId || null;
    const statusFilter = req.query.status || "all";
    const compWhere = compId ? { competitionId: compId } : {};

    const sevenDays = new Date(now);
    sevenDays.setDate(sevenDays.getDate() + 7);
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const fetches = [];

    if (statusFilter === "all" || statusFilter === "live") {
      fetches.push(
        prisma.match.findMany({
          where: { ...compWhere, status: STATUS.LIVE },
          include: { broadcasts: true }
        }).then(matches => matches.map(m => ({ ...m, _feedSection: "live" })))
      );
    }

    if (statusFilter === "all" || statusFilter === "upcoming") {
      fetches.push(
        prisma.match.findMany({
          where: {
            ...compWhere,
            status: STATUS.SCHEDULED,
            date: { gte: now, lte: sevenDays }
          },
          include: { broadcasts: true },
          orderBy: { date: "asc" }
        }).then(matches => matches.map(m => ({ ...m, _feedSection: "upcoming" })))
      );
    }

    if (statusFilter === "all" || statusFilter === "recent") {
      fetches.push(
        prisma.match.findMany({
          where: {
            ...compWhere,
            status: STATUS.FINISHED,
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
    const live = byDate.filter(m => m._feedSection === "live");
    const upcoming = byDate.filter(m => m._feedSection === "upcoming");
    const recent = byDate.filter(m => m._feedSection === "recent");
    const hasNoMoreRounds = live.length === 0 && upcoming.length === 0 && recent.length > 0;

    res.json({
      generatedAt: new Date(),
      live,
      upcoming,
      recent,
      hasNoMoreRounds
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao gerar Home unificada" });
  }
});

module.exports = router;
