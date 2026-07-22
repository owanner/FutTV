/**
 * Broadcast sorting utility.
 * Orders broadcast channels by priority (most popular first).
 */

const BROADCAST_PRIORITY = {
  "TV Globo": 1,
  "Cazé TV": 2,
  "sportv": 3,
  "Paramount": 4,
  "SBT": 5,
  "EPSN no Disney": 6,
  "GE TV": 7,
  "GETV": 8,
  "Globoplay": 9,
  "NSPORTS": 10
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
