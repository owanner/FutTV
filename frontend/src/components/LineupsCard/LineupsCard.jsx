import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  Stack,
  Chip
} from "@mui/material";

import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

function getDisplayPlayerName(fullName) {
  if (!fullName) {
    return "";
  }

  const parts = fullName.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0];
  }

  const upperWords = parts.filter(
    word =>
      word === word.toUpperCase() &&
      /[A-ZÀ-ÖØ-Ý]/.test(word)
  );

  // Marc CUCURELLA
  if (upperWords.length === 1) {
    return upperWords[0];
  }

  // SIDNY LOPES CABRAL
  if (upperWords.length > 1) {
    return upperWords[upperWords.length - 1];
  }

  // Lionel Messi
  return parts[parts.length - 1];
}

function PlayerRow({
  player,
  compact = false
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1,
        py: 0.75,
        borderRadius: 2,
        transition: "0.2s",

        "&:hover": {
          backgroundColor: "action.hover"
        }
      }}
    >
      <Box
        sx={{
          width: compact ? 22 : 28,
          height: compact ? 22 : 28,


          borderRadius: "50%",

          bgcolor: "primary.main",
          color: "white",

          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: compact ? 10 : 12,
          fontWeight: 700,

          flexShrink: 0
        }}
      >
        {player.ShirtNumber}
      </Box>

      <Typography
        variant={compact ? "caption" : "body2"}
        sx={{
          lineHeight: 1.2,
          fontWeight: compact ? 600 : 400
        }}
      >
        {compact
          ? getDisplayPlayerName(
            player.PlayerName?.[0]?.Description
          )
          : player.PlayerName?.[0]?.Description}
      </Typography>
    </Box>
  );
}

function TeamSection({
  starters,
  bench,
  compact
}) {
  return (
    <Box
      sx={{
        width: "100%"
      }}
    >
      <Box
        sx={{
          p: 2,

          borderRadius: 3,

          background:
            "linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)",

          boxShadow:
            "inset 0 0 0 1px rgba(16,22,26,0.05)"
        }}
      >
        <Chip
          label={`Titulares (${starters.length})`}
          color="success"
          size="small"
          sx={{ mb: 1.5 }}
        />

        <Stack spacing={0.5}>
          {starters.length > 0 ? (
            starters.map((player) => (
              <PlayerRow
                key={player.IdPlayer}
                player={player}
                compact={compact}
              />
            ))
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Nenhum titular registrado
            </Typography>
          )}
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Chip
          label={`Reservas (${bench.length})`}
          size="small"
          sx={{ mb: 1.5 }}
        />

        <Stack spacing={0.5}>
          {bench.length > 0 ? (
            bench.map((player) => (
              <PlayerRow
                key={player.IdPlayer}
                player={player}
                compact={compact}
              />
            ))
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Nenhuma reserva registrada
            </Typography>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

export default function LineupsCard({
  homeFlag,
  awayFlag,
  live
}) {

  if (!live) {
    return null;
  }

  const theme = useTheme();

  const compact =
    useMediaQuery(
      theme.breakpoints.down("md")
    );

  const homeTeam =
    live.HomeTeam;

  const awayTeam =
    live.AwayTeam;

  const homePlayers =
    homeTeam?.Players || [];

  const awayPlayers =
    awayTeam?.Players || [];

  const homeStarters =
    homePlayers.filter(
      (player) => player.Status === 1
    );

  const awayStarters =
    awayPlayers.filter(
      (player) => player.Status === 1
    );

  const homeBench =
    homePlayers.filter(
      (player) => player.Status === 2
    );

  const awayBench =
    awayPlayers.filter(
      (player) => player.Status === 2
    );

  return (
    <Card
      sx={{
        mb: 3,
        borderRadius: 1,

        background:
          "linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)",

        boxShadow:
          "0 8px 24px rgba(0,0,0,0.06)"
      }}
    >
      <CardContent
        sx={{
          px: {
            xs: 2,
            md: 3
          },

          py: {
            xs: 2,
            md: 3
          }
        }}
      >

       <Box
  sx={{
    display: "flex",
    justifyContent: "center",
  alignItems: "center",

    width: "100%",

    mb: 3,

    gap: {
      xs: 1,
      md: 5
    }
  }}
>
<Stack
  alignItems="center"
  spacing={1}
  sx={{
    width: {
      xs: 70,
      sm: 100
    },

    flexShrink: 1
  }}
>
            {homeFlag && (
              <Box
                component="img"
                src={homeFlag}
                alt="Mandante"
                sx={{
                  width: 48,
                  height: 34,
                  borderRadius: 0.5
                }}
              />
            )}

       <Typography
  sx={{
    width: 48,           // mesma largura da bandeira
    textAlign: "center",
    lineHeight: 1.1,
    fontWeight: 700,
    fontSize: "1rem",

    whiteSpace: "normal",
    
  }}
>
  {homeTeam?.TeamName?.[0]?.Description}
</Typography>
          </Stack>

          {/*<Typography
            sx={{
              fontSize: "1.6rem",
              fontWeight: 900,
              color: "primary.main"
            }}
          >
            VS
          </Typography>*/}
          <Typography
          sx={{
              fontSize: "1.0rem",
              fontWeight: 900,
              color: "primary.main"
            }}
          >
            Escalações
          </Typography>

          <Stack
  alignItems="center"
  spacing={1}
  sx={{
    width: {
      xs: 70,
      sm: 100
    },
    flexShrink: 1
  }}
>
            {awayFlag && (
              <Box
                component="img"
                src={awayFlag}
                alt="Visitante"
                sx={{
                  width: 48,
                  height: 34,
                  borderRadius: 0.5
                }}
              />
            )}

            <Typography
  sx={{
    width: 48,           // mesma largura da bandeira
    textAlign: "center",
    lineHeight: 1.1,
    fontWeight: 700,
    fontSize: "1rem",

    whiteSpace: "normal",
    
  }}
>
  {awayTeam?.TeamName?.[0]?.Description}
</Typography>
          </Stack>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            gap: {
              xs: 2,
              md: 3
            }
          }}
        >
          <Grid item xs={12} md={6}>
            <TeamSection
              starters={homeStarters}
              bench={homeBench}
              compact={compact}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TeamSection
              starters={awayStarters}
              bench={awayBench}
              compact={compact}
            />
          </Grid>
        </Box>

      </CardContent>
    </Card>
  );
}