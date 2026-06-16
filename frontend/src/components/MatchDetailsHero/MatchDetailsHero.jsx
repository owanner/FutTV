import {
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Divider,
  Box
} from "@mui/material";

import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import SportsScoreOutlinedIcon from '@mui/icons-material/SportsScoreOutlined';


import TeamBadge from "../TeamBadge/TeamBadge";

export default function MatchDetailsHero({ match }) {

  if (!match) {
    return null;
  }

  const statusLabel =
    match.status === 3
      ? "AO VIVO"
      : match.status === 0
        ? "ENCERRADO"
        : "PRÓXIMO";

  const isLiveOrFinished = match.status === 3 || match.status === 0;

  const scoreLabel = isLiveOrFinished &&
    Number.isFinite(match.homeScore) &&
    Number.isFinite(match.awayScore)
    ? `${match.homeScore} x ${match.awayScore}`
    : "";

  const centerLabel = isLiveOrFinished ? scoreLabel : "VS";

  function InfoItem({ icon, logo, children }) {
    return (
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{
          minWidth: 0,
          color: "rgba(255, 255, 255, 0.86)"
        }}
      >
        {logo ? (
          <Box
            component="img"
            src={logo}
            alt=""
            sx={{
              width: 36,
              height: 20,
              objectFit: "contain",
              flexShrink: 0
            }}
          />
        ) : (
          icon
        )}

        <Typography
          variant="body2"
          sx={{
            overflowWrap: "anywhere"
          }}
        >
          {children}
        </Typography>
      </Stack>
    );
  }

  function TeamBlock({ flag, name }) {
    return (
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center"
        }}
      >
        <Box
          sx={{
            width: {
              xs: 48,
              sm: 62
            },
            height: {
              xs: 36,
              sm: 46
            },

            mx: "auto",

            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            borderRadius: 1.5,
            backgroundColor: "rgba(255, 255, 255, 0.74)",
            border: "1px solid rgba(255, 255, 255, 0.72)",
            boxShadow: "0 10px 20px rgba(0, 74, 72, 0.12)"
          }}
        >
          <Box
            component="img"
            src={flag}
            alt={name || "Time"}
            sx={{
              width: "72%",
              height: "72%",
              objectFit: "contain"
            }}
          />
        </Box>
      </Box>
    );
  }

  function TeamName({ name }) {
    return (
      <Typography
        variant="h6"
        sx={{
          width: "100%",

          textAlign: "center",

          fontSize: {
            xs: "0.90rem",
            sm: "1.20rem"
          },

          lineHeight: 1.15,

          overflowWrap: "anywhere",

          maxWidth: {
            xs: 72,
            sm: 120
          },

          mx: "auto"
        }}
      >
        {name || "A definir"}
      </Typography>
    );
  }

  return (

    <Card
      sx={{
        width: "100%",
        mx: "auto",
        maxWidth: 880,
        overflow: "hidden",

        borderRadius: 1,

        boxShadow:
          "0 12px 40px rgba(0,0,0,.12)",

        border:
          "1px solid rgba(255,255,255,.08)",

        background:
          "linear-gradient(135deg,#172554 0%, #1F2937 50%, #166534 100%)",

        color: "#fff"
      }}
    >


      <CardContent
        sx={{
          pt: 4,
          pb: 4,
          px: {
            xs: 2,
            md: 4
          }
        }}
      >

        {/* Header */}

        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={3}
          mb={{ xs: 5, md: 7 }}
        >
          <Typography
            variant="h5"
            sx={{
              mt: 1.5,
              fontWeight: 800
            }}
          >
            {match.groupName || "Fases Finais"}
          </Typography>
          <Chip
            label={statusLabel}
            size="small"
            sx={{
              fontWeight: 700,
              bgcolor:
                match.status === 3
                  ? "#DC2626"
                  : match.status === 0
                    ? "#E2E8F0"
                    : "#dcf3d9)",
              color: "#E2E8F0"
            }}
          />
        </Stack>

        <Divider
          sx={{
            my: 1
          }}
        />

        {/* Times + placar */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr auto 1fr",
              md: "1fr auto 1fr"
            },
            alignItems: "center",
            gap: {
              xs: 1,
              sm: 2,
              md: 8
            },
            maxWidth: 900,
            mx: "auto"
          }}
        >

          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "center"
            }}
          >
            <Stack
              alignItems="center"
              justifyContent="flex-start"
              spacing={1}
              sx={{
                minHeight: {
                  xs: 95,
                  md: 120
                }
              }}
            >
              <TeamBlock flag={match.homeFlag} name={match.homeTeam} />
              <TeamName name={match.homeTeam} />
            </Stack>
          </Box>


          <Box
            sx={{
              textAlign: "center",
              minWidth: {
                xs: 90,
                sm: 120,
                md: 280
              }
            }}
          >
            <Typography
              variant="body2"
              sx={{
                alignSelf: "center",
                color: "rgba(255, 255, 255, 0.7)",
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: {
                  xs: "1rem",
                  sm: "2rem"
                }
              }}
            >
              {centerLabel || "\u00A0"}
            </Typography>

            <Typography
              sx={{
                mt: 1.5,
                fontSize: "1.05rem",
                fontWeight: 500,
                letterSpacing: "0.02em",
                color: "rgba(255,255,255,.75)"
              }}
            >
              {match.stageName || "Partida"}
            </Typography>
          </Box>

          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "center"
            }}
          >
            <Stack
              alignItems="center"
              justifyContent="flex-start"
              spacing={1}
              sx={{
                minHeight: {
                  xs: 95,
                  md: 120
                }
              }}
            >
              <TeamBlock flag={match.awayFlag} name={match.awayTeam} />
              <TeamName name={match.awayTeam} />
            </Stack>
          </Box>
        </Box>

        <Divider
          sx={{
            my: 3
          }}
        />

        {/* Estádio */}

        <Typography
          align="center"
        >

          {match.stadium && (
            <InfoItem icon={<LocationOnOutlinedIcon fontSize="small" />}>
              {match.stadium}
            </InfoItem>
          )}

        </Typography>

        {/* Árbitro */}
<Box sx={{ mt: 1 }}>
  <InfoItem icon={<SportsScoreOutlinedIcon fontSize="small" />}>
    Árbitro: {match.referee || "Não informado"}
  </InfoItem>
</Box>

      </CardContent>

    </Card>
  );
}