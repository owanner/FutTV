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

/**
 * Formats a list of broadcasts into a display string.
 * Shows up to 2 names, then "+N outras" if more exist.
 * Example: "TV Globo, SBT +3 outras"
 */
export function formatBroadcasts(broadcasts = []) {
  if (broadcasts.length === 0) return "";

  const visible = broadcasts
    .slice(0, 2)
    .map((b) => b.name)
    .filter(Boolean);

  if (broadcasts.length <= 2) {
    return visible.join(", ");
  }

  return `${visible.join(", ")} +${broadcasts.length - 2} outras`;
}
