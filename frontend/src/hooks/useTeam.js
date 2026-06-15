import {
  useQuery
}
from "@tanstack/react-query";

import api
from "../api/futtvApi";

export function useTeam(
  code
) {

  return useQuery({

    queryKey: [
      "team",
      code
    ],

    queryFn: async () => {

      const response =

        await api.get(
          `/team/${code}`
        );

      return response.data;

    },

    enabled:
      !!code

  });

}