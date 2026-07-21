/**
 * Team name utilities.
 * Handles abbreviation of long team names for compact UI display.
 */

const SMALL_WORDS = ["do", "da", "dos", "das", "de", "e", "the", "of", "and"];

/** Capitalizes first letter, lowercases the rest. */
function capitalizeWord(word) {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Abbreviates a team name by shortening the first word.
 * Example: "Estados Unidos da América" → "E. Unidos da América"
 * Single-word names are returned as-is (capitalized).
 */
export function abbreviateTeamName(fullName) {
  if (!fullName) return "A definir";

  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts.map(capitalizeWord).join(" ");

  const first = parts[0];
  const rest = parts.slice(1).map((w) => {
    const lw = w.toLowerCase();
    if (SMALL_WORDS.includes(lw)) return lw;
    return capitalizeWord(w);
  });

  return `${first.charAt(0)}. ${rest.join(" ")}`;
}
