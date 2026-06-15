import {

  Typography,

  CircularProgress,

  Grid,

  Alert

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

  function normalizeText(text) {
    if (!text) return "";
    return text
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\u0300-\u036f/g, "")
      .replace(/[\u0300-\u036f]/g, "");
  }

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

      {/*<Typography

        variant="h4"

        gutterBottom
      >

        Jogos

      </Typography>*/}

      <MatchesFilters

        search={search}

        setSearch={setSearch}

        status={status}

        setStatus={setStatus}
      />

      <Grid
        container
        spacing={2}
        justifyContent="center"
        sx={{
          maxWidth: 1400,
          mx: "auto",
          justifyContent: "center"
        }}
      >

        {

          filteredMatches.map(

            match => (

              <Grid

                item

                xs={12}

                sm={6}

                md={4}

                lg={4}

                key={match.id}
              >

                <MatchCard

                  match={match}
                />

              </Grid>
            )
          )
        }

      </Grid>

    </>
  );
}