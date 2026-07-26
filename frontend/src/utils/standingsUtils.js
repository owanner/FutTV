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
      case "playoff":       // Sulamericana 2nd -> Repescagem
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
    // Sulamericana group stage: 1st → Oitavas (green/qualified),
    // 2nd → Repescagem (yellow/playoff), 3rd & 4th → Eliminado (red).
    // Prefer the explicit `qualifies` field (sourced from Opta's rankStatus),
    // which is accurate at the end of the group stage; before that, fall back
    // to a position-based guess.
    if (team?.qualifies === "qualified") return "#43a047"; // green
    if (team?.qualifies === "playoff") return "#fbc02d";    // yellow
    if (team?.qualifies === "eliminated") return "#e53935"; // red
    if (position === 1) return "#43a047";
    if (position === 2) return "#fbc02d";
    return "#e53935";
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

/** Sulamericana-specific legend: Oitavas (green), Repescagem (yellow), Eliminado (red). */
export const SUDAMERICANA_ZONES = [
  { label: "Classificado", color: "#43a047" },
  { label: "Repescagem", color: "#fbc02d" },
  { label: "Eliminado", color: "#e53935" }
];

/**
 * Knockout phase definitions used by the Knockouts tab.
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
    // Libertadores has NO "Repescagem" round — that belongs to Sulamericana.
    // football-data.org labels the post-group round of 16 ties as `PLAY_OFFS`
    // (normalised to "Repescagem" by the backend's old generic stage map),
    // but for the Libertadores these 16 matches ARE the Oitavas de Final.
    // We therefore map them to ROUND_OF_8 in `matchToPhase` below.
    { key: "ROUND_OF_8", label: "Oitavas de Final", ties: 8, matchCount: 16 },
    { key: "QUARTER_FINAL", label: "Quartas de Final", ties: 4, matchCount: 8 },
    { key: "SEMI_FINAL", label: "Semifinal", ties: 2, matchCount: 4 },
    { key: "FINAL", label: "Final", ties: 1, matchCount: 1 }
  ],
  sulamericana2026: [
    // Sulamericana has a distinct Play-off (Repescagem) round before the
    // Oitavas. Both rounds happen at the close of the group stage: 2nd-placed
    // teams play each other (Repescagem), winners join the 1st-placed teams in
    // the Oitavas. Subsequent rounds (Quartas, Semis, Final) are single-leg
    // ties from the Oitavas onwards.
    { key: "PLAY_OFF", label: "Repescagem", ties: 8, matchCount: 16 },
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
 * Stage-name / stage-id substrings that identify a CONMEBOL post-group
 * play-off round ("Repescagem"). Both Libertadores (football-data.org:
 * `KNOCKOUT_ROUND_PLAY_OFF` / `PLAY_OFFS`) and Sulamericana (Opta:
 * "Knockout Round Play-offs") expose this round, but it means different
 * things in each competition — see `matchToPhase`.
 */
const PLAY_OFF_MARKERS = [
  "REPESCAGEM",
  "PLAY-OFF",
  "PLAYOFF",
  "PLAY_OFF",
  "PLAY_OFFS",
  "KNOCKOUT_ROUND_PLAY_OFF",
  "KNOCKOUT ROUND PLAY"
];
const isPlayOff = (hay) => PLAY_OFF_MARKERS.some((m) => hay.includes(m));

/**
 * Map a match to a knockout phase key for the competition identified by
 * `competitionId`. Uses the explicit `stageName` (populated from the scraper /
 * API) — the previous date-clustering fallback has been removed since both
 * Libertadores and Sulamericana now expose round names.
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
    // South American competitions expose `stageName` (normalised pt label
    // like "Oitavas de Final", "Repescagem", "Quartas de Final", etc.) on
    // locally-scraped matches, so we classify by it. This is more accurate
    // than the previous date-clustering fallback, which mixed Repescagem
    // and Oitavas together (they happen on overlapping dates).
    if (competitionId === "sulamericana2026") {
      // Sulamericana-only play-off round ("Repescagem"), distinct from the
      // Oitavas: 2nd-placed teams play each other, winners join 1st-placed
      // teams in the Oitavas de Final.
      if (isPlayOff(stageHay)) return "PLAY_OFF";
    } else {
      // Libertadores has NO Repescagem — football-data.org labels the
      // post-group round-of-16 ties as `PLAY_OFFS` (backend-normalised to
      // "Repescagem" via the shared stage map), but these 16 matches ARE
      // the Oitavas de Final. Map them through to ROUND_OF_8 so they finally
      // show up in the merit-based knockout bracket.
      if (isPlayOff(stageHay)) return "ROUND_OF_8";
    }
    if (stageHay.includes("OITAVAS DE FINAL")) return "ROUND_OF_8";
    if (stageHay.includes("QUARTAS DE FINAL")) return "QUARTER_FINAL";
    if (stageHay.includes("SEMIFINAL")) return "SEMI_FINAL";
    if (/(^|\s)FINAL(\s|$)/.test(stageHay)) return "FINAL";
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

  // South American competitions (Libertadores / Sulamericana): classification
  // is now driven by `stageName` (populated from the scraper), which is more
  // accurate than the previous date-clustering fallback. Upcoming matches
  // (status !== 0 are not yet played) typically have stageName set to their
  // knockout round. If a match has no recognised stage we leave it out so the
  // bracket shows the generic "Confrontos a definir" placeholder rather than
  // mismatching it into the wrong phase.
  if (competitionId === "libertadores2026" || competitionId === "sulamericana2026") {
    const pool = (matches || []).filter((m) => m.stageName && m.stageName !== "Fase de Grupos");
    pool.forEach((m) => {
      const key = matchToPhase(m, competitionId);
      if (key && byPhase[key]) byPhase[key].push(m);
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
