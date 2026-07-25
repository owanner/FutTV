export const CARD_SX = {
  borderRadius: 2,
  border: "1px solid",
  borderColor: "divider",
  transition: "box-shadow .15s ease",
  "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }
};

export function buildGroups(data) {
  const groups = {};
  (data || []).forEach((team) => {
    if (!groups[team.groupName]) groups[team.groupName] = [];
    groups[team.groupName].push(team);
  });
  return groups;
}

export function getPositionColor(position, competitionId, team) {
  // Prefer the explicit `qualifies` field when available (computed by the
  // backend per competition). This is required for the World Cup, where the
  // "best third-placed" rule cannot be derived from `position` alone.
  if (team && team.qualifies) {
    switch (team.qualifies) {
      case "qualified":
        return "#43a047";   // green
      case "sulamericana":  // Libertadores 3rd -> Sul-Americana
      case "best-third":    // World Cup best third-placed
        return "#fbc02d";   // yellow
      case "eliminated":
        return "#e53935";   // red
      default:
        break;
    }
  }

  if (competitionId === "brasileirao2026") {
    // Brasileirão zones
    if (position <= 4) return "#19AE47";      // Libertadores (green)
    if (position === 5) return "#90EE90";      // Pré-Libertadores (light green)
    if (position >= 6 && position <= 11) return "#193375";  // Sul-Americana (blue)
    if (position >= 17) return "#e53935";      // Rebaixados (red)
    return "#757575";                           // Neutral (gray)
  }

  if (competitionId === "sulamericana2026") {
    // Group stage of Sulamericana: only 2 of 4 advance (groups of 4 -> top 2).
    if (position <= 2) return "#43a047";  // Avances (green)
    return "#e53935";                       // Eliminado (red)
  }

  // Default fallback when `qualifies` is missing (World Cup / Libertadores):
  // 1st & 2nd -> green, 3rd -> yellow, 4th -> red.
  if (position <= 2) return "#43a047";
  if (position === 3) return "#fbc02d";
  return "#e53935";
}

/** Column definitions for standings stats grid. */
export const STAT_COLUMNS = [
  { key: "points", label: "P", bold: true },
  { key: "played", label: "PJ", bold: false },
  { key: "wins", label: "V", bold: false },
  { key: "draws", label: "E", bold: false },
  { key: "losses", label: "D", bold: false },
  { key: "goalDifference", label: "SG", bold: false, format: (v) => (v > 0 ? `+${v}` : v) }
];

/** Brasileirão zone descriptions for the legend card. */
export const BRASILEIRAO_ZONES = [
  { label: "Libertadores", positions: "1-4", color: "#19AE47" },
  { label: "Pré-Libertadores", positions: "5", color: "#90EE90" },
  { label: "Sul-Americana", positions: "6-11", color: "#193375" },
  { label: "Rebaixados", positions: "17-20", color: "#e53935" }
];

/** Generic "advances / eliminated" legend for group-only CONMEBOL competitions. */
export const ADVANCE_ZONES = [
  { label: "Classificado", color: "#43a047" },
  { label: "Eliminado", color: "#e53935" }
];

/**
 * Knockout phase definitions used by the Mata-Mata tab.
 * Each phase has a key, label, and `ties` = number of *fixtures*
 * (home-and-away ties counted as one fixture, but we expose `matchCount`
 * as the total number of individual matches expected, since South American
 * competitions use home-and-away ties — e.g. Libertadores Oitavas = 8
 * fixtures × 2 legs = 16 matches).
 */
