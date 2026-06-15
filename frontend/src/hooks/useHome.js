import { useQuery }
from "@tanstack/react-query";

import api
from "../api/futtvApi";

export function useHome() {

  return useQuery({

    queryKey: ["home"],

    queryFn: async () => {

      const response =
        await api.get("/home");

      return response.data;
    }
  });
}