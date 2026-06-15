const BROADCAST_PRIORITY = {
  "Cazé TV": 1,
  "TV Globo": 2,
  "SBT": 3,
  "sportv": 4,
  "GETV": 5,
  "Globoplay": 6,
  "NSPORTS": 7
};

export function sortBroadcasts(broadcasts = []) {
  return [...broadcasts].sort((a, b) => {
    const priorityA =
      BROADCAST_PRIORITY[a.name] ?? 999;

    const priorityB =
      BROADCAST_PRIORITY[b.name] ?? 999;

    return priorityA - priorityB;
  });
}