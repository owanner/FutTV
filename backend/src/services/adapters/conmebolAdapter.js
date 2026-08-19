/**
 * CONMEBOL Competition Adapter.
 * Standardizes match and broadcast fetching for Copa Libertadores and Copa Sulamericana.
 */

const conmebolScraper = require("../conmebolScraper");
const prisma = require("../../database/prisma");

class ConmebolAdapter {
  constructor(comp) {
    this.comp = comp;
  }

  async getMatches() {
    const { conmebolSlug, fixtureIdRange, conmebolCompetitionId } = this.comp.config;
    const seasonId = String(this.comp.config.footballDataSeason || this.comp.config.conmebolTournamentId || "2026");
    
    const start = fixtureIdRange?.start ?? 680;
    const end = fixtureIdRange?.end ?? 1800;

    const now = new Date();
    const targetMatches = await prisma.match.findMany({
      where: {
        competitionId: this.comp.id,
        OR: [
          { status: 3 },
          { status: 1, date: { lte: new Date(now.getTime() + 24 * 60 * 60 * 1000), gte: new Date(now.getTime() - 12 * 60 * 60 * 1000) } },
          { status: 0, OR: [{ homeScore: null }, { awayScore: null }] }
        ]
      },
      select: { id: true }
    });

    if (targetMatches.length === 0) {
      return [];
    }

    const knownIds = targetMatches
      .map(m => parseInt(m.id.replace(`conmebol_${conmebolSlug}_`, ""), 10))
      .filter(n => !isNaN(n));

    const scraperOpts = {
      knownIds,
      ...(conmebolCompetitionId ? { expectedCompetitionId: String(conmebolCompetitionId) } : {})
    };

    const fixtures = await conmebolScraper.getAllFixtures(conmebolSlug, start, end, scraperOpts);
    
    return fixtures
      .filter(f => f.fixtureDate)
      .map(f => {
        const matchId = `conmebol_${conmebolSlug}_${f.conmebolFixtureId}`;
        const now = new Date();
        const twoHours = 2 * 60 * 60 * 1000;
        const isFinished = f.fixtureDate.getTime() + twoHours < now.getTime();
        const isLive = !isFinished && f.fixtureDate.getTime() <= now.getTime();
        const status = isFinished ? 0 : isLive ? 3 : 1;

        return {
          id: matchId,
          competitionId: this.comp.id,
          seasonId,
          stageId: f.stageName || null,
          groupId: null,
          groupName: null,
          stageName: conmebolScraper.normaliseStage(f.stageName, this.comp.id),
          homeTeam: f.homeTeam === "Unknown" ? "A definir" : f.homeTeam,
          homeFlag: f.homeTeam === "Unknown" ? null : (f.homeCrest || null),
          awayTeam: f.awayTeam === "Unknown" ? "A definir" : f.awayTeam,
          awayFlag: f.awayTeam === "Unknown" ? null : (f.awayCrest || null),
          homeCode: null,
          awayCode: null,
          date: f.fixtureDate,
          round: null,
          stadium: f.venue || null,
          city: null,
          referee: f.referee || null,
          attendance: null,
          status,
          homeScore: f.homeScore ?? null,
          awayScore: f.awayScore ?? null
        };
      });
  }

  async getBroadcasts() {
    const { conmebolSlug, fixtureIdRange, conmebolCompetitionId } = this.comp.config;
    const { allIds } = await getFilteredKnownFixtureIds(this.comp.id, conmebolSlug);
    const scraperOpts = {
      knownIds: allIds,
      ...(conmebolCompetitionId ? { expectedCompetitionId: String(conmebolCompetitionId) } : {})
    };
    if (fixtureIdRange) {
      scraperOpts.startId = fixtureIdRange.start;
      scraperOpts.endId = fixtureIdRange.end;
    }
    return conmebolScraper.getAllBroadcasts(conmebolSlug, scraperOpts);
  }
}

module.exports = ConmebolAdapter;
