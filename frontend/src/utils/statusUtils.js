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

/** Returns true if the match status indicates a score should be shown (live or finished). */
export function hasScore(status) {
  return status === 0 || status === 3;
}
