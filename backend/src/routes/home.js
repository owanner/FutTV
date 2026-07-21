/**
 * Home route — optimized endpoint for the Fut-TV home page.
 *
 * GET /home
 *
 * Returns: featured match, live matches, today's matches,
 * today's results, tomorrow's matches, and group leaders.
 */

const express = require("express");
const router = express.Router();
const prisma = require("../database/prisma");
const {
  startOfToday,
  endOfToday,
  startOfTomorrow,
  endOfTomorrow
} = require("../utils/dateHelpers");

router.get("/", async (req, res) => {
  try {
    const now = new Date();

    // Featured match: prefer live, then next upcoming
    let featuredMatch = await prisma.match.findFirst({
      where: { status: 3 },
      include: { broadcasts: true }
    });

    if (!featuredMatch) {
      featuredMatch = await prisma.match.findFirst({
        where: { status: 1, date: { gte: now } },
        include: { broadcasts: true },
        orderBy: { date: "asc" }
      });
    }

    // Live matches (status 3 = in progress)
    const liveMatches = await prisma.match.findMany({
      where: { status: 3 },
      include: { broadcasts: true }
    });

    // Today's scheduled matches
    const todayMatches = await prisma.match.findMany({
      where: { date: { gte: startOfToday(), lte: endOfToday() } },
      include: { broadcasts: true },
      orderBy: { date: "asc" }
    });

    // Today's completed results (status 0 = finished)
    const todayResults = await prisma.match.findMany({
      where: { status: 0, date: { gte: startOfToday(), lte: endOfToday() } },
      orderBy: { date: "desc" }
    });

    // Tomorrow's matches
    const tomorrowMatches = await prisma.match.findMany({
      where: { date: { gte: startOfTomorrow(), lte: endOfTomorrow() } },
      include: { broadcasts: true },
      orderBy: { date: "asc" }
    });

    // Group leaders (position 1 in each group)
    const groupLeaders = await prisma.standing.findMany({
      where: { position: 1 },
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

module.exports = router;
