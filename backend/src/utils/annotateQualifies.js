/**
 * Computes a `qualifies` field for each standing row, describing how each
 * team classifies according to the rules of its competition.
 *
 * Values:
 *   - "qualified"   -> green   (advances directly / classificado)
 *   - "best-third"  -> yellow  (advanced as one of the best third-placed teams)
 *   - "sulamericana"-> yellow  (Libertadores 3rd -> drops to Sul-Americana)
 *   - "eliminated"  -> red     (out of the competition)
 *
 * Competition rules:
 *   - brasileirao2026: not handled here (frontend has its own zone logic).
 *   - libertadores2026: 1-2 qualified (green), 3 sulamericana (yellow),
 *     4 eliminated (red).
 *   - sulamericana2026: 1-2 qualified (green), 3-4 eliminated (red).
 *   - wc2026 (48 teams, 12 groups): 1-2 qualified (green). The 8 best
 *     third-placed teams across all groups advance as "best-third" (yellow).
 *     The remaining 4 third-placed teams and all fourth-placed teams are
 *     eliminated (red). Ranking of thirds: points desc, goalDifference desc,
 *     goalsFor desc.
 *
 * @param {Array} standings - flat array of standing rows for ONE competition
 * @returns {Array} the same array with an extra `qualifies` string field
 */
function annotateQualifies(standings) {
  if (!Array.isArray(standings) || standings.length === 0) return standings;

  const compId = standings[0].competitionId;

  if (compId === "libertadores2026") {
    return standings.map((row) => {
      let qualifies = "eliminated";
      if (row.position <= 2) qualifies = "qualified";
      else if (row.position === 3) qualifies = "sulamericana";
      return { ...row, qualifies };
    });
  }

  if (compId === "sulamericana2026") {
    return standings.map((row) => {
      let qualifies = "eliminated";
      if (row.position <= 2) qualifies = "qualified";
      return { ...row, qualifies };
    });
  }

  if (compId === "wc2026") {
    // Identify the third-placed teams across all groups and rank them.
    const thirds = standings
      .filter((row) => row.position === 3)
      .sort(
        (a, b) =>
          (b.points ?? 0) - (a.points ?? 0) ||
          (b.goalDifference ?? 0) - (a.goalDifference ?? 0) ||
          (b.goalsFor ?? 0) - (a.goalsFor ?? 0)
      );
    const bestThirdIds = new Set(thirds.slice(0, 8).map((row) => row.id));

    return standings.map((row) => {
      let qualifies = "eliminated";
      if (row.position <= 2) qualifies = "qualified";
      else if (row.position === 3)
        qualifies = bestThirdIds.has(row.id) ? "best-third" : "eliminated";
      return { ...row, qualifies };
    });
  }

  // Brasileirão / unknown: leave untouched (frontend handles zone colours).
  return standings;
}

module.exports = annotateQualifies;
