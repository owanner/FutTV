import {

  CircularProgress,

  Alert,

  Box

} from "@mui/material";

import {

  useMemo,

  useState

} from "react";

import { useMatches }
from "../../hooks/useMatches";

import MatchCard
from "../../components/MatchCard/MatchCard";

import MatchesFilters
from "../../components/MatchesFilters/MatchesFilters";

import { normalizeText } from "../../utils/formatUtils";

export default function Matches() {

  const {

    data,

    isLoading,

    error

  } = useMatches();

  const [

    search,

    setSearch

  ] = useState("");

  const [

    status,

    setStatus

  ] = useState("");

  const filteredMatches =
    useMemo(() => {

      if (!data) {

        return [];
      }

      const matches = data.filter(match => {

        /**
         * ==========================================
         * BUSCA
         * ==========================================
         */
        const needle = normalizeText(search);

        const matchesSearch =
          normalizeText(match.homeTeam).includes(needle) ||
          normalizeText(match.awayTeam).includes(needle);

        /**
         * ==========================================
         * STATUS
         * ==========================================
         */

        let matchesStatus =
          true;

        if (
          status === "live"
        ) {

          matchesStatus =
            match.status === 3;
        }

        if (
          status === "upcoming"
        ) {

          matchesStatus =
            match.status === 1;
        }

        if (
          status === "finished"
        ) {

          matchesStatus =
            match.status === 0;
        }

        return (

          matchesSearch &&

          matchesStatus
        );
      });

      return matches.sort((a, b) => {
        const priority = status =>
          status === 3 ? 0 : status === 1 ? 1 : 2;

        return priority(a.status) - priority(b.status);
      });

    }, [

      data,

      search,

      status

    ]);

  if (isLoading) {

    return (

      <CircularProgress />
    );
  }

  if (error) {

    return (

      <Alert
        severity="error"
      >

        Erro ao carregar partidas

      </Alert>
    );
  }

  return (

    <>

      <MatchesFilters

        search={search}

        setSearch={setSearch}

        status={status}

        setStatus={setStatus}
      />

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: { xs: 2, md: 1.5 }
        }}
      >
        {filteredMatches.map(match => (
          <Box
            key={match.id}
            sx={{
              width: { xs: "100%", sm: "calc(50% - 8px)", md: "calc(25% - 12px)" }
            }}
          >
            <MatchCard match={match} />
          </Box>
        ))}
      </Box>

    </>
  );
}