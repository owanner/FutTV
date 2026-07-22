/**
 * Competition configuration for the frontend.
 * Mirrors backend/src/config/competitions.js.
 */

const competitions = [
  {
    id: "wc2026",
    name: "Copa do Mundo FIFA 2026",
    shortName: "Copa 2026",
    seasonId: "285023",
    provider: "fifa",
    flag: "https://api.fifa.com/api/v3/picture/flags-sq-4/ALL",
    teamLabel: "Seleção",
    teamLabelPlural: "Seleções",
    colors: {
      primary: "#3CAC3B",
      secondary: "#2A398D",
      accent: "#E61D25"
    }
  },
  {
    id: "libertadores2026",
    name: "Copa Libertadores 2026",
    shortName: "Libertadores",
    seasonId: "2026",
    provider: "football-data",
    flag: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_Copa_Libertadores.svg",
    teamLabel: "Clube",
    teamLabelPlural: "Clubes",
    colors: {
      primary: "#D4AF37",
      secondary: "#000000",
      accent: "#FFFFFF"
    }
  },
  {
    id: "brasileirao2026",
    name: "Brasileirão Série A 2026",
    shortName: "Brasileirão",
    seasonId: "2026",
    provider: "cbf",
    flag: "https://upload.wikimedia.org/wikipedia/commons/9/93/Bandera_do_Brasileir%C3%A3o_S%C3%A9rie_A.svg",
    teamLabel: "Clube",
    teamLabelPlural: "Clubes",
    colors: {
      primary: "#19AE47",
      secondary: "#FFDC02",
      accent: "#193375"
    }
  }
];

export function getAllCompetitions() {
  return competitions;
}

export function getCompetition(id) {
  return competitions.find(c => c.id === id) || competitions[0];
}

export default competitions;
