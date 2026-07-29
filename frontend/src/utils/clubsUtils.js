import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { getCompetition } from "../config/competitions";
import { normalizeText } from "./formatUtils";
import { normalizeTeamName } from "./teamUtils";

dayjs.locale("pt-br");

/**
 * Club-page grouping/filtering helpers.
 * 
 * This module is the lightweight "local index" between API calls. It never
 * re-fetches anything — it just reshapes the data the backend already
 * returned (the `/clubs` list + the `/clubs/:code` detail feed) into the
 * shapes the UI needs. Competition metadata is looked up from the shared
 * `config/competitions.js`, so adding a new competition to the config makes
 * the Clubs page support it automatically — no per-page maps to update.
 */

// Shared status filters used across Clubs and CompetitionDetail pages
export const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "live", label: "Ao vivo", accent: "#DC2626" },
  { value: "upcoming", label: "Próximos", accent: "#006A67" },
  { value: "finished", label: "Encerrados", accent: "#475569" },
];

// Import competitions config once for sorting
// Using dynamic import to avoid ESM/CJS issues - but since we're in Vite ESM,
// we can directly import the config
import competitions from "../config/competitions";
const { competitions: compList } = competitions;

/**
 * Get competition order index for sorting.
 * Returns the index in the competitions config, or 999 if not found.
 */
export function competitionOrder(id) {
  const idx = compList.findIndex((c) => c.id === id);
  return idx === -1 ? 999 : idx;
}

/** Resolve a competition metadata object from its id, falling back gracefully. */
export function getCompMeta(competitionId) {
  const c = getCompetition(competitionId);
  return {
    id: competitionId,
    name: c?.shortName || c?.name || competitionId,
    shortName: c?.shortName || c?.name || competitionId,
    colors: c?.colors || { primary: "#666" },
  };
}

/**
 * Build grouped matches by competition, sorted by competition priority.
 * Returns: Array of { id, name, shortName, colors, matches } sorted by priority.
 */
export function groupMatchesByCompetition(matches) {
  const groups = {};
  for (const m of matches) {
    const id = m.competitionId || "unknown";
    if (!groups[id]) {
      const meta = getCompMeta(id);
      groups[id] = { ...meta, matches: [] };
    }
    groups[id].matches.push(m);
  }
  return Object.values(groups).sort((a, b) => {
    const aIdx = competitionOrder(a.id);
    const bIdx = competitionOrder(b.id);
    if (aIdx !== bIdx) return aIdx - bIdx;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Build grouped matches by date.
 * Returns: Array of { date, formatted, matches } sorted chronologically.
 */
export function groupMatchesByDate(matches) {
  const groups = {};
  for (const m of matches) {
    const dateKey = dayjs(m.date).format("YYYY-MM-DD");
    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: dateKey,
        formatted: dayjs(dateKey).format("dddd, DD/MM"),
        matches: [],
      };
    }
    groups[dateKey].matches.push(m);
  }
  return Object.values(groups).sort((a, b) => new Date(a.date) - new Date(b.date));
}

/**
 * Filter a flat match list by free-text search (team-name based) and optional status.
 * Searches both normalized and raw team names for maximum recall.
 */
export function filterMatches(matches, { search = "", status = "" } = {}) {
  const needle = normalizeText(search);
  return (matches || []).filter((m) => {
    const matchesSearch =
      !needle ||
      normalizeText(normalizeTeamName(m.homeTeam)).includes(needle) ||
      normalizeText(normalizeTeamName(m.awayTeam)).includes(needle) ||
      normalizeText(m.homeTeam).includes(needle) ||
      normalizeText(m.awayTeam).includes(needle);

    let matchesStatus = true;
    if (status === "live") matchesStatus = m.status === 3;
    else if (status === "upcoming") matchesStatus = m.status === 1;
    else if (status === "finished") matchesStatus = m.status === 0;

    return matchesSearch && matchesStatus;
  });
}

/**
 * Filter a flat club list by free-text search (name / code based).
 */
export function filterClubs(clubs, search = "") {
  const needle = normalizeText(search);
  if (!needle) return clubs;
  return (clubs || []).filter((club) => {
    const name = normalizeText(normalizeTeamName(club.teamName));
    const code = normalizeText(club.teamCode || "");
    return name.includes(needle) || code.includes(needle);
  });
}

/**
 * Split a flat match list into live / upcoming / finished buckets.
 */
export function splitByStatus(matches) {
  const live = [];
  const upcoming = [];
  const finished = [];
  for (const m of matches || []) {
    if (m.status === 3) live.push(m);
    else if (m.status === 0) finished.push(m);
    else if (m.status === 1) upcoming.push(m);
  }
  return { live, upcoming, finished };
}
