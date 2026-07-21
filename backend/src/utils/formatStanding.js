/**
 * Adds a FIFA flag URL to a standing record based on teamCode.
 * Used by standings, group, and teams routes.
 */
function formatStanding(team) {
  return {
    ...team,
    flag: team.teamCode
      ? `https://api.fifa.com/api/v3/picture/flags-sq-4/${team.teamCode}`
      : null
  };
}

module.exports = formatStanding;
