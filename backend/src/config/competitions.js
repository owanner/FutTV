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
    id: "copadobrasil2026",
    name: "Copa do Brasil 2026",
    shortName: "Copa do Brasil",
    slug: "copa-do-brasil",
    apiProvider: "cbf",
    config: {
      cbfCompetitionId: "1260615",
      footballDataLeagueId: null,
      footballDataSeason: 2026
    },
    format: "knockout",
    colors: {
      primary: "#1565C0",
      secondary: "#FFD600",
      accent: "#FFFFFF",
      gradient: "linear-gradient(90deg, #1565C0 0%, #FFD600 100%)",
      background: "#F5F8FE",
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
      conmebolCompetitionId: "13",
      conmebolSlug: "libertadores"
    },
    format: "groups-then-knockout",
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
    id: "sulamericana2026",
    name: "Copa Sulamericana 2026",
    shortName: "Sulamericana",
    slug: "sulamericana",
    apiProvider: "conmebol",
    config: {
      conmebolSlug: "sudamericana",
      conmebolTournamentId: "16",
      conmebolCompetitionId: "14",
      fixtureIdRange: { start: 680, end: 1800 }
    },
    format: "groups-then-knockout",
    colors: {
      // Palette: White, Dark Blue, Silver.
      // Deep navy blue is used as `primary` so accent bars/badges remain
      // visible; silver is `secondary` and white is `accent`.
      primary: "#0B1F4F",
      secondary: "#8A8D91",
      accent: "#FFFFFF",
      gradient: "linear-gradient(90deg, #FFFFFF 0%, #8A8D91 50%, #0B1F4F 100%)",
      background: "#F2F4F8",
      paper: "#FFFFFF"
    }
  },
  {
    id: "wc2026",
    name: "Copa do Mundo FIFA 2026",
    shortName: "Copa 2026",
    slug: "world-cup",
    apiProvider: "fifa",
    config: {
      competitionId: "17",
      seasonId: "285023",
      groupStageId: "289273"
    },
    format: "groups-then-knockout",
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

function getAllCompetitions() {
  return competitions.map(c => ({
    id: c.id,
    name: c.name,
    shortName: c.shortName,
    slug: c.slug,
    format: c.format || "groups",
    colors: c.colors
  }));
}

module.exports = { competitions, getAllCompetitions };
