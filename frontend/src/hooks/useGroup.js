import { useQuery }
from "@tanstack/react-query";

import api
from "../api/futtvApi";

export function useGroup(
  letter
) {

  return useQuery({

    queryKey: [
      "group",
      letter
    ],

    queryFn: async () => {

      const response =

        await api.get(
          `/group/${letter}`
        );

      return response.data;
    },

    enabled:
      !!letter

  });

}