import { useQuery } from "@tanstack/react-query";
import api from "../api/futtvApi";
import { useCompetition } from "../contexts/CompetitionContext";

/** Fetches all team standings for the active competition. */
export function useStandings() {
  const { competitionId } = useCompetition();
  return useQuery({
    queryKey: ["standings", competitionId],
    queryFn: async () => {
      const response = await api.get("/standings", { params: { competitionId } });
      return response.data;
    }
  });
}
