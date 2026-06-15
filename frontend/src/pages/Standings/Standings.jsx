import {
  CircularProgress,
  Alert,
  Stack,
  Card,
  CardContent,
  Chip
} from "@mui/material";

import {
  useStandings
} from "../../hooks/useStandings";

import GroupStandings
from "../../components/GroupStandings/GroupStandings";

export default function Standings() {

  const {
    data,
    isLoading,
    error
  } = useStandings();

  if (isLoading) {

    return (
      <CircularProgress />
    );

  }

  if (error) {

    return (

      <Alert severity="error">

        Erro ao carregar classificação

      </Alert>

    );

  }

  const groups = {};

  data.forEach(team => {

    if (
      !groups[
        team.groupName
      ]
    ) {

      groups[
        team.groupName
      ] = [];

    }

    groups[
      team.groupName
    ].push(team);

  });

  return (

    <Stack spacing={3}>

      {/* Legenda */}

      <Card>

        <CardContent>

          <Stack
  direction="row"
  spacing={1}
  useFlexGap
  sx={{
    flexWrap: "wrap",
    justifyContent: "center"
  }}
>

         <Chip
  color="success"
  label="Classificado"
  sx={{
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem"
    }
  }}
/>

<Chip
  color="warning"
  label="Melhor 3º"
  sx={{
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem"
    }
  }}
/>

<Chip
  color="error"
  label="Eliminado"
  sx={{
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem"
    }
  }}
/>

          </Stack>

        </CardContent>

      </Card>

      {/* Grupos */}

      {

        Object.entries(
          groups
        ).map(

          ([groupName, teams]) => (

            <GroupStandings

              key={groupName}

              groupName={groupName}

              teams={teams}

            />

          )

        )

      }

    </Stack>

  );

}