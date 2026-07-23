/**
 * Extract competition filter from query params.
 * Returns a Prisma where clause object — either { competitionId } or {}.
 */
function competitionFilter(req) {
  const competitionId = req.query.competitionId;
  return competitionId ? { competitionId } : {};
}

module.exports = { competitionFilter };
