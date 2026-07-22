import { Stack, Box, Typography } from "@mui/material";
import { useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useMatch } from "../../hooks/useMatch";
import { getCompetition } from "../../config/competitions";
import MatchDetailsHero from "../../components/MatchDetailsHero/MatchDetailsHero";
import BroadcastList from "../../components/BroadcastList/BroadcastList";
import TimeLineCard from "../../components/TimeLineCard/TimeLineCard";
import LineupsCard from "../../components/LineupsCard/LineupsCard";
import { PageLoader, PageError } from "../../components/PageLoader/PageLoader";
import useNav from "../../hooks/useNav";

export default function MatchDetails() {
  const { id } = useParams();
  const navigate = useNav();
  const { data, isLoading, error } = useMatch(id);

  if (isLoading) return <PageLoader />;
  if (error) return <PageError message="Erro ao carregar partida" />;

  const match = data.match;
  const competition = getCompetition(match.competitionId);
  const colors = competition?.colors || { primary: "#19AE47", secondary: "#FFDC02" };
  const isUpcoming = match.status === 1;

  return (
    <Stack spacing={2.5} sx={{ maxWidth: 880, mx: "auto" }}>
      {/* Back arrow + competition badge */}
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box
          onClick={() => navigate(-1)}
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            color: "text.secondary",
            "&:hover": { color: "text.primary" }
          }}
        >
          <ArrowBackIcon />
        </Box>
        <Box
          sx={{
            height: 4,
            width: 24,
            borderRadius: 2,
            background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary || colors.primary})`
          }}
        />
        <Typography variant="caption" sx={{ fontWeight: 700, color: colors.primary }}>
          {competition?.shortName || competition?.name || match.competitionId}
        </Typography>
      </Stack>

      {/* Hero card */}
      <MatchDetailsHero match={match} colors={colors} />

      {/* Broadcasts */}
      <BroadcastList broadcasts={match.broadcasts} colors={colors} />

      {isUpcoming ? (
        <Box
          sx={{
            p: 3,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            textAlign: "center",
            background: `linear-gradient(135deg, ${colors.primary}06, ${colors.secondary || colors.primary}04)`
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            Escalacoes e eventos da partida estarao disponiveis quando o jogo comecar.
          </Typography>
        </Box>
      ) : (
        <>
          <TimeLineCard events={data.timeline} colors={colors} />
          <LineupsCard
            live={data.live}
            homeFlag={match.homeFlag}
            awayFlag={match.awayFlag}
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
            colors={colors}
          />
        </>
      )}
    </Stack>
  );
}
