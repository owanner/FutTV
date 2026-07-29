import { useQuery } from "@tanstack/react-query";
import api from "../api/futtvApi";

/**
 * Fetches the list of clubs that have upcoming (or live) matches across
 * every competition. TanStack Query caches this in memory — the cache acts
 * as our lightweight local "database" between calls, so navigation back to
 * the Clubs page is instant and the /clubs/:code detail fetch is the only
 * network round-trip triggered when a user expands a club.
 *
 * Backend `/clubs` already returns:  clubs[] = {
 *   teamCode, teamName, badge, priority, primaryCompetition,
 *   competitions: [{ id, name, shortName, colors }],
 *   standing, upcomingCount, liveCount
 * }
 */
export function useClubs() {
  return useQuery({
    queryKey: ["clubs"],
    queryFn: async ({ signal }) => {
      const { data } = await api.get("/clubs", { signal, params: { limit: 300 } });
      return data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

/**
 * Fetches the full per-club feed: every match the club participates in across
 * ALL competitions (live + upcoming + finished), each annotated with its
 * competition metadata (competitionName / competitionColors) by the backend.
 */
export function useClub(code) {
  return useQuery({
    queryKey: ["club", code],
    queryFn: async ({ signal }) => {
      if (!code) return null;
      const { data } = await api.get(`/clubs/${code}`, { signal });
      return data;
    },
    enabled: !!code,
    staleTime: 1000 * 30,
  });
}
