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
