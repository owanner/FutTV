import { useQuery } from "@tanstack/react-query";
import api from "../api/futtvApi";

/**
 * Fetches the unified cross-competition feed from /home/all.
 *
 * @param {Object} opts
 * @param {string} [opts.competitionId] — filter to a single competition
 * @param {"live"|"upcoming"|"recent"|"all"} [opts.status="all"]
 */
export function useAllMatches({ competitionId, status = "all" } = {}) {
  return useQuery({
    queryKey: ["homeAll", competitionId, status],
    queryFn: async ({ signal }) => {
      const params = {};
      if (competitionId) params.competitionId = competitionId;
      if (status && status !== "all") params.status = status;
      const { data } = await api.get("/home/all", { params, signal });
      return data;
    }
  });
}
