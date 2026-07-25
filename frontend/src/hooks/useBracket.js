import { useQuery } from "@tanstack/react-query";
import api from "../api/futtvApi";

/**
 * Fetch the knockout bracket for a competition (when supported).
 * @param {string} [competitionId] — optional override (used by CompetitionDetail)
 */
export function useBracket(overrideCompetitionId) {
  return useQuery({
    queryKey: ["bracket", overrideCompetitionId],
    queryFn: async ({ signal }) => {
      const { data } = await api.get("/bracket", {
        params: { competitionId: overrideCompetitionId },
        signal
      });
      return data;
    },
    enabled: !!overrideCompetitionId
  });
}
