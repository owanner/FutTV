/**
 * Text normalization utilities for fuzzy matching.
 */

function normalizeText(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Prefixos/sufixos jurídicos que algumas fontes (CBF, football-data, CONMEBOL)
 * adicionam aos nomes dos times (CA, SC, CR, EC, FC, SAF, ...).
 * São removidos antes de comparar nomes para evitar falsos negativos.
 */
const JURIDICAL_TOKENS = new Set([
  "ca","sc","cr","ec","ac","aa","cs","cd","car","cdp","ce","ct","cap","sp",
  "fc","fr","sa","saf","fc","ac","ec","gr","cr","sc","cl","adc",
  "club","clube","de","do","da","dos","das","the","of","and","e"
]);

/**
 * Extrai um conjunto de palavras "significativas" do nome de um time,
 * removendo prefixos/sufixos jurídicos e palavras muito curtas.
 * Usado para casamento entre nomes vindos de fontes diferentes.
 */
function teamMatchKey(name) {
  if (!name) return new Set();
  const norm = normalizeText(name);
  return new Set(
    norm
      .split(" ")
      .filter(Boolean)
      .filter((w) => !JURIDICAL_TOKENS.has(w))
      .filter((w) => w.length >= 4)
  );
}

/**
 * Verifica se dois nomes de time provavelmente se referem ao mesmo clube,
 * comparando suas palavras significativas comuns (>= 4 chars).
 * Retorna true se houver ao menos uma palavra longa em comum.
 */
function isSameTeam(teamA, teamB) {
  if (!teamA || !teamB) return false;
  const a = normalizeText(teamA);
  const b = normalizeText(teamB);
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const kA = teamMatchKey(teamA);
  const kB = teamMatchKey(teamB);
  if (!kA.size || !kB.size) return false;
  for (const w of kA) if (kB.has(w)) return true;
  return false;
}

module.exports = { normalizeText, teamMatchKey, isSameTeam };
