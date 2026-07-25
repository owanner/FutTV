/**
 * Team name utilities.
 * Handles normalization and abbreviation of team names for UI display.
 */

import aliases from "../data/teamAliases.json";

const SMALL_WORDS = ["do", "da", "dos", "das", "de", "e", "the", "of", "and"];

/** Remove acentos e devolve lowercase sem espaços extras. */
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

/**
 * Prefixos jurídicos que algumas fontes adicionam ao nome do clube
 * (C.A., S.E., C.D., C.R., S.C., etc.) seguidos de espaço. São removidos
 * quando não há alias explícito, para que "SE Palmeiras" -> "Palmeiras".
 */
const COMMON_PREFIXES = [
  "SE", "SC", "SA", "SP", "EC", "AC", "AA", "CR", "CS", "CA", "CD", "CAR",
  "CDP", "CT", "CE", "CAP"
];

/** Sufixos "empresa" que poluem nomes vindos da CBF/conmebol. */
const COMMON_SUFFIXES = [
  "S.A.F.", "SAF", "F.C.", "FC", "Futebol Clube", "Esporte Clube",
  "Clube de Futebol", "Atletico Clube", "Atlético Clube"
];

/**
 * Aplica heurísticas de limpeza quando não há alias explícito.
 * Remove prefixos/sufixos jurídicos e normaliza capitalização.
 */
function fallbackClean(name) {
  let n = name.trim().replace(/\s+/g, " ");

  // Remove prefixos comuns (ex.: "SE Palmeiras" -> "Palmeiras",
  //                          "C.A. Independiente" -> "Independiente")
  const firstWordRaw = n.split(" ")[0] || "";
  const firstWord = firstWordRaw.replace(/\./g, "");
  if (COMMON_PREFIXES.includes(firstWord.toUpperCase())) {
    n = n.slice(firstWordRaw.length).trim();
  }

  // Remove sufixos comuns (ex.: "Fluminense FC" -> "Fluminense"
  //                              "Coritiba SAF" -> "Coritiba")
  for (const suf of COMMON_SUFFIXES) {
    const re = new RegExp(`${suf.replace(/\./g, "\\.")}$`, "i");
    if (re.test(n)) {
      n = n.replace(re, "").trim();
      break;
    }
  }

  return n || name;
}

/**
 * Normaliza o nome de um time para exibição.
 * 1. Procura em teamAliases.json (case e acento insensitive).
 * 2. Caso não encontre, remove prefixos/sufixos jurídicos comuns.
 * 3. Caso ainda assim falhe, devolve o nome cru (capitalizado).
 */
export function normalizeTeamName(raw) {
  if (!raw) return "";
  const key = normalizeKey(raw);
  if (!key) return String(raw);

  const direct = aliases[key];
  if (direct) return direct;

  const cleaned = fallbackClean(raw);
  const cleanedKey = normalizeKey(cleaned);
  if (cleanedKey && cleanedKey !== key) {
    const viaClean = aliases[cleanedKey];
    if (viaClean) return viaClean;
  }

  return cleaned;
}

/** Capitalizes first letter, lowercases the rest. */
function capitalizeWord(word) {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Abbreviates a team name by shortening the first word.
 * Example: "Estados Unidos da América" -> "E. Unidos da América"
 * Single-word names are returned as-is (capitalized).
 * The name is normalized (see normalizeTeamName) before abbreviation,
 * so "SE Palmeiras" -> "Palmeiras" (no abbreviation needed) and
 * "Red Bull Bragantino" -> "R. Bull Bragantino".
 */
export function abbreviateTeamName(fullName) {
  const normalized = normalizeTeamName(fullName);
  if (!normalized) return "A definir";

  const parts = normalized.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts.map(capitalizeWord).join(" ");

  const first = parts[0];
  const rest = parts.slice(1).map((w) => {
    const lw = w.toLowerCase();
    if (SMALL_WORDS.includes(lw)) return lw;
    return capitalizeWord(w);
  });

  return `${first.charAt(0)}. ${rest.join(" ")}`;
}
