/**
 * Clubs routes.
 * 
 * GET /clubs — list clubs prioritized by competition that have upcoming or live matches
 * GET /clubs/search?q= — search clubs by name or code (includes clubs with finished-only matches)
 * GET /clubs/:code — club detail with ALL matches across competitions
 */

const express = require("express");
const router = express.Router();
const prisma = require("../database/prisma");
const { STATUS } = require("../utils/matchStatus");
const { getAllCompetitions } = require("../config/competitions");
const { getStageDisplayName } = require("../utils/stageNames");
const teamIndexService = require("../services/teamIndexService");
const { setCacheHeaders } = require("../utils/routeHelpers");

// Build competition lookup from canonical config
const COMPETITION_INFO = Object.fromEntries(
  getAllCompetitions().map(c => [c.id, c])
);

/**
 * Annotate a match with competition metadata.
 */
function annotateMatch(m) {
  const meta = COMPETITION_INFO[m.competitionId] || {};
  
  // Fix stage names (e.g., "Repescagem" -> "Oitavas de Final" for Libertadores)
  const displayStageName = getStageDisplayName(m.stageName, m.stageId, m.competitionId);
  
  return {
    ...m,
    competitionName: meta.shortName || meta.name || m.competitionId,
    competitionColors: meta.colors || {},
    stageName: displayStageName,
  };
}

/**
 * Build team info object from a club entry.
 */
function buildTeamInfo(club, standings, allMatches) {
  const sortedStandings = [...(standings || [])].sort((a, b) => {
    const priorityA = teamIndexService.COMPETITION_PRIORITY[a.competitionId] || 99;
    const priorityB = teamIndexService.COMPETITION_PRIORITY[b.competitionId] || 99;
    return priorityA - priorityB;
  });
  const primaryStanding = sortedStandings[0] || null;
  const fallbackMatch = allMatches.find(m => {
    const homeCode = m.homeCode?.toUpperCase();
    const awayCode = m.awayCode?.toUpperCase();
    const clubCodes = new Set([club.teamCode, club.teamId].filter(Boolean).map(c => c.toUpperCase()));
    return clubCodes.has(homeCode) || clubCodes.has(awayCode);
  }) || null;

  let teamInfo;
  if (primaryStanding) {
    const status = primaryStanding.position <= 2
      ? "qualified"
      : primaryStanding.position === 3
        ? "playoff"
        : "eliminated";
    teamInfo = {
      ...primaryStanding,
      flag: primaryStanding.badge || club.badge || (club.teamCode ? `https://api.fifa.com/api/v3/picture/flags-sq-4/${club.teamCode}` : null),
      status,
      competitions: club.competitions.map((c) => COMPETITION_INFO[c]).filter(Boolean),
    };
  } else {
    // Knockout-only club or no standings: build minimal team object
    const teamName = fallbackMatch
      ? (fallbackMatch.homeCode === club.teamCode ? fallbackMatch.homeTeam : fallbackMatch.awayTeam)
      : club.teamName;
    teamInfo = {
      teamId: club.teamId,
      teamName: teamName || club.teamName,
      teamCode: club.teamCode,
      badge: club.badge,
      flag: club.badge || (club.teamCode ? `https://api.fifa.com/api/v3/picture/flags-sq-4/${club.teamCode}` : null),
      status: null,
      competitions: club.competitions.map((c) => COMPETITION_INFO[c]).filter(Boolean),
    };
  }

  return teamInfo;
}

router.get("/", async (req, res) => {
  try {
    setCacheHeaders(res, 30, 60);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = req.query.limit
      ? Math.min(300, Math.max(1, parseInt(req.query.limit)))
      : null;
    const search = req.query.q?.trim() || "";

    // Get active clubs (with upcoming or live matches)
    const activeClubs = await teamIndexService.getActiveClubs();

    // If search query, include ALL clubs (including finished-only)
    let clubs = activeClubs;
    if (search) {
      const allClubs = await teamIndexService.getAllClubs();
      clubs = allClubs;
    }

    // Filter by search
    if (search) {
      const normSearch = search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      clubs = clubs.filter((club) => {
        const name = (club.teamName || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const code = (club.teamCode || "").toUpperCase();
        return name.includes(normSearch) || code.includes(search.toUpperCase());
      });
    }

    const total = clubs.length;
    const paginated = limit ? clubs.slice((page - 1) * limit, page * limit) : clubs;

  // Build response with competition metadata
  const responseClubs = paginated.map((club) => {
    const competitions = club.competitions.map((c) => COMPETITION_INFO[c]).filter(Boolean);
    return {
      teamId: club.teamId,
      teamName: club.teamName,
      teamCode: club.teamCode,
      badge: club.badge,
      priority: club.priority,
      primaryCompetition: club.primaryCompetition,
      standing: club.standing,
      competitions,
      upcomingCount: club.upcomingCount || 0,
      liveCount: club.liveCount || 0,
      key: club.key,
    };
  });

    res.json({
      clubs: responseClubs,
      total,
      page,
      limit: limit || total,
      totalPages: limit ? Math.ceil(total / limit) : 1,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar clubes" });
  }
});

router.get("/search", async (req, res) => {
  try {
    setCacheHeaders(res, 30, 60);
    const query = req.query.q?.trim() || "";

    if (!query) {
      return res.json({ query, clubs: [] });
    }

    const clubs = await teamIndexService.searchClubs(query);

  // Build response with competition metadata
  const responseClubs = clubs.map((club) => {
    const competitions = club.competitions.map((c) => COMPETITION_INFO[c]).filter(Boolean);
    return {
      teamId: club.teamId,
      teamName: club.teamName,
      teamCode: club.teamCode,
      badge: club.badge,
      priority: club.priority,
      primaryCompetition: club.primaryCompetition,
      standing: club.standing,
      competitions,
      upcomingCount: 0,
      liveCount: 0,
      key: club.key,
    };
  });

    res.json({ query, clubs: responseClubs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar clubes" });
  }
});

router.get("/:code", async (req, res) => {
  try {
    res.set("Cache-Control", "public, max-age=30, s-maxage=60");
    const code = req.params.code.toUpperCase();

    // Resolve the team via team index
    const resolved = await teamIndexService.resolveTeam(code);
    if (!resolved) {
      return res.status(404).json({ error: "Clube não encontrado" });
    }

    const club = resolved.club;
    const clubKey = resolved.key;

    // Get all matches for this club
    const allMatches = await teamIndexService.getClubMatches(clubKey);

    if (allMatches.length === 0) {
      // Try to find standings for this club
      const standings = await prisma.standing.findMany({
        where: { teamCode: code },
      });
      if (standings.length === 0) {
        return res.status(404).json({ error: "Clube não encontrado" });
      }
    }

    const now = new Date();

    // Split matches by status
    const nextMatches = allMatches
      .filter((m) => m.date > now && m.status === STATUS.SCHEDULED)
      .map(annotateMatch);
    const finishedMatches = allMatches
      .filter((m) => m.status === STATUS.FINISHED)
      .map(annotateMatch);
    const liveMatches = allMatches
      .filter((m) => m.status === STATUS.LIVE)
      .map(annotateMatch);

    // Load standings for this club
    const standings = await prisma.standing.findMany({
      where: { teamCode: code },
    });

    // Build team info
    const teamInfo = buildTeamInfo(club, standings, allMatches);

    res.json({
      team: teamInfo,
      nextMatches,
      finishedMatches,
      liveMatches,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar clube" });
  }
});

module.exports = router;
