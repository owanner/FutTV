import {
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Typography,
  Stack
} from "@mui/material";

import {
  useParams
} from "react-router-dom";

import {
  useMatch
} from "../../hooks/useMatch";

import MatchDetailsHero
  from "../../components/MatchDetailsHero/MatchDetailsHero";

import BroadcastList
  from "../../components/BroadcastList/BroadcastList";

import TimeLineCard
  from "../../components/TimeLineCard/TimeLineCard";

import LineupsCard
  from "../../components/LineupsCard/LineupsCard";

export default function MatchDetails() {

  const { id } =
    useParams();

  const {
    data,
    isLoading,
    error
  } = useMatch(id);

  if (isLoading) {

    return (
      <CircularProgress />
    );

  }

  if (error) {

    return (

      <Alert severity="error">

        Erro ao carregar partida

      </Alert>

    );

  }

  const match =
    data.match;

  const isUpcoming =
    match.status === 1;

  return (

    <Stack
      spacing={3}
      sx={{
        width: "100%",
        maxWidth: 880,
        mx: "auto"
      }}
    >

      <MatchDetailsHero
        match={match}
      />

      <BroadcastList
        broadcasts={
          match.broadcasts
        }
      />

      {isUpcoming ? (

        <Card>

          <CardContent>

            <Typography
              variant="h6"
              gutterBottom
            >

              Informações da Partida

            </Typography>

            <Typography
              color="text.secondary"
            >

              Escalações e eventos da partida
              estarão disponíveis quando o jogo
              começar.

            </Typography>

          </CardContent>

        </Card>

      ) : (

        <>

          <TimeLineCard
            events={
              data.timeline
            }
          />

          <LineupsCard
            live={data.live}
            homeFlag={match.homeFlag}
            awayFlag={match.awayFlag}
          />

        </>

      )}

    </Stack>

  );

}