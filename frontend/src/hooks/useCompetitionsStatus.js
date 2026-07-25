import { useQuery } from "@tanstack/react-query";
import api from "../api/futtvApi";

/**
 * Fetches per-competition status flags from /competitions/status.
 * Returns an object keyed by competitionId:
 *   { [id]: { id, hasUpcoming, hasLive, nextMatchDate, lastFinishedDate } }
 *
 * Used to decide which competitions are "active" (have upcoming/live matches)
 * vs "finished" (no upcoming/live anymore).
 */
export function useCompetitionsStatus() {
  return useQuery({
    queryKey: ["competitionsStatus"],
    queryFn: async ({ signal }) => {
      const { data } = await api.get("/competitions/status", { signal });
      const map = {};
      for (const c of data) map[c.id] = c;
      return map;
    },
    staleTime: 5 * 60 * 1000
  });
}
