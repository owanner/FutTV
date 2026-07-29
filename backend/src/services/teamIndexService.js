/**
 * Team Index Service
 * Single canonical index mapping every team across all competitions
 * (standings + matches) into a unified club object.
 * 
 * Handles edge cases:
 * - Teams with the same code in different competitions (e.g., SAN = Santos FC in CBF, Independiente Santa Fe in CONMEBOL)
 * - Teams without codes (CBF/CONMEBOL teams) - generates synthetic keys
 * - Fuzzy name matching with isSameTeam() for cross-source resolution
 * 
 * Cache: rebuilt every 5 minutes (or on demand) and stored in MemoryCache.
 */

const prisma = require("../database/prisma");
const { isSameTeam, normalizeText } = require("../utils/textUtils");
const { STATUS } = require("../utils/matchStatus");
const cache = require("../utils/cache");

const CACHE_KEY = "teamIndex";
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

const COMPETITION_PRIORITY = {
  brasileirao2026: 1,
  copadobrasil2026: 2,
  libertadores2026: 3,
  sulamericana2026: 4,
  wc2026: 5,
};

/**
 * Build a synthetic key from a team name when no code/ID is available.
 * Used for CBF/CONMEBOL teams that lack teamCode or teamId.
 */
function syntheticKey(name) {
  if (!name) return null;
  const norm = normalizeText(name);
  const words = norm.split(" ").filter(w => w.length >= 3);
  const key = words.slice(0, 4).join("_").substring(0, 40);
  return `_syn_${key}`;
}

/**
 * Build a unique key for a club, handling code conflicts.
 * If a code is shared by multiple teams, we use (code, normalizedName) as the key.
 */
function buildClubKey(teamCode, teamId, teamName) {
  if (teamCode && teamId) {
    return `${teamCode}_${teamId}`;
  }
  if (teamCode) {
    return `${teamCode}_${normalizeText(teamName).substring(0, 10)}`;
  }
  if (teamId) {
    return teamId;
  }
  return syntheticKey(teamName);
}

/**
 * Build the unified team index from DB.
 */
