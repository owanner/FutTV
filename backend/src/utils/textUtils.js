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
 * Extrai todas as palavras de um nome (sem filtrar por comprimento ou tokens jurídicos).
 * Usado para verificação de substring completa.
 */
function getAllWords(name) {
  if (!name) return new Set();
  const norm = normalizeText(name);
  return new Set(norm.split(" ").filter(Boolean));
}

/**
 * Verifica se dois nomes de time provavelmente se referem ao mesmo clube.
 * Regra: dois times são considerados iguais se:
 * 1. Os nomes normalizados são idênticos, OU
 * 2. Um nome é substring do outro (ex: "Flamengo" em "CR Flamengo") E
 *    eles compartilham pelo menos uma palavra significativa, OU
 * 3. Eles compartilham pelo menos uma palavra significativa (>= 4 chars).
 * 
 * Isso evita falsos positivos como "Santos" matching com "Independente Santa Fe"
 * porque "santos" não compartilha uma palavra significativa (>=4) com "santa fe".
 */
function isSameTeam(teamA, teamB) {
  if (!teamA || !teamB) return false;
  
  const a = normalizeText(teamA);
  const b = normalizeText(teamB);
  
  // Nomes idênticos
  if (a === b) return true;
  
  const kA = teamMatchKey(teamA);
  const kB = teamMatchKey(teamB);
  
  // Compartilham pelo menos uma palavra significativa
  if (kA.size > 0 && kB.size > 0) {
    for (const w of kA) {
      if (kB.has(w)) return true;
    }
  }
  
  // Um nome é substring do outro e compartilham palavras
  // Ex: "Flamengo" em "Club de Regatas do Flamengo"
  if (a.includes(b) || b.includes(a)) {
    const wordsA = getAllWords(teamA);
    const wordsB = getAllWords(teamB);
    // Verificar se compartilham pelo menos uma palavra de 4+ caracteres
    for (const w of wordsA) {
      if (w.length >= 4 && wordsB.has(w)) return true;
    }
    for (const w of wordsB) {
      if (w.length >= 4 && wordsA.has(w)) return true;
    }
  }
  
  return false;
}

module.exports = { normalizeText, teamMatchKey, isSameTeam, getAllWords };
