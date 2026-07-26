/**
 * Computes a `qualifies` field for each standing row, describing how each
 * team classifies according to the rules of its competition.
 *
 * Values:
 *   - "qualified"   -> green   (advances directly / classificado)
 *   - "playoff"     -> yellow  (South American: 2nd in group -> Repescagem)
 *   - "best-third"  -> yellow  (advanced as one of the best third-placed teams)
 *   - "sulamericana"-> yellow  (Libertadores 3rd -> drops to Sul-Americana)
 *   - "eliminated"  -> red     (out of the competition)
 *
 * Competition rules:
 *   - brasileirao2026: not handled here (frontend has its own zone logic).
 *   - libertadores2026: 1-2 qualified (green), 3 sulamericana (yellow),
 *     4 eliminated (red).
 *   - sulamericana2026: 1 qualified (Oitavas, green), 2 playoff (Repescagem,
 *     yellow), 3-4 eliminated (red). When the scraper already provides an
 *     accurate `qualifies` field (sourced from Opta's `rankStatus`), we
 *     preserve it over our position-based guess (Opta's status accounts for
 *     cross-group rules).
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
    // Respeita o status de qualificação vindo do scraper (Opta rankStatus),
    // que é mais preciso que a ordem pura — flags de "playoff" já representam
    // a Repescagem.
    return standings.map((row) => {
      if (row.qualifies === "qualified" || row.qualifies === "playoff" || row.qualifies === "eliminated") {
        return row;
      }
      // Fallback position-based when the scraper didn't fill the field.
      let qualifies = "eliminated";
      if (row.position === 1) qualifies = "qualified";
      else if (row.position === 2) qualifies = "playoff";
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