async function buildTeamIndex() {
  const now = new Date();

  // 1. Load ALL standings
  const standings = await prisma.standing.findMany({
    select: {
      teamId: true,
      teamName: true,
      teamCode: true,
      badge: true,
      competitionId: true,
      position: true,
      played: true,
      wins: true,
      draws: true,
      losses: true,
      goalsFor: true,
      goalsAgainst: true,
      goalDifference: true,
      points: true,
      qualifies: true,
      groupName: true,
    },
  });

  // 2. Load ALL matches
  const allMatches = await prisma.match.findMany({
    select: {
      competitionId: true,
      homeTeam: true,
      homeCode: true,
      homeFlag: true,
      awayTeam: true,
      awayCode: true,
      awayFlag: true,
      date: true,
      status: true,
    },
  });

  // 3. Build club entries from standings
  // Use a map of normalized team name -> club to handle code conflicts
  const clubsFromStandings = new Map(); // key -> club
  const codeToKeys = new Map(); // code -> Set<keys> (handles conflicts)
  
  for (const s of standings) {
    const key = buildClubKey(s.teamCode, s.teamId, s.teamName);
    const priority = COMPETITION_PRIORITY[s.competitionId] || 99;
    
    // Track code conflicts
    if (s.teamCode) {
      const upperCode = s.teamCode.toUpperCase();
      if (!codeToKeys.has(upperCode)) {
        codeToKeys.set(upperCode, new Set());
      }
      codeToKeys.get(upperCode).add(key);
    }

    const existing = clubsFromStandings.get(key);

    // Pick highest-priority standing as canonical
    if (!existing || priority < existing.priority) {
      clubsFromStandings.set(key, {
        teamId: s.teamId,
        teamName: s.teamName,
        teamCode: s.teamCode,
        badge: s.badge,
        priority,
        primaryCompetition: s.competitionId,
        standing: {
          position: s.position,
          played: s.played,
          wins: s.wins,
          draws: s.draws,
          losses: s.losses,
          goalsFor: s.goalsFor,
          goalsAgainst: s.goalsAgainst,
          goalDifference: s.goalDifference,
          points: s.points,
          qualifies: s.qualifies,
          groupName: s.groupName,
          competitionId: s.competitionId,
        },
        competitions: new Set([s.competitionId]),
        aliases: new Set([s.teamName]),
      });
    } else if (existing) {
      existing.competitions.add(s.competitionId);
      existing.aliases.add(s.teamName);
      if (!existing.badge && s.badge) existing.badge = s.badge;
    }
  }

  // 4. Process matches and link to clubs
  const clubsFromMatchesOnly = new Map();
  const aliasToKey = new Map();

  for (const m of allMatches) {
    for (const side of ["home", "away"]) {
      const name = side === "home" ? m.homeTeam : m.awayTeam;
      const code = side === "home" ? m.homeCode : m.awayCode;
      const flag = side === "home" ? m.homeFlag : m.awayFlag;
      if (!name) continue;

      let clubKey = null;

      // Try code first - but handle conflicts
      if (code) {
        const upperCode = code.toUpperCase();
        const keysForCode = codeToKeys.get(upperCode);
        if (keysForCode && keysForCode.size === 1) {
          // Unique code - use it directly
          clubKey = Array.from(keysForCode)[0];
        } else if (keysForCode && keysForCode.size > 1) {
          // Code conflict - MUST match by name
          for (const key of keysForCode) {
            const club = clubsFromStandings.get(key);
            if (club && isSameTeam(club.teamName, name)) {
              clubKey = key;
              break;
            }
          }
          // If no match by name, don't use this code - create synthetic key instead
        }
        // If no match found and code doesn't exist in standings, use code as key
        if (!clubKey && (!keysForCode || keysForCode.size === 0)) {
          clubKey = upperCode;
        }
      }

      // If no code match, try fuzzy match against existing clubs
      if (!clubKey) {
        for (const [key, club] of clubsFromStandings.entries()) {
          if (isSameTeam(club.teamName, name)) {
            clubKey = key;
            break;
          }
          for (const alias of club.aliases) {
            if (isSameTeam(alias, name)) {
              clubKey = key;
              break;
            }
          }
          if (clubKey) break;
        }
      }

      // If still no club, create a synthetic entry
      if (!clubKey) {
        const synKey = syntheticKey(name);
        clubKey = synKey;

        if (!clubsFromMatchesOnly.has(synKey)) {
          const priority = COMPETITION_PRIORITY[m.competitionId] || 99;
          clubsFromMatchesOnly.set(synKey, {
            teamId: null,
            teamName: name,
            teamCode: code,
            badge: flag,
            priority,
            primaryCompetition: m.competitionId,
            standing: null,
            competitions: new Set([m.competitionId]),
            aliases: new Set([name]),
          });
        }
        const synthClub = clubsFromMatchesOnly.get(synKey);
        if (isSameTeam(synthClub.teamName, name)) {
          synthClub.aliases.add(name);
        }
        if (!synthClub.badge && flag) {
          synthClub.badge = flag;
        }
        synthClub.competitions.add(m.competitionId);
      }

      // Link match to club
      if (clubKey) {
        if (clubsFromStandings.has(clubKey)) {
          const club = clubsFromStandings.get(clubKey);
          club.competitions.add(m.competitionId);
          // Only add name as alias if it matches the club's canonical name
          // Don't add names that don't belong to this club, even if they have the same code
          if (isSameTeam(club.teamName, name)) {
            if (!club.aliases.has(name)) {
              club.aliases.add(name);
            }
          }
          if (!club.badge && flag) club.badge = flag;
        }

        // Register alias -> canonicalKey mapping
        const norm = normalizeText(name);
        if (!aliasToKey.has(norm)) {
          aliasToKey.set(norm, clubKey);
        }
        if (!aliasToKey.has(name.toLowerCase())) {
          aliasToKey.set(name.toLowerCase(), clubKey);
        }
      }
    }
  }

  // 5. Merge synth clubs into main map
  for (const [key, club] of clubsFromMatchesOnly.entries()) {
    clubsFromStandings.set(key, club);
    const norm = normalizeText(club.teamName);
    if (!aliasToKey.has(norm)) {
      aliasToKey.set(norm, key);
    }
  }

  // 6. Build code -> key mapping (resolving conflicts)
  const codeToKey = new Map();
  for (const [key, club] of clubsFromStandings.entries()) {
    // Register the composite key itself
    codeToKey.set(key, key);
    
    if (club.teamCode) {
      const upperCode = club.teamCode.toUpperCase();
      // If code already exists, only override if this club has higher priority
      const existingKey = codeToKey.get(upperCode);
      if (!existingKey) {
        codeToKey.set(upperCode, key);
      } else {
        const existingClub = clubsFromStandings.get(existingKey);
        if (existingClub && club.priority < existingClub.priority) {
          codeToKey.set(upperCode, key);
        }
      }
    }
    if (club.teamId) {
      if (!codeToKey.has(club.teamId)) {
        codeToKey.set(club.teamId, key);
      }
    }
  }

  // 7. Build final structures
  const clubs = new Map();
  for (const [key, club] of clubsFromStandings.entries()) {
    clubs.set(key, {
      ...club,
      competitions: Array.from(club.competitions),
      aliases: Array.from(club.aliases),
      upcomingCount: 0,
      liveCount: 0,
    });
  }

  // 8. Compute upcomingCount / liveCount per club (baked into cache)
  const [upcomingMatches, liveMatches] = await Promise.all([
    prisma.match.findMany({
      where: { status: STATUS.SCHEDULED, date: { gte: now } },
      select: { homeTeam: true, awayTeam: true, homeCode: true, awayCode: true },
    }),
    prisma.match.findMany({
      where: { status: STATUS.LIVE },
      select: { homeTeam: true, awayTeam: true, homeCode: true, awayCode: true },
    }),
  ]);

  const resolveClubKey = (code, name) => {
    if (code) {
      const upperCode = code.toUpperCase();
      const key = codeToKey.get(upperCode);
      if (key && clubs.has(key)) return key;
    }
    if (name) {
      const norm = normalizeText(name);
      const key = aliasToKey.get(norm);
      if (key && clubs.has(key)) return key;
      for (const [k, club] of clubs.entries()) {
        if (isSameTeam(club.teamName, name) || club.aliases.some(a => isSameTeam(a, name))) {
          return k;
        }
      }
    }
    return null;
  };

  for (const m of upcomingMatches) {
    const homeKey = resolveClubKey(m.homeCode, m.homeTeam);
    const awayKey = resolveClubKey(m.awayCode, m.awayTeam);
    if (homeKey) clubs.get(homeKey).upcomingCount++;
    if (awayKey) clubs.get(awayKey).upcomingCount++;
  }
  for (const m of liveMatches) {
    const homeKey = resolveClubKey(m.homeCode, m.homeTeam);
    const awayKey = resolveClubKey(m.awayCode, m.awayTeam);
    if (homeKey) clubs.get(homeKey).liveCount++;
    if (awayKey) clubs.get(awayKey).liveCount++;
  }

  return {
    clubs,
    codeToKey,
    aliasToKey,
    builtAt: now,
  };
}

