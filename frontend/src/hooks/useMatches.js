import { useQuery } from "@tanstack/react-query";
import api from "../api/futtvApi";
import { useCompetition } from "../contexts/CompetitionContext";

/**
 * Fetches all matches for the active competition.
 * @param {string} [overrideCompetitionId] — optional override (used by CompetitionDetail)
 */
export function useMatches(overrideCompetitionId) {
  const { competitionId: ctxId } = useCompetition();
  const competitionId = overrideCompetitionId || ctxId;
  return useQuery({
    queryKey: ["matches", competitionId],
    queryFn: async ({ signal }) => {
      const { data } = await api.get("/matches", { params: { competitionId }, signal });
      return data;
    }
  });
}
