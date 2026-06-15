import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography
} from "@mui/material";

import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import LiveTvOutlinedIcon from "@mui/icons-material/LiveTvOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";

import { sortBroadcasts } from "../../utils/broadcasts.js";

import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

const statusStyles = {
  3: {
    label: "AO VIVO",
    color: "#DC2626",
    background: "#FEE2E2"
  },
  0: {
    label: "ENCERRADO",
    color: "#475569",
    background: "#E2E8F0"
  },
  1: {
    label: "PRÓXIMO",
    color: "#006A67",
    background: "#E2E8F0"
  }
};

function formatBroadcasts(broadcasts = []) {
  if (broadcasts.length === 0) {
    return "";
  }

  const visible = broadcasts
    .slice(0, 2)
    .map((broadcast) => broadcast.name)
    .filter(Boolean);

  if (broadcasts.length <= 2) {
    return visible.join(", ");
  }

  return `${visible.join(", ")} +${broadcasts.length - 2} outras`;
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
          xs: "0.75rem",
          sm: "0.95rem"
        },

        lineHeight: 1.15,

        overflowWrap: "anywhere",

        maxWidth: "100%",

        mx: "auto"
      }}
    >
      {name || "A definir"}
    </Typography>
  );
}

export default function MatchHero({ match }) {
  const navigate = useNavigate();

  if (!match) {
    return null;
  }

  const status =
    statusStyles[match.status] ||
    {
      label: "PARTIDA",
      color: "#0 10px 20px rgba(0, 74, 72, 0.12)",
      background: "0 10px 20px rgba(0, 74, 72, 0.12)"
    };

  const hasScore =
    match.status === 0 ||
    match.status === 3;

  const broadcasts =
    sortBroadcasts(match.broadcasts || []);

  return (
    <Card
      sx={{
        width: "100%",
        maxWidth: 880,
        mx: "auto",
        mb: {
          xs: 1.25,
          sm: 1.5
        },
        overflow: "hidden",
        border: "1px solid rgba(0, 106, 103, 0.16)",
        background:
          "linear-gradient(135deg,#1E3A8A 0%, #334155 45%, #15803D 100%)",
        color: "#FFFFFF"
      }}
    >
      <CardActionArea
        onClick={() => navigate(`/match/${match.id}`)}
        sx={{
          color: "inherit"
        }}
      >
        <CardContent
          sx={{
            p: {
              xs: 1,
              sm: 1.5
            }
          }}
        >
          <Box>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <Typography
                variant="overline"
              >
                JOGO EM DESTAQUE
              </Typography>
              <Chip
                sx={{
                  backgroundColor: status.background,
                  color: status.color
                }}
                label={status.label}
                size="small"
              />
            </Stack>
            <Typography
              variant="h5"
              sx={{
                mt: 1.5,
                fontWeight: 800
              }}
            >
              {match.groupName}
            </Typography>

          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              alignContent: "center",
              justifyItems: "center",
              width: "100%",
              py: {
                xs: 1,
                sm: 1.25
              }
            }}
          >
            {/* Time Mandante - Bandeira acima, Nome abaixo */}
            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "center"
              }}
            >
 <Stack
  alignItems="center"
  spacing={0.75}
  sx={{
    width: "100%",
    maxWidth: {
      xs: 90,
      sm: 120
    },
    mx: "auto"
  }}
>
                <TeamBlock flag={match.homeFlag} name={match.homeTeam} />
                <TeamName name={match.homeTeam} />
              </Stack>
            </Box>

            {/* VS e Data - Centro */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: {
                  xs: 0.5,
                  sm: 1
                }
              }}
            >
              <Stack
                alignItems="center"
                spacing={0.25}
              >
                <Typography
                  sx={{
                    fontSize: {
                      xs: "1.2rem",
                      sm: "1.6rem"
                    },
                    lineHeight: 1,
                    fontWeight: 900
                  }}
                >
                  {hasScore
                    ? `${match.homeScore ?? 0} x ${match.awayScore ?? 0}`
                    : "VS"}
                </Typography>

                <Typography
                  variant="caption"
                  sx={{
                    alignSelf: "center",
                    color: "rgba(255, 255, 255, 0.7)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    fontSize: {
                      xs: "0.6rem",
                      sm: "0.7rem"
                    }
                  }}
                >
                  {dayjs(match.date).format("DD MMM")}
                </Typography>
              </Stack>
            </Box>

            {/* Time Visitante - Bandeira acima, Nome abaixo */}
            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "center"
              }}
            >
<Stack
  alignItems="center"
  spacing={0.75}
  sx={{
    width: "100%",
    maxWidth: {
      xs: 90,
      sm: 120
    },
    mx: "auto"
  }}
>
                <TeamBlock flag={match.awayFlag} name={match.awayTeam} />
                <TeamName name={match.awayTeam} />
              </Stack>
            </Box>
          </Box>

          <Stack
            direction={{
              xs: "column",
              md: "row"
            }}
            spacing={{
              xs: 1,
              md: 2
            }}
            sx={{
              mt: 1,
              pt: 1,
              borderTop: "1px solid rgba(255, 255, 255, 0.18)"
            }}
          >
            {match.stadium && (
              <InfoItem icon={<LocationOnOutlinedIcon fontSize="small" />}>
                {match.stadium}
              </InfoItem>
            )}

            <InfoItem icon={<AccessTimeOutlinedIcon fontSize="small" />}>
              {dayjs(match.date).format("DD/MM/YYYY HH:mm")}
            </InfoItem>

            {broadcasts.length > 0 && (
              <InfoItem
                icon={<LiveTvOutlinedIcon fontSize="small" />}
                logo={broadcasts[0]?.logo}
              >
                {formatBroadcasts(broadcasts)}
              </InfoItem>
            )}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

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
