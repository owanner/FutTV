import { useQuery } from "@tanstack/react-query";
import api from "../api/futtvApi";

/** Fetches the knockout bracket data generated from group standings. */
export function useBracket() {
  return useQuery({
    queryKey: ["bracket"],
    queryFn: async () => {
      const response = await api.get("/bracket");
      return response.data;
    }
  });
}
