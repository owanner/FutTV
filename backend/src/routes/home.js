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
  competitions.map(c => [c.id, { name: c.shortName || c.name, slug: c.slug, colors: c.colors }])
);

/**
 * GET /home/all
 *
 * Returns a unified feed of live, upcoming, and recent
 * matches across all competitions, each enriched with competition metadata.
 *
 * Upcoming matches are grouped by round: for each competition,
 * shows the current round (first round with unfinished matches) and the next round.
 *
 * Query params:
 *   ?competitionId=wc2026        — optional, filter to a single competition
 *   ?status=live|upcoming|recent|all  — optional, default "all"
 */
router.get("/all", async (req, res) => {
  try {
    const now = new Date();
    const compId = req.query.competitionId || null;
    const statusFilter = req.query.status || "all";

    const compWhere = compId ? { competitionId: compId } : {};

    const fetches = [];

    // Live matches
    if (statusFilter === "all" || statusFilter === "live") {
      fetches.push(
        prisma.match.findMany({
          where: { ...compWhere, status: 3 },
          include: { broadcasts: true }
        }).then(matches => matches.map(m => ({ ...m, _feedSection: "live" })))
      );
    }

    // Upcoming: current round + next round per competition
    if (statusFilter === "all" || statusFilter === "upcoming") {
      fetches.push(
        (async () => {
          const upcomingMatches = await prisma.match.findMany({
            where: {
              ...compWhere,
              status: { notIn: [0, 3, 4] },
              date: { gte: now }
            },
            include: { broadcasts: true },
            orderBy: { date: "asc" }
          });

          const compIds = [...new Set(upcomingMatches.map(m => m.competitionId))];
          const roundMatches = [];

          for (const cId of compIds) {
            const compUpcoming = upcomingMatches.filter(m => m.competitionId === cId);

            const roundsWithUpcoming = [...new Set(compUpcoming.map(m => m.round).filter(Boolean))].sort((a, b) => a - b);

            if (roundsWithUpcoming.length === 0) {
              roundMatches.push(...compUpcoming);
              continue;
            }

            const currentRound = roundsWithUpcoming[0];
            const nextRound = currentRound + 1;

            const allCompMatches = await prisma.match.findMany({
              where: {
                competitionId: cId,
                round: { in: [currentRound, nextRound] },
                status: { not: 4 }
              },
              include: { broadcasts: true },
              orderBy: { date: "asc" }
            });

            roundMatches.push(...allCompMatches);
          }

          return roundMatches.map(m => ({ ...m, _feedSection: "upcoming" }));
        })()
      );
    }

    // Recent results
    if (statusFilter === "all" || statusFilter === "recent") {
      const twoDaysAgo = new Date(now);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      fetches.push(
        prisma.match.findMany({
          where: {
            ...compWhere,
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
