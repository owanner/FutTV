/**
 * General formatting utilities.
 */

/**
 * Normalizes text for search comparison:
 * lowercases, removes diacritics (accents), and trims.
 */
export function normalizeText(text) {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