export const KNOCKOUT_PHASES = {
  wc2026: [
    { key: "ROUND_OF_16", label: "16 Avos", ties: 16, matchCount: 16 },
    { key: "ROUND_OF_8", label: "Oitavas de Final", ties: 8, matchCount: 8 },
    { key: "QUARTER_FINAL", label: "Quartas de Final", ties: 4, matchCount: 4 },
    { key: "SEMI_FINAL", label: "Semifinal", ties: 2, matchCount: 2 },
    { key: "THIRD_PLACE", label: "Disputa de 3º Lugar", ties: 1, matchCount: 1 },
    { key: "FINAL", label: "Final", ties: 1, matchCount: 1 }
  ],
  libertadores2026: [
    // football-data.org exposes no `stage` for Libertadores, and `round` is
    // ambiguous (it overlaps group-stage matchdays with knockout rounds).
    // We therefore classify by `status` (knockout matches are upcoming, i.e.
    // status !== 0) and cluster the forthcoming fixtures by date into the
    // expected phases below. Modern Libertadores has a single Final.
    { key: "ROUND_OF_8", label: "Oitavas de Final", ties: 8, matchCount: 16 },
    { key: "QUARTER_FINAL", label: "Quartas de Final", ties: 4, matchCount: 8 },
    { key: "SEMI_FINAL", label: "Semifinal", ties: 2, matchCount: 4 },
    { key: "FINAL", label: "Final", ties: 1, matchCount: 1 }
  ],
  sulamericana2026: [
    { key: "ROUND_OF_8", label: "Oitavas de Final", ties: 8, matchCount: 16 },
    { key: "QUARTER_FINAL", label: "Quartas de Final", ties: 4, matchCount: 8 },
    { key: "SEMI_FINAL", label: "Semifinal", ties: 2, matchCount: 4 },
    { key: "FINAL", label: "Final", ties: 1, matchCount: 1 }
  ],
  copadobrasil2026: [
    // CBF Copa do Brasil — knockout-only competition.
    // Past matches are grouped as "Fase Inicial" (handled by backend `inferCbrStage`
    // and excluded from the knockout bracket here). The remaining phases are
    // home-and-away ties: Oitavas (16 = 8 ties × 2 legs), Quartas (8 = 4 ties ×
    // 2 legs), Semifinal (4 = 2 ties × 2 legs), Final (single match).
    { key: "ROUND_OF_8", label: "Oitavas de Final", ties: 8, matchCount: 16 },
    { key: "QUARTER_FINAL", label: "Quartas de Final", ties: 4, matchCount: 8 },
    { key: "SEMI_FINAL", label: "Semifinal", ties: 2, matchCount: 4 },
    { key: "FINAL", label: "Final", ties: 1, matchCount: 1 }
  ]
};

