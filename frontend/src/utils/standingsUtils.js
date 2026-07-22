/**
 * Position-based border color for standings rows.
 * Competition-aware: different competitions have different zone colors.
 */
export function getPositionColor(position, competitionId) {
  if (competitionId === "brasileirao2026") {
    // Brasileirão zones
    if (position <= 4) return "#19AE47";      // Libertadores (green)
    if (position === 5) return "#90EE90";      // Pré-Libertadores (light green)
    if (position >= 6 && position <= 11) return "#193375";  // Sul-Americana (blue)
    if (position >= 17) return "#e53935";      // Rebaixados (red)
    return "#757575";                           // Neutral (gray)
  }

  // Default (World Cup / Libertadores)
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
