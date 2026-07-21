import { useQuery } from "@tanstack/react-query";
import api from "../api/futtvApi";

/** Fetches team detail including standing, matches, and qualification status. */
export function useTeam(code) {
  return useQuery({
    queryKey: ["team", code],
    queryFn: async () => {
      const response = await api.get(`/teams/${code}`);
      return response.data;
    },
    enabled: !!code
  });
}
