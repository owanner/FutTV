/**
 * Football-Data Competition Adapter.
 * Standardizes match fetching for leagues backed by football-data.org (e.g. Libertadores).
 */

const footballDataApi = require("../footballDataApi");

function mapFbStatus(status) {
  if (status === "FINISHED" || status === "AWARDED") return 0;
  if (status === "LIVE" || status === "IN_PLAY" || status === "PAUSED" || status === "HALFTIME") return 3;
  if (status === "CANCELLED" || status === "POSTPONED" || status === "SUSPENDED") return 4;
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
        date: new Date(match.utcDate),
        round: match.matchday || null,
        stadium: match.venue || null,
        city: null,
        referee: match.referees?.[0]?.name || null,
        attendance: match.attendance?.toString() || null,
        status: mapFbStatus(match.status),
        homeScore: match.score?.fullTime?.home ?? null,
        awayScore: match.score?.fullTime?.away ?? null
      };
    });
  }
}

module.exports = FootballDataAdapter;