/**
 * Get the current team index (cached).
 */
async function getTeamIndex() {
  const cached = cache.get(CACHE_KEY);
  if (cached) return cached;

  const index = await buildTeamIndex();
  cache.set(CACHE_KEY, index, CACHE_TTL);
  return index;
}

/**
 * Invalidate the team index cache.
 */
function invalidateTeamIndex() {
  cache.delete(CACHE_KEY);
}

/**
 * Resolve a team code or name to a canonical club.
 */
async function resolveTeam(codeOrName) {
  const index = await getTeamIndex();

  if (!codeOrName) return null;

  const upperCode = codeOrName.toUpperCase();
  
  // Try exact code match first
  const keyFromCode = index.codeToKey.get(upperCode);
  if (keyFromCode && index.clubs.has(keyFromCode)) {
    const club = index.clubs.get(keyFromCode);
    // Verify the name matches if we have a name
    if (codeOrName !== upperCode) {
      const normInput = normalizeText(codeOrName);
      const normClubName = normalizeText(club.teamName);
      if (normInput === normClubName || isSameTeam(club.teamName, codeOrName)) {
        return { club, key: keyFromCode };
      }
      // Check aliases
      for (const alias of club.aliases) {
        if (isSameTeam(alias, codeOrName)) {
          return { club, key: keyFromCode };
        }
      }
    } else {
      return { club, key: keyFromCode };
    }
  }

  // Try normalized alias match
  const norm = normalizeText(codeOrName);
  const aliasKey = index.aliasToKey.get(norm);
  if (aliasKey && index.clubs.has(aliasKey)) {
    return { club: index.clubs.get(aliasKey), key: aliasKey };
  }

  // Try fuzzy match against all clubs
  for (const [key, club] of index.clubs.entries()) {
    if (isSameTeam(club.teamName, codeOrName)) {
      return { club, key };
    }
    for (const alias of club.aliases) {
      if (isSameTeam(alias, codeOrName)) {
        return { club, key };
      }
    }
  }

  return null;
}

