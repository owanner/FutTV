/**
 * Match status constants and helpers.
 * FIFA status codes: 0 = finished, 1 = scheduled, 3 = live
 */

const STATUS_MAP = {
  3: { label: "AO VIVO", color: "#DC2626", background: "#FEE2E2" },
  0: { label: "ENCERRADO", color: "#475569", background: "#E2E8F0" },
  1: { label: "PRÓXIMO", color: "#006A67", background: "#D9F3EF" }
};

const DEFAULT_STATUS = STATUS_MAP[1];

/** Returns label, color, and background for a FIFA status code. */
export function getStatus(status) {
  return STATUS_MAP[status] || DEFAULT_STATUS;
}

/** Shared status filter chips used across Matches, CompetitionDetail, and Clubs pages. */
export const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "live", label: "Ao vivo", accent: "#DC2626" },
  { value: "upcoming", label: "Próximos", accent: "#006A67" },
  { value: "finished", label: "Encerrados", accent: "#475569" }
];

/**
 * Split a flat match list into live / upcoming / finished buckets.
 */
export function splitByStatus(matches) {
  const live = [];
  const upcoming = [];
  const finished = [];
  for (const m of matches || []) {
    if (m.status === 3) live.push(m);
    else if (m.status === 0) finished.push(m);
    else if (m.status === 1) upcoming.push(m);
  }
  return { live, upcoming, finished };
}
