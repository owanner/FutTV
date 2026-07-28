import { useQuery } from "@tanstack/react-query";
import api from "../api/futtvApi";

/**
 * Fetches the unified cross-competition feed from /home/all.
 *
 * @param {Object} opts
 * @param {string} [opts.competitionId] — filter to a single competition
 * @param {"live"|"upcoming"|"recent"|"all"} [opts.status="all"]
 * @param {boolean} [opts.liveRefetch] — enable aggressive refetch for live matches
 */
export function useAllMatches({ competitionId, status = "all", liveRefetch = false } = {}) {
  return useQuery({
    queryKey: ["homeAll", competitionId, status, liveRefetch],
    queryFn: async ({ signal }) => {
      const params = {};
      if (competitionId) params.competitionId = competitionId;
      if (status && status !== "all") params.status = status;
      const { data } = await api.get("/home/all", { params, signal });
      return data;
    },
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: liveRefetch ? 15000 : false,
    refetchIntervalInBackground: liveRefetch
  });
}
