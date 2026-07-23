import { useQuery } from "@tanstack/react-query";
import api from "../api/futtvApi";
import { useCompetition } from "../contexts/CompetitionContext";

/**
 * Fetches all team standings for the active competition.
 * @param {string} [overrideCompetitionId] — optional override (used by CompetitionDetail)
 */
export function useStandings(overrideCompetitionId) {
  const { competitionId: ctxId } = useCompetition();
  const competitionId = overrideCompetitionId || ctxId;
  return useQuery({
    queryKey: ["standings", competitionId],
    queryFn: async ({ signal }) => {
      const { data } = await api.get("/standings", { params: { competitionId }, signal });
      return data;
    }
  });
}
