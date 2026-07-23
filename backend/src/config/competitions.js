/**
 * Competition registry.
 * Each entry defines how to fetch data for a competition.
 * Adding a new competition = adding a new entry here.
 */

const competitions = [
  {
    id: "brasileirao2026",
    name: "Campeonato Brasileiro Série A 2026",
    shortName: "Brasileirão",
    slug: "brasileirao",
    apiProvider: "cbf",
    config: {
      cbfCompetitionId: "1260611",
      footballDataLeagueId: "BSA",
      footballDataSeason: 2026
    },
    colors: {
      primary: "#19AE47",
      secondary: "#FFDC02",
      accent: "#193375",
      gradient: "linear-gradient(90deg, #19AE47 0%, #FFDC02 50%, #193375 100%)",
      background: "#F6FDF9",
      paper: "#FFFFFF"
    }
  },
  {
    id: "libertadores2026",
    name: "Copa Libertadores 2026",
    shortName: "Libertadores",
    slug: "libertadores",
    apiProvider: "football-data",
    config: {
      footballDataLeagueId: "CLI",
      footballDataSeason: 2026,
      conmebolTournamentId: "15",
      conmebolCompetitionId: "13"
    },
    colors: {
      primary: "#D4AF37",
      secondary: "#1a1a1a",
      accent: "#FFFFFF",
      gradient: "linear-gradient(90deg, #D4AF37 0%, #1a1a1a 50%, #000000 100%)",
      background: "#F5F3EE",
      paper: "#FFFFFF"
    }
  },
  {
    id: "wc2026",
    name: "Copa do Mundo 2026",
    shortName: "Copa 2026",
    slug: "world-cup",
    apiProvider: "fifa",
    config: {
      competitionId: "17",
      seasonId: "285023",
      groupStageId: "289273"
    },
    colors: {
      primary: "#2A398D",
      secondary: "#3CAC3B",
      accent: "#E61D25",
      gradient: "linear-gradient(90deg, #2A398D 0%, #3CAC3B 50%, #E61D25 100%)",
      background: "#F6FAF8",
      paper: "#FFFFFF"
    }
  }
];

function getCompetition(id) {
  return competitions.find(c => c.id === id);
}

function getAllCompetitions() {
  return competitions.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    colors: c.colors
  }));
}

module.exports = { competitions, getCompetition, getAllCompetitions };
