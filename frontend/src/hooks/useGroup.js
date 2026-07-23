import { useQuery } from "@tanstack/react-query";
import api from "../api/futtvApi";
import { useCompetition } from "../contexts/CompetitionContext";

/** Fetches standings and matches for a specific group in the active competition. */
export function useGroup(letter) {
  const { competitionId } = useCompetition();
  return useQuery({
    queryKey: ["group", letter, competitionId],
    queryFn: async ({ signal }) => {
      const { data } = await api.get(`/group/${letter}`, { params: { competitionId }, signal });
      return data;
    },
    enabled: !!letter
  });
}
