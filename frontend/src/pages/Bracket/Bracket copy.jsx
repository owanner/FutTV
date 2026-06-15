import {

  CircularProgress,
  Alert,
  Stack

} from "@mui/material";

import {
  useBracket
}
from "../../hooks/useBracket";

import BracketColumn
from "../../components/BracketColumn/BracketColumn";

export default function Bracket() {

  const {

    data,

    isLoading,

    error

  } = useBracket();

  if (isLoading) {

    return (
      <CircularProgress />
    );
  }

  if (error) {

    return (

      <Alert severity="error">

        Erro ao carregar chaveamento

      </Alert>
    );
  }

  return (

    <Stack

      direction="row"

      spacing={4}

      sx={{

        overflowX: "auto",

        pb: 3
      }}
    >

      <BracketColumn

        title="16avos"

        matches={
          data.roundOf32 || []
        }
      />

      <BracketColumn

        title="Oitavas"

        matches={
          data.roundOf16 || []
        }
      />

      <BracketColumn

        title="Quartas"

        matches={
          data.quarterFinals || []
        }
      />

      <BracketColumn

        title="Semifinais"

        matches={
          data.semiFinals || []
        }
      />

      <BracketColumn

        title="Final"

        matches={
          data.final || []
        }
      />

    </Stack>
  );
}