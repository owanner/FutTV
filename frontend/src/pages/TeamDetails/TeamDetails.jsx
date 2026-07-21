import { Alert, CircularProgress, Stack, Card, CardContent, Typography, Box } from "@mui/material";
import { useParams } from "react-router-dom";
import { useTeam } from "../../hooks/useTeam";
import TeamHeader from "../../components/TeamHeader/TeamHeader";
import MatchCard from "../../components/MatchCard/MatchCard";

import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HandshakeIcon from "@mui/icons-material/Handshake";
import CancelIcon from "@mui/icons-material/Cancel";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

/** Stat card definitions — maps team data fields to display cards. */
const STAT_CARDS = [
  { key: "points", label: "Pontos", icon: EmojiEventsIcon },
  { key: "played", label: "Jogos", icon: SportsSoccerIcon },
  { key: "wins", label: "Vitórias", icon: CheckCircleIcon },
  { key: "goalDifference", label: "Saldo", icon: TrendingUpIcon, format: (v) => (v > 0 ? `+${v}` : v) },
  { key: "draws", label: "Empates", icon: HandshakeIcon },
  { key: "losses", label: "Derrotas", icon: CancelIcon }
];

export default function TeamDetails() {
  const { code } = useParams();
  const { data, isLoading, error } = useTeam(code);

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">Erro ao carregar seleção</Alert>;

  return (
    <Stack spacing={3}>
      <TeamHeader team={data.team} />

      {/* Stats grid */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Estatísticas</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2, mt: 2 }}>
            {STAT_CARDS.map(({ key, label, icon: Icon, format }) => (
              <Card key={key} variant="outlined">
                <CardContent>
                  <Icon />
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                  <Typography variant="h5">
                    {format ? format(data.team[key]) : data.team[key]}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Upcoming matches */}
      <Card>
        <CardContent>
          <Typography variant="h6">Próximos Jogos</Typography>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {data.nextMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Finished matches */}
      <Card>
        <CardContent>
          <Typography variant="h6">Jogos Encerrados</Typography>
          <Stack spacing={2} sx={{ mt: 2 }}>
            {data.finishedMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
