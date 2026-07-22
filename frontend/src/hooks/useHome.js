import { useQuery } from "@tanstack/react-query";
import api from "../api/futtvApi";
import { useCompetition } from "../contexts/CompetitionContext";

/** Fetches home page data for the active competition. */
export function useHome() {
  const { competitionId } = useCompetition();
  return useQuery({
    queryKey: ["home", competitionId],
    queryFn: async () => {
      const response = await api.get("/home", { params: { competitionId } });
      return response.data;
    }
  });
}