/**
 * Get all clubs that have upcoming or live matches.
 * Uses counts baked into the team index cache — no extra DB queries.
 */
async function getActiveClubs() {
  const index = await getTeamIndex();

  const result = [];
  for (const [key, club] of index.clubs.entries()) {
    const upcomingCount = club.upcomingCount || 0;
    const liveCount = club.liveCount || 0;

    if (upcomingCount > 0 || liveCount > 0) {
      result.push({
        ...club,
        key,
        upcomingCount,
        liveCount,
      });
    }
  }

  result.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const aActive = a.liveCount + a.upcomingCount;
    const bActive = b.liveCount + b.upcomingCount;
    if (aActive !== bActive) return bActive - aActive;
    return (a.teamName || "").localeCompare(b.teamName || "");
  });

  return result;
}

/**
 * Get all clubs for search.
 */
async function getAllClubs() {
  const index = await getTeamIndex();
  const result = [];

  for (const [key, club] of index.clubs.entries()) {
    result.push({
      ...club,
      key,
    });
  }

  result.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return (a.teamName || "").localeCompare(b.teamName || "");
  });

  return result;
}

/**
 * Search clubs by name or code.
 */
async function searchClubs(query) {
  const allClubs = await getAllClubs();
  const normQuery = normalizeText(query);

  return allClubs.filter((club) => {
    const name = normalizeText(club.teamName || "");
    const code = normalizeText(club.teamCode || "");
    return name.includes(normQuery) || code.includes(normQuery);
  });
}

/**
 * Get all matches for a club.
 */
async function getClubMatches(clubKey) {
  const index = await getTeamIndex();
  const club = index.clubs.get(clubKey);
  if (!club) return [];

  // Filter by the club's competitions to avoid loading ALL matches from the DB
  const competitionIds = club.competitions;
  if (!competitionIds || competitionIds.length === 0) return [];

  const allMatches = await prisma.match.findMany({
    where: {
      competitionId: { in: competitionIds },
    },
    select: {
      id: true,
      competitionId: true,
      seasonId: true,
      stageId: true,
      groupId: true,
      groupName: true,
      stageName: true,
      homeTeam: true,
      homeFlag: true,
      awayTeam: true,
      awayFlag: true,
      homeCode: true,
      awayCode: true,
      date: true,
      round: true,
      stadium: true,
      city: true,
      referee: true,
      attendance: true,
      status: true,
      homeScore: true,
      awayScore: true,
      broadcasts: {
        select: {
          id: true,
          name: true,
          logo: true,
          url: true,
          language: true,
        },
      },
    },
    orderBy: { date: "asc" },
  });

  const clubNameNorm = normalizeText(club.teamName);
  const clubCodes = new Set([club.teamCode, club.teamId].filter(Boolean).map(c => c.toUpperCase()));

  const matches = allMatches.filter((m) => {
    const homeCode = m.homeCode?.toUpperCase();
    const awayCode = m.awayCode?.toUpperCase();
    const homeName = normalizeText(m.homeTeam || "");
    const awayName = normalizeText(m.awayTeam || "");

    // Match by code (only if the name also matches for code conflicts)
    if (clubCodes.has(homeCode) && (isSameTeam(club.teamName, m.homeTeam) || club.aliases.some(a => isSameTeam(a, m.homeTeam)))) {
      return true;
    }
    if (clubCodes.has(awayCode) && (isSameTeam(club.teamName, m.awayTeam) || club.aliases.some(a => isSameTeam(a, m.awayTeam)))) {
      return true;
    }

    // Match by exact name
    if (homeName === clubNameNorm || awayName === clubNameNorm) return true;

    // Match by alias
    for (const alias of club.aliases) {
      const aliasNorm = normalizeText(alias);
      if (homeName === aliasNorm || awayName === aliasNorm) return true;
    }

    // Fuzzy match
    if (isSameTeam(club.teamName, m.homeTeam) || isSameTeam(club.teamName, m.awayTeam)) return true;
    for (const alias of club.aliases) {
      if (isSameTeam(alias, m.homeTeam) || isSameTeam(alias, m.awayTeam)) return true;
    }

    return false;
  });

  return matches;
}

module.exports = {
  getTeamIndex,
  invalidateTeamIndex,
  resolveTeam,
  getActiveClubs,
  getAllClubs,
  searchClubs,
  getClubMatches,
  COMPETITION_PRIORITY,
};
