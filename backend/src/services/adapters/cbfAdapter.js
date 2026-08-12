/**
 * CBF Competition Adapter.
 * Standardizes match fetching, scoring, and broadcast syncing for CBF competitions
 * (Brasileirão, Copa do Brasil).
 */

const cbfApi = require("../cbfApi");
const cbfScraper = require("../cbfScraper");
const apiFootball = require("../apiFootball");
const footballDataApi = require("../footballDataApi");
const prisma = require("../../database/prisma");
const { isSameTeam } = require("../../utils/textUtils");
const aliases = require("../../../data/teamAliases.json");

function normalizeKey(s) {
  if (!s) return "";
  return s
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function normalizeTeamName(raw) {
  if (!raw) return "";
  const key = normalizeKey(raw);
  if (!key) return String(raw);
  const direct = aliases[key];
  if (direct) return direct;

  const COMMON_PREFIXES = [
    "SE", "SC", "SA", "SP", "EC", "AC", "AA", "CR", "CS", "CA", "CD", "CAR",
    "CDP", "CT", "CE", "CAP"
  ];
  const COMMON_SUFFIXES = [
    "S.A.F.", "SAF", "F.C.", "FC", "Futebol Clube", "Esporte Clube",
    "Clube de Futebol", "Atletico Clube", "Atlético Clube"
  ];

  let n = raw.trim().replace(/\s+/g, " ");
  const firstWordRaw = n.split(" ")[0] || "";
  const firstWord = firstWordRaw.replace(/\./g, "");
  if (COMMON_PREFIXES.includes(firstWord.toUpperCase())) {
    n = n.slice(firstWordRaw.length).trim();
  }
  for (const suf of COMMON_SUFFIXES) {
    const re = new RegExp(`${suf.replace(/\./g, "\\.")}$`, "i");
    if (re.test(n)) {
      n = n.replace(re, "").trim();
      break;
    }
  }
  return n;
}

async function buildTeamCodeLookup(compId) {
  const standings = await prisma.standing.findMany({
    where: { competitionId: compId },
    select: { teamName: true, teamCode: true }
  });

  const lookup = new Map();
  for (const s of standings) {
    if (s.teamCode && s.teamName) {
      const normalized = normalizeTeamName(s.teamName);
      const key = normalizeKey(normalized);
      lookup.set(key, s.teamCode);
    }
  }
  return lookup;
}

async function enrichMatchesWithTeamCodes(comp, matches) {
  const codeLookup = await buildTeamCodeLookup(comp.id);
  if (codeLookup.size === 0) return matches;

  return matches.map(m => {
    const homeCode = m.homeTeam ? codeLookup.get(normalizeKey(normalizeTeamName(m.homeTeam))) : m.homeCode;
    const awayCode = m.awayTeam ? codeLookup.get(normalizeKey(normalizeTeamName(m.awayTeam))) : m.awayCode;
    return { ...m, homeCode: homeCode || m.homeCode, awayCode: awayCode || m.awayCode };
  });
}

class CbfAdapter {
  constructor(comp) {
    this.comp = comp;
  }

  async getMatches() {
    const { cbfCompetitionId, footballDataSeason } = this.comp.config;
    const seasonId = String(footballDataSeason || "2026");
    const rawMatches = await cbfApi.getMatches(cbfCompetitionId);
    
    let matches = rawMatches.map(m => ({
      id: `cbf_${m.id_jogo}`,
      ...cbfApi.buildMatchData(m, this.comp.id, seasonId)
    }));

    matches = await enrichMatchesWithTeamCodes(this.comp, matches);
    return matches;
  }

  async getBroadcasts() {
    return cbfScraper.getAllBroadcasts(this.comp.id);
  }
}

module.exports = CbfAdapter;
