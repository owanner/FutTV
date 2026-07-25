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
 * Each phase has a key, label, and the number of matchups (ties).
 */
export const KNOCKOUT_PHASES = {
  wc2026: [
    { key: "ROUND_OF_32", label: "32-avos", ties: 16 },
    { key: "ROUND_OF_16", label: "Oitavas de Final", ties: 8 },
    { key: "QUARTER_FINAL", label: "Quartas de Final", ties: 4 },
    { key: "SEMI_FINAL", label: "Semifinal", ties: 2 },
    { key: "THIRD_PLACE", label: "Disputa de 3º Lugar", ties: 1 },
    { key: "FINAL", label: "Final", ties: 1 }
  ],
  libertadores2026: [
    { key: "ROUND_OF_16", label: "Oitavas de Final", ties: 8 },
    { key: "QUARTER_FINAL", label: "Quartas de Final", ties: 4 },
    { key: "SEMI_FINAL", label: "Semifinal", ties: 2 },
    { key: "FINAL", label: "Final", ties: 1 }
  ],
  sulamericana2026: [
    { key: "ROUND_OF_16", label: "Oitavas de Final", ties: 8 },
    { key: "QUARTER_FINAL", label: "Quartas de Final", ties: 4 },
    { key: "SEMI_FINAL", label: "Semifinal", ties: 2 },
    { key: "FINAL", label: "Final", ties: 1 }
  ],
  copadobrasil2026: [
    { key: "ROUND_OF_32", label: "32-avos", ties: 16 },
    { key: "ROUND_OF_16", label: "Oitavas de Final", ties: 8 },
    { key: "QUARTER_FINAL", label: "Quartas de Final", ties: 4 },
    { key: "SEMI_FINAL", label: "Semifinal", ties: 2 },
    { key: "FINAL", label: "Final", ties: 1 }
  ]
};

/**
 * Map a match's stageName / round / stageId to a knockout phase key.
 * Tries a few common matchings used by APIs / scrapers.
 */
export function matchToPhase(match) {
  const hay = [match.stageName, match.roundName, match.stageId].filter(Boolean).join(" ").toUpperCase();
  if (!hay) return null;
  if (/16.*AVOS|16AVOS|ROUND.*OF.*32|R32|FASE.*32/.test(hay)) return "ROUND_OF_32";
  if (/OITAVAS|ROUND.*OF.*16|R16|FASE.*16/.test(hay)) return "ROUND_OF_16";
  if (/QUARTAS|QUARTER/.test(hay)) return "QUARTER_FINAL";
  if (/SEMI/.test(hay)) return "SEMI_FINAL";
  if (/3.*LUGAR|TERCEIRO|THIRD/.test(hay)) return "THIRD_PLACE";
  if (/FINAL/.test(hay)) return "FINAL";
  return null;
}

/** Group a flat list of matches by knockout phase key. */
export function groupMatchesByPhase(matches, phases) {
  const byPhase = {};
  phases.forEach((p) => { byPhase[p.key] = []; });
  (matches || []).forEach((m) => {
    const key = matchToPhase(m);
    if (key && byPhase[key]) byPhase[key].push(m);
  });
  return byPhase;
}
