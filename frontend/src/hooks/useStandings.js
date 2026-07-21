import { useQuery } from "@tanstack/react-query";
import api from "../api/futtvApi";

/** Fetches all team standings ordered by group and position. */
export function useStandings() {
  return useQuery({
    queryKey: ["standings"],
    queryFn: async () => {
      const response = await api.get("/standings");
      return response.data;
    }
  });
}
