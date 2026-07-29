/**
 * General formatting utilities.
 */
import dayjs from "dayjs";

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
 * Smart date label for match cards.
 * - Same day → "Hoje"
 * - Tomorrow → "Amanhã"
 * - Same week (Mon–Sun) → day name (e.g. "Sexta")
 * - Otherwise → formatted date (e.g. "04 de agosto")
 */
export function formatMatchDate(date) {
  const d = dayjs(date);
  const now = dayjs();

  if (d.isSame(now, "day")) return "hoje";
  if (d.isSame(now.add(1, "day"), "day")) return "amanhã";

  // Current week: Monday (1) to Sunday (0)
  const startOfWeek = now.startOf("week").add(1, "day"); // Monday
  const endOfWeek = startOfWeek.add(6, "day"); // Sunday

  if (d.isAfter(startOfWeek.subtract(1, "day")) && d.isBefore(endOfWeek.add(1, "day"))) {
    return d.format("dddd");
  }

  return d.format("DD [de] MMMM");
}
