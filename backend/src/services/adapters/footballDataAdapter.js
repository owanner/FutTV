/**
 * Football-Data Competition Adapter.
 * Standardizes match fetching for leagues backed by football-data.org (e.g. Libertadores).
 */

const footballDataApi = require("../footballDataApi");

function mapFbStatus(status, date) {
  if (status === "FINISHED" || status === "AWARDED") return 0;
  if (status === "LIVE" || status === "IN_PLAY" || status === "PAUSED" || status === "HALFTIME") return 3;
  if (status === "CANCELLED" || status === "POSTPONED" || status === "SUSPENDED") return 4;
  if (date) {
    const now = new Date();
    const threeHalfHoursAgo = new Date(now.getTime() - 3.5 * 60 * 60 * 1000);
    if (date > now) return 1;
    if (date >= threeHalfHoursAgo) return 3;
    return 0;
  }
  return 1;
}

const FB_STAGE_LABELS = {
  GROUP_STAGE: "Fase de Grupos",
  ROUND_1: "1ª Fase",
  ROUND_2: "2ª Fase",
  ROUND_3: "3ª Fase",
  PLAY_OFFS: "Repescagem",
  ROUND_OF_16: "Oitavas de Final",
  QUARTER_FINALS: "Quartas de Final",
  SEMI_FINALS: "Semifinal",
  FINAL: "Final"
};

const FB_STAGE_OVERRIDES = {
  libertadores2026: {
    PLAY_OFFS: "Oitavas de Final"
  }
};

function normaliseFbStage(rawStage, competitionId) {
  if (!rawStage) return "Fase de Grupos";
  const override = FB_STAGE_OVERRIDES[competitionId]?.[rawStage];
  if (override) return override;
  return FB_STAGE_LABELS[rawStage] || rawStage;
}

class FootballDataAdapter {
  constructor(comp) {
    this.comp = comp;
  }

  async getMatches() {
    const { footballDataLeagueId, footballDataSeason } = this.comp.config;
    const matches = await footballDataApi.getMatches(footballDataLeagueId, footballDataSeason);
    const seasonId = String(footballDataSeason);

    return matches.map(match => {
      const homeTeam = match.homeTeam || {};
      const awayTeam = match.awayTeam || {};
      const stageRaw = typeof match.stage === "string" ? match.stage : match.stage?.name;
      const group = match.group?.name || null;
      const date = new Date(match.utcDate);

      const hasPenalties = match.score?.penalties?.home != null && match.score?.penalties?.away != null;
      const homeScore = hasPenalties ? (match.score?.regularTime?.home ?? (match.score?.fullTime?.home - match.score.penalties.home)) : (match.score?.fullTime?.home ?? null);
      const awayScore = hasPenalties ? (match.score?.regularTime?.away ?? (match.score?.fullTime?.away - match.score.penalties.away)) : (match.score?.fullTime?.away ?? null);
      const homePenaltyScore = hasPenalties ? match.score.penalties.home : null;
      const awayPenaltyScore = hasPenalties ? match.score.penalties.away : null;

      return {
        id: `fb_${match.id}`,
        competitionId: this.comp.id,
        seasonId,
        stageId: stageRaw || "",
        groupId: group || null,
        groupName: group || null,
        stageName: normaliseFbStage(stageRaw, this.comp.id),
        homeTeam: homeTeam.name || null,
        homeFlag: homeTeam.crest || null,
        awayTeam: awayTeam.name || null,
        awayFlag: awayTeam.crest || null,
        homeCode: homeTeam.tla || null,
        awayCode: awayTeam.tla || null,
        date: date,
        round: match.matchday || null,
        stadium: match.venue || null,
        city: null,
        referee: match.referees?.[0]?.name || null,
        attendance: match.attendance?.toString() || null,
        status: mapFbStatus(match.status, date),
        homeScore,
        awayScore,
        homePenaltyScore,
        awayPenaltyScore
      };
    });
  }
}

module.exports = FootballDataAdapter;
