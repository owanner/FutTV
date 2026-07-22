import {
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  Stack
} from "@mui/material";
import { useParams } from "react-router-dom";
import { useGroup } from "../../hooks/useGroup";
import GroupStandings from "../../components/GroupStandings/GroupStandings";
import MatchCard from "../../components/MatchCard/MatchCard";
import { PageLoader, PageError } from "../../components/PageLoader/PageLoader";

export default function GroupDetails() {
  const { letter } = useParams();
  const { data, isLoading, error } = useGroup(letter);

  if (isLoading) {
    return <PageLoader />;
  }

  if (error) {
    return <PageError message="Erro ao carregar grupo" />;
  }

  const matches = data?.matches || [];
  const upcomingMatches = matches
    .filter(match => match.status === 1 || match.status === 3)
    .sort((a, b) => {
      if (a.status === 3 && b.status !== 3) return -1;
      if (a.status !== 3 && b.status === 3) return 1;
      return new Date(a.date) - new Date(b.date);
    });
  const finishedMatches = matches.filter(match => match.status === 0);

  return (
    <Stack spacing={3}>
      <GroupStandings groupName={data.groupName} teams={data.standings} />

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Próximos Jogos
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {upcomingMatches.length > 0
              ? upcomingMatches.map(match => (
                  <Grid key={match.id} item xs={12} sm={6} md={4} lg={3}>
                    <MatchCard match={match} />
                  </Grid>
                ))
              : (
                  <Grid item xs={12}>
                    <Typography>Nenhum jogo futuro.</Typography>
                  </Grid>
                )
            }
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Jogos Encerrados
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {finishedMatches.length > 0
              ? finishedMatches.map(match => (
                  <Grid key={match.id} item xs={12} sm={6} md={4} lg={3}>
                    <MatchCard match={match} />
                  </Grid>
                ))
              : (
                  <Grid item xs={12}>
                    <Typography>Nenhum resultado disponível.</Typography>
                  </Grid>
                )
            }
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );
}
