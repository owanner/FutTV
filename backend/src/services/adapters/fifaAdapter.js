/**
 * FIFA Competition Adapter.
 * Standardizes match and broadcast fetching for FIFA competitions (e.g. World Cup 2026).
 */

const fifaApi = require("../fifaApi");

function extractReferee(match) {
  if (!match.Officials || match.Officials.length === 0) return null;
  return match.Officials[0]?.Name?.[0]?.Description || null;
}

function extractTeamName(team) {
  return team?.TeamName?.[0]?.Description || null;
}

function extractTeamFlag(team) {
  return team?.PictureUrl
    ?.replace("{format}", "sq")
    ?.replace("{size}", "4");
}

class FifaAdapter {
  constructor(comp) {
    this.comp = comp;
  }

  async getMatches() {
    const config = this.comp.config;
    const matches = await fifaApi.getAllMatches(config);

    return matches.map(match => ({
      id: match.IdMatch,
      competitionId: this.comp.id,
      seasonId: match.IdSeason,
      stageId: match.IdStage,
      groupId: match.IdGroup,
      groupName: match.GroupName?.[0]?.Description || null,
      stageName: match.StageName?.[0]?.Description || null,
      homeTeam: extractTeamName(match.Home),
      homeFlag: extractTeamFlag(match.Home),
      awayTeam: extractTeamName(match.Away),
      awayFlag: extractTeamFlag(match.Away),
      homeCode: match.Home?.Abbreviation || null,
      awayCode: match.Away?.Abbreviation || null,
      date: new Date(match.Date),
      round: match.MatchDay || null,
      stadium: match.Stadium?.Name?.[0]?.Description || null,
      city: match.Stadium?.CityName?.[0]?.Description || null,
      referee: extractReferee(match),
      attendance: match.Attendance,
      status: match.MatchStatus,
      homeScore: match.HomeTeamScore,
      awayScore: match.AwayTeamScore
    }));
  }

  async getBroadcasts(matchId, seasonId) {
    return fifaApi.getBroadcasts(seasonId, matchId);
  }
}

module.exports = FifaAdapter;
