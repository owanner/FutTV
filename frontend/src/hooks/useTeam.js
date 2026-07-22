import { useQuery } from "@tanstack/react-query";
import api from "../api/futtvApi";
import { useCompetition } from "../contexts/CompetitionContext";

/** Fetches team detail for the active competition. */
export function useTeam(code) {
  const { competitionId } = useCompetition();
  return useQuery({
    queryKey: ["team", code, competitionId],
    queryFn: async () => {
      const response = await api.get(`/teams/${code}`, { params: { competitionId } });
      return response.data;
    },
    enabled: !!code
  });
}
