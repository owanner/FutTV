import { useQuery } from "@tanstack/react-query";
import api from "../api/futtvApi";

/** Fetches all matches with broadcast information. */
export function useMatches() {
  return useQuery({
    queryKey: ["matches"],
    queryFn: async () => {
      const response = await api.get("/matches");
      return response.data;
    }
  });
}