const NORMALISE = (s) => String(s || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/**
 * Phase definitions used by the South-American date-clustering fallback
 * (Libertadores / Sulamericana), ordered earliest → latest. The cluster
 * sizes are the *expected* number of matches per phase; the algorithm
 * consumes forthcoming matches (sorted by date) and assigns them to phases
 * in order, splitting at the expected cumulative boundaries.
 */
const SOUTHERN_KNOCKOUT_PLAN = [
  { key: "ROUND_OF_8", matchCount: 16 },      // Oitavas — 8 ties × 2 legs
  { key: "QUARTER_FINAL", matchCount: 8 },   // Quartas — 4 ties × 2 legs
  { key: "SEMI_FINAL", matchCount: 4 },      // Semifinal — 2 ties × 2 legs
  { key: "FINAL", matchCount: 1 }            // Final — single match
];

/**
 * Cluster a sorted list of forthcoming matches into phases by date.
 * Two consecutive matches belong to the same phase unless they are separated
 * by more than `gapDays` days OR the running cluster size reaches the
 * expected matchCount for the current phase.
 *
 * Returns a map { phaseKey: Match[] }.
 */
function clusterSouthernByDate(upcomingMatches, gapDays = 10) {
  const sorted = [...upcomingMatches]
    .filter((m) => m.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const out = {};
  SOUTHERN_KNOCKOUT_PLAN.forEach((p) => { out[p.key] = []; });

  let planIdx = 0;
  for (let i = 0; i < sorted.length && planIdx < SOUTHERN_KNOCKOUT_PLAN.length; i++) {
    const m = sorted[i];
    const plan = SOUTHERN_KNOCKOUT_PLAN[planIdx];

    let advance = false;
    // Advance when current phase already has its expected complement of matches.
    if (out[plan.key].length >= plan.matchCount && planIdx < SOUTHERN_KNOCKOUT_PLAN.length - 1) {
      advance = true;
    }
    // Also advance when there is a large date gap from the previous match
    // (cross-phase boundary). Only advance once per iteration to avoid skipping
    // empty intermediate phases.
    if (!advance && i > 0) {
      const prev = sorted[i - 1];
      const gapMs = new Date(m.date).getTime() - new Date(prev.date).getTime();
      const gapD = gapMs / (24 * 60 * 60 * 1000);
      if (gapD > gapDays && planIdx < SOUTHERN_KNOCKOUT_PLAN.length - 1) {
        advance = true;
      }
    }
    if (advance) planIdx++;

    const target = SOUTHERN_KNOCKOUT_PLAN[Math.min(planIdx, SOUTHERN_KNOCKOUT_PLAN.length - 1)].key;
    out[target].push(m);
  }

  return out;
}

/**
 * Map a match to a knockout phase key for the competition identified by
 * `competitionId`. Tries the explicit stage name first (most reliable for
 * WC/CBF), then falls back to date-based clustering for South American
 * competitions where the stage is not exposed.
 */
export function matchToPhase(match, competitionId) {
  const stageHay = NORMALISE([match.stageName, match.roundName, match.stageId].filter(Boolean).join(" "));

  if (competitionId === "wc2026") {
    // FIFA stage names (pt): "Segundas de final" (16avos), "Oitavas de final",
    // "Quartas de final", "Semifinal", "Bronze final" (3o lugar), "Final".
    if (stageHay.includes("SEGUNDAS DE FINAL")) return "ROUND_OF_16";
    if (stageHay.includes("OITAVAS DE FINAL")) return "ROUND_OF_8";
    if (stageHay.includes("QUARTAS DE FINAL")) return "QUARTER_FINAL";
    if (stageHay.includes("SEMIFINAL")) return "SEMI_FINAL";
    if (stageHay.includes("BRONZE FINAL") || stageHay.includes("TERCEIRO") || stageHay.includes("3 LUGAR")) return "THIRD_PLACE";
    // Anchored "FINAL" — must NOT match "BRONZE FINAL" — handled above by order.
    if (/(^|\s)FINAL(\s|$)/.test(stageHay)) return "FINAL";
  } else if (competitionId === "libertadores2026" || competitionId === "sulamericana2026") {
    // South American competitions expose no `stage`; classification happens
    // at the groupMatchesByPhase level via date clustering. Return null here
    // so individual matches are not bucketed prematurely.
    return null;
  } else {
    // Generic fallback (e.g. Copa do Brasil via CBF).
    if (stageHay.includes("16 AVOS") || stageHay.includes("16AVOS") || stageHay.includes("SEGUNDAS DE FINAL")) return "ROUND_OF_16";
    if (stageHay.includes("OITAVAS DE FINAL") || stageHay.includes("ROUND OF 16") || stageHay.includes("R16")) return "ROUND_OF_8";
    if (stageHay.includes("QUARTAS DE FINAL") || stageHay.includes("QUARTER")) return "QUARTER_FINAL";
    if (stageHay.includes("SEMI")) return "SEMI_FINAL";
    if (stageHay.includes("BRONZE FINAL") || stageHay.includes("TERCEIRO") || stageHay.includes("3 LUGAR")) return "THIRD_PLACE";
    if (/(^|\s)FINAL(\s|$)/.test(stageHay)) return "FINAL";
  }

  return null;
}

/** Group a flat list of matches by knockout phase key for a competition. */
export function groupMatchesByPhase(matches, phases, competitionId) {
  const byPhase = {};
  phases.forEach((p) => { byPhase[p.key] = []; });

  // South American fallback: only forthcoming matches (status !== 0) are
  // relevant for the knockout stage; classify them by date clusters.
  if (competitionId === "libertadores2026" || competitionId === "sulamericana2026") {
    const upcoming = (matches || []).filter((m) => m.status !== 0);
    const clustered = clusterSouthernByDate(upcoming);
    Object.keys(clustered).forEach((key) => {
      if (byPhase[key]) byPhase[key] = clustered[key];
    });
    return byPhase;
  }

  // Copa do Brasil: finished matches (status === 0) belong to "Fase Inicial"
  // and are NOT part of the knockout bracket — only classify upcoming ones.
  const pool = competitionId === "copadobrasil2026"
    ? (matches || []).filter((m) => m.status !== 0)
    : (matches || []);

  pool.forEach((m) => {
    const key = matchToPhase(m, competitionId);
    if (key && byPhase[key]) byPhase[key].push(m);
  });
  return byPhase;
}
