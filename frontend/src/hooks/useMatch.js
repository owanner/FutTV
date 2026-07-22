import { useQuery } from "@tanstack/react-query";
import api from "../api/futtvApi";

/** Fetches detailed match data including timeline and live stats. */
export function useMatch(id) {
  return useQuery({
    queryKey: ["match", id],
    queryFn: async () => {
      const response = await api.get(`/matches/${id}/details`);
      return response.data;
    },
    enabled: !!id
  });
}
