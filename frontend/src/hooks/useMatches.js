import { useQuery } from "@tanstack/react-query";
import api from "../api/futtvApi";
import { useCompetition } from "../contexts/CompetitionContext";

/** Fetches all matches for the active competition. */
export function useMatches() {
  const { competitionId } = useCompetition();
  return useQuery({
    queryKey: ["matches", competitionId],
    queryFn: async () => {
      const response = await api.get("/matches", { params: { competitionId } });
      return response.data;
    }
  });
}
