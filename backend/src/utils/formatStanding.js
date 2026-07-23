const FIFA_FLAG_BASE = "https://api.fifa.com/api/v3/picture/flags-sq-4";

/**
 * Adds a flag/badge URL to a standing record.
 * Uses stored badge when available, falls back to FIFA flag URL for national teams.
 */
function formatStanding(team) {
  return {
    ...team,
    flag: team.badge || (team.teamCode ? `${FIFA_FLAG_BASE}/${team.teamCode}` : null)
  };
}

module.exports = formatStanding;
