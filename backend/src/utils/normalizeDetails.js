const { isSameTeam } = require("./textUtils");

const EVENTS_MAP = {
  GOAL: 0,
  OWN_GOAL: 0,
  PENALTY: 0,
  YELLOW_CARD: 2,
  RED_CARD: 3,
  SUBSTITUTION: 5
};

function normalizeFbTimeline(fbMatch) {
  if (!fbMatch || !fbMatch.events || !Array.isArray(fbMatch.events)) return null;
  const Event = fbMatch.events
    .filter((e) => EVENTS_MAP[e.type] !== undefined)
    .map((e, i) => {
      const fifaType = EVENTS_MAP[e.type];
      const playerName = e.player?.name || "";
      const assistName = e.assist?.name || "";
      let description = playerName;
      let detail = "";
      if (e.type === "SUBSTITUTION") {
        description = `Entrada: ${playerName}`;
        detail = e.playerOut?.name ? `Saída: ${e.playerOut.name}` : "";
      } else if (e.type === "OWN_GOAL") {
        description = `Gol contra de ${playerName}`;
      } else if (e.type === "PENALTY") {
        description = `${playerName} (pênalti)`;
      } else if (e.type === "GOAL") {
        description = playerName;
        detail = assistName ? `Assistência: ${assistName}` : "";
      }
      return {
        EventId: `fb_${fbMatch.id}_${i}`,
        Type: fifaType,
        MatchMinute: String(e.minute || e.minute === 0 ? e.minute + (e.extraMinute ? `+${e.extraMinute}` : "") : ""),
        TypeLocalized: [{ Description: description }],
        EventDescription: detail ? [{ Description: detail }] : []
      };
    });
  return { Event };
}

function extractFbPlayerList(players, status) {
  return (players || []).map((entry, i) => {
    const p = entry.player || {};
    return {
      IdPlayer: String(p.id || `fb_p_${i}`),
      ShirtNumber: entry.shirtNumber || entry.shirt_number || 0,
      PlayerName: [{ Description: p.name || "" }],
      Status: status
    };
  });
}

function normalizeFbLineups(fbMatch, homeTeamName, awayTeamName) {
  if (!fbMatch || !fbMatch.lineups || !Array.isArray(fbMatch.lineups)) return null;
  let homeLineup = null;
  let awayLineup = null;
  for (const lu of fbMatch.lineups) {
    const luTeamName = lu.team?.name || "";
    if (!homeLineup && (luTeamName === homeTeamName || isSameTeam(luTeamName, homeTeamName))) {
      homeLineup = lu;
    } else if (!awayLineup && (luTeamName === awayTeamName || isSameTeam(luTeamName, awayTeamName))) {
      awayLineup = lu;
    }
  }
  if (!homeLineup || !awayLineup) return null;
  return {
    HomeTeam: {
      TeamName: [{ Description: homeLineup.team?.name || homeTeamName }],
      Players: [
        ...extractFbPlayerList(homeLineup.startingXI, 1),
        ...extractFbPlayerList(homeLineup.substitutes, 2)
      ]
    },
    AwayTeam: {
      TeamName: [{ Description: awayLineup.team?.name || awayTeamName }],
      Players: [
        ...extractFbPlayerList(awayLineup.startingXI, 1),
        ...extractFbPlayerList(awayLineup.substitutes, 2)
      ]
    }
  };
}

module.exports = { normalizeFbTimeline, normalizeFbLineups, EVENTS_MAP };
