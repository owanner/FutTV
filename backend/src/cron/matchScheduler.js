/**
 * DB-driven match scheduler.
 *
 * A single 1-minute tick inspects the database and decides, per competition,
 * what action to take and at what cadence. This replaces several static
 * cron.schedule() calls with one dispatcher that adapts to reality:
 *
 *   - LIVE matches          -> refreshLiveScores every tick (<= 1 min)
 *   - starts within < 2h    -> full sync every 10 min
 *   - starts "tomorrow"     -> full sync every 1h
 *   - starts within <= 5d   -> full sync 2x/day
 *   - no games in next 5d   -> full sync 1x/day
 *   - pure-knockout finished-> full sync 1x/day (keep bracket staged)
 *
 * Decisions are made from the DB instead of hardcoded windows, so a delayed
 * match (still live past 90 min, extra-time, etc.) keeps being treated as
 * live automatically. The "last run" timestamp per competition lives in a
 * tiny in-memory map (no extra table needed).
 */

const cron = require("node-cron");
const prisma = require("../database/prisma");
const { competitions } = require("../config/competitions");
const { STATUS } = require("../utils/matchStatus");
const { syncCompetition, refreshLiveScores } = require("./syncMatches");

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Per-competition cooldowns (ms). Keyed by competitionId.
const lastRun = {};

function shouldRun(compId, cadenceMs, reason) {
  const now = Date.now();
  const last = lastRun[compId] || 0;
  if (now - last < cadenceMs) return false;
  lastRun[compId] = now;
  return true;
}

/**
 * Returns the next upcoming match date for a competition (or null).
 * "Upcoming" = SCHEDULED with a kickoff in the future. Matches whose
 * kickoff has already passed but are still SCHEDULED in the DB (the CBF
 * API doesn't distinguish "live" from "scheduled" by date alone) are
 * handled by `hasStaleScheduledMatch` below to keep the scheduler fast.
 */
async function getNextUpcomingDate(compId) {
  const m = await prisma.match.findFirst({
    where: { competitionId: compId, status: STATUS.SCHEDULED, date: { gte: new Date() } },
    orderBy: { date: "asc" },
    select: { date: true }
  });
  return m?.date || null;
}

/**
 * Returns whether the competition has any SCHEDULED match whose kickoff has
 * already passed (more than a few minutes ago). This signals "should be live
 * or just-finishing" — we treat it as a near-live situation so the scheduler
 * keeps syncing fast until the API flips the status to LIVE/FINISHED.
 */
async function hasStaleScheduledMatch(compId) {
  // Anything scheduled that should have kicked off >= 3 min ago.
  const gracefulMinutes = 3 * MINUTE;
  const threshold = new Date(Date.now() - gracefulMinutes);
  const count = await prisma.match.count({
    where: { competitionId: compId, status: STATUS.SCHEDULED, date: { lt: threshold } }
  });
  return count > 0;
}

/**
 * Returns whether the competition currently has any live match.
 */
async function hasLiveMatch(compId) {
  const count = await prisma.match.count({
    where: { competitionId: compId, status: STATUS.LIVE }
  });
  return count > 0;
}

/**
 * Decide cadence per competition and trigger the appropriate sync function.
 * Logged with a compact prefix per competition for tracing.
 */
async function tickCompetition(comp) {
  const compId = comp.id;

  try {
    const live = await hasLiveMatch(compId);

    // 1) LIVE -> refresh scores every minute (the dispatcher itself).
    if (live) {
      if (shouldRun(compId, MINUTE, "live")) {
        console.log(`⏱ [${comp.shortName || comp.name}] LIVE — refreshLiveScores`);
        await refreshLiveScores(compId);
      }
      return;
    }

    // 1b) Has a SCHEDULED match whose kickoff has already passed — probably
    //     live but the DB status hasn't been updated yet (CBF inferStatus
    //     can't tell "live" from "scheduled", and football-data enrichment
    //     only runs on sync). Treat as live-ish: refresh fast.
    const stale = await hasStaleScheduledMatch(compId);
    if (stale) {
      if (shouldRun(compId, MINUTE, "stale-scheduled")) {
        console.log(`⏱ [${comp.shortName || comp.name}] STALE-SCHEDULED — refreshLiveScores`);
        await refreshLiveScores(compId);
      }
      return;
    }

    // 2) No live match -> base cadence on next upcoming match.
    const nextDate = await getNextUpcomingDate(compId);
    const now = Date.now();

    if (!nextDate) {
      // No upcoming games -> 1x/day
      if (shouldRun(compId, DAY, "idle")) {
        console.log(`⏱ [${comp.shortName || comp.name}] IDLE — syncCompetition (1x/dia)`);
        await syncCompetition(compId);
      }
      return;
    }

    const msToKickoff = nextDate.getTime() - now;

    if (msToKickoff < 2 * HOUR) {
      // Starts within 2h -> 10 min
      if (shouldRun(compId, 10 * MINUTE, "<2h")) {
        console.log(`⏱ [${comp.shortName || comp.name}] <2h — syncCompetition (10min)`);
        await syncCompetition(compId);
      }
    } else if (msToKickoff < DAY) {
      // Tomorrow (within 24h but >2h) -> 1h
      if (shouldRun(compId, HOUR, "tomorrow")) {
        console.log(`⏱ [${comp.shortName || comp.name}] ~24h — syncCompetition (1h)`);
        await syncCompetition(compId);
      }
    } else if (msToKickoff < 5 * DAY) {
      // Within 5 days -> 2x/day (every 12h)
      if (shouldRun(compId, 12 * HOUR, "<=5d")) {
        console.log(`⏱ [${comp.shortName || comp.name}] <=5d — syncCompetition (2x/dia)`);
        await syncCompetition(compId);
      }
    } else {
      // No games in the next 5 days -> 1x/day
      if (shouldRun(compId, DAY, ">5d")) {
        console.log(`⏱ [${comp.shortName || comp.name}] >5d — syncCompetition (1x/dia)`);
        await syncCompetition(compId);
      }
    }
  } catch (error) {
    console.error(`❌ [${comp.name}] Erro no scheduler tick: ${error.message}`);
  }
}

let started = false;
let ticking = false;

function startMatchScheduler() {
  if (started) return;
  started = true;

  // Run every minute. The per-competition cooldowns keep the actual cadences.
  cron.schedule("* * * * *", async () => {
    if (ticking) {
      console.log("⏱ [scheduler] tick anterior ainda rodando — pulando");
      return;
    }
    ticking = true;
    try {
      for (const comp of competitions) {
        await tickCompetition(comp);
      }
    } finally {
      ticking = false;
    }
  });

  // Kick off once at startup so the first cycle does real work.
  console.log("🟢 Match scheduler iniciado (tick de 1 min, cadência por competição)");
  Promise.all(competitions.map(tickCompetition)).catch((e) =>
    console.error("Erro no tick inicial do scheduler:", e.message)
  );
}

module.exports = { startMatchScheduler, tickCompetition };