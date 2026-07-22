/**
 * Adds a flag/badge URL to a standing record.
 * Uses stored badge when available (Libertadores clubs from football-data.org),
 * falls back to FIFA flag URL for national teams (World Cup).
 */
function formatStanding(team) {
  return {
    ...team,
    flag: team.badge || (team.teamCode
      ? `https://api.fifa.com/api/v3/picture/flags-sq-4/${team.teamCode}`
      : null)
  };
}

module.exports = formatStanding;
