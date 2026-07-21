/**
 * Broadcast sorting utility.
 * Orders broadcast channels by priority (most popular first).
 */

const BROADCAST_PRIORITY = {
  "Cazé TV": 1,
  "TV Globo": 2,
  "SBT": 3,
  "sportv": 4,
  "GETV": 5,
  "Globoplay": 6,
  "NSPORTS": 7
};

/** Deduplicates broadcasts by name, keeping the first occurrence. */
function deduplicate(broadcasts = []) {
  const seen = new Set();
  return broadcasts.filter((b) => {
    if (seen.has(b.name)) return false;
    seen.add(b.name);
    return true;
  });
}

/** Deduplicates and sorts broadcasts by priority. Unknown broadcasters are placed last. */
export function sortBroadcasts(broadcasts = []) {
  return deduplicate(broadcasts).sort((a, b) => {
    const priorityA = BROADCAST_PRIORITY[a.name] ?? 999;
    const priorityB = BROADCAST_PRIORITY[b.name] ?? 999;
    return priorityA - priorityB;
  });
}
