/**
 * Competition configuration for the frontend.
 * Mirrors backend/src/config/competitions.js.
 */

const competitions = [
  {
    id: "brasileirao2026",
    name: "Brasileirão Série A 2026",
    shortName: "Brasileirão",
    seasonId: "2026",
    provider: "cbf",
    format: "league",
    flag: "https://upload.wikimedia.org/wikipedia/commons/9/93/Bandera_do_Brasileir%C3%A3o_S%C3%A9rie_A.svg",
    teamLabel: "Clube",
    teamLabelPlural: "Clubes",
    colors: {
      primary: "#19AE47",
      secondary: "#FFDC02",
      accent: "#193375",
      gradient: "linear-gradient(90deg, #FFDC02 0%, #19AE47 50%, #193375 100%)",
      background: "#F6FDF9",
      paper: "#FFFFFF"
    }
  },
  {
    id: "copadobrasil2026",
    name: "Copa do Brasil 2026",
    shortName: "Copa do Brasil",
    seasonId: "2026",
    provider: "cbf",
    format: "knockout",
    flag: "https://upload.wikimedia.org/wikipedia/commons/4/42/Copa_do_Brasil_logo.svg",
    teamLabel: "Clube",
    teamLabelPlural: "Clubes",
    colors: {
      primary: "#193375",
      secondary: "#FFDC02",
      accent: "#19AE47",
      gradient: "linear-gradient(90deg, #193375 0%, #FFDC02 50%, #19AE47 100%)",
      background: "#F4F7FC",
      paper: "#FFFFFF"
    }
  },
  {
    id: "libertadores2026",
    name: "Copa Libertadores 2026",
    shortName: "Libertadores",
    seasonId: "2026",
    provider: "football-data",
    format: "groups-then-knockout",
    flag: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_Copa_Libertadores.svg",
    teamLabel: "Clube",
    teamLabelPlural: "Clubes",
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
    seasonId: "2026",
    provider: "conmebol",
    format: "groups-then-knockout",
    flag: "https://upload.wikimedia.org/wikipedia/commons/4/47/Copa_Sudamericana_logo.svg",
    teamLabel: "Clube",
    teamLabelPlural: "Clubes",
    colors: {
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
    seasonId: "285023",
    provider: "fifa",
    format: "groups-then-knockout",
    flag: "https://api.fifa.com/api/v3/picture/flags-sq-4/ALL",
    teamLabel: "Seleção",
    teamLabelPlural: "Seleções",
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

export function getAllCompetitions() {
  return competitions;
}

export function getCompetition(id) {
  return competitions.find(c => c.id === id) || competitions[0];
}

export function getCompetitionFormat(id) {
  return getCompetition(id)?.format || "league";
}

export function isKnockoutCompetition(id) {
  return getCompetitionFormat(id) === "knockout";
}

export function hasGroupStage(id) {
  const f = getCompetitionFormat(id);
  return f === "league" || f === "groups" || f === "groups-then-knockout";
}

export function hasKnockoutStage(id) {
  const f = getCompetitionFormat(id);
  return f === "knockout" || f === "groups-then-knockout";
}

export default competitions;
