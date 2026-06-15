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
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";

import { sortBroadcasts } from "../../utils/broadcasts";

import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

const statusMap = {
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
    background: "#D9F3EF"
  }
};

function getStatus(status) {
  return (
    statusMap[status] || {
      label: "PARTIDA",
      color: "#006A67",
      background: "#D9F3EF"
    }
  );
}

function Team({ flag, name, onClick }) {
  function capitalizeWord(word) {
    if (!word) return "";
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }

  function abbreviateTeamName(fullName) {
    if (!fullName) return "A definir";

    const smallWords = [
      "do",
      "da",
      "dos",
      "das",
      "de",
      "e",
      "the",
      "of",
      "and"
    ];

    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length <= 1) return parts.map(capitalizeWord).join(" ");

    const first = parts[0];
    const rest = parts.slice(1).map((w) => {
      const lw = w.toLowerCase();
      if (smallWords.includes(lw)) return lw;
      return capitalizeWord(w);
    });

    return `${first.charAt(0).toUpperCase()}. ${rest.join(" ")}`;
  }

  const displayName = abbreviateTeamName(name);

  const hasFlag = Boolean(flag);

  return (
    <Stack
      alignItems="center"
      spacing={0.75}
      sx={{
        width: "100%",
        flex: 1,
        maxWidth: 110,

        display: "flex",
        justifyContent: "center",
        textAlign: "center"
      }}
    >
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center"
        }}
      >
        <Box
          sx={{
            width: 62,
            height: 48,

            mx: "auto",

            display: "grid",
            placeItems: "center",

            borderRadius: 1.5,
            backgroundColor: "#F8FAFC",
            border: "1px solid rgba(16, 32, 29, 0.08)"
          }}
        >

          {hasFlag ? (
            <Box
              component="img"
              src={flag}
              alt={name || "Time"}
              sx={{
                width: 46,
                height: 36,
                objectFit: "contain"
              }}
            />
          ) : (
            <FlagOutlinedIcon sx={{ color: "text.secondary", fontSize: 28 }} />
          )}
        </Box>
      </Box>
      <Typography
        component="span"
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            onClick(event);
          }
        }}
        sx={{
          width: "100%",

          color: "text.primary",
          cursor: "pointer",

          fontWeight: 800,
          fontSize: "0.95rem",
          lineHeight: 1.1,

          textAlign: "center",

          overflow: "hidden",

          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",

          outline: "none",

          "&:hover": {
            color: "primary.main"
          },

          "&:focus-visible": {
            color: "primary.main",
            textDecoration: "underline"
          }
        }}
      >
        {displayName}
      </Typography>

    </Stack>
  );
}

function MetaItem({ icon, logo, children }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      sx={{
        minWidth: 0,
        color: "text.secondary",
        minHeight: 20
      }}
    >
      <Box
        sx={{
          width: 28,
          minWidth: 28,
          height: 18,

          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          flexShrink: 0
        }}
      >
        {logo ? (
          <Box
            component="img"
            src={logo}
            alt=""
            sx={{
              maxWidth: 28,
              maxHeight: 18,
              objectFit: "contain"
            }}
          />
        ) : (
          icon
        )}
      </Box>

      <Typography
        variant="caption"
        sx={{
          minWidth: 0,

          display: "flex",
          alignItems: "center",

          lineHeight: 1.2,

          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }}
      >
        {children}
      </Typography>
    </Stack>
  );
}

export default function MatchCard({
  match,
  compact = false
}) {
  const navigate = useNavigate();
  const status = getStatus(match.status);
  const broadcasts =
    sortBroadcasts(
      match.broadcasts || []
    );
  const hasScore =
    match.status === 0 ||
    match.status === 3;

  function openTeam(event, code) {
    event.stopPropagation();

    if (code) {
      navigate(`/team/${code}`);
    }
  }

  return (
    <Card
      sx={{
        width: 320,
        maxWidth: 320,
        height: 260,
        mx: "auto",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        transition: "transform .18s ease, box-shadow .18s ease",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 8px 18px rgba(81, 81, 81, 0.19)"
        }
      }}
    >
      <CardActionArea
        onClick={() => navigate(`/match/${match.id}`)}
        sx={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          p: 0,
          "&:hover": {
            backgroundColor: "transparent"
          }
        }}
      >
        <CardContent
          sx={{
            width: "100%",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            p: 1.5,
            height: "100%",
            overflow: "hidden",
          }}
        >
          <Stack
            direction="row"
            justifyContent="center"
            alignItems="center"
            spacing={2}
          >
            <Box
              sx={{
                minWidth: 0
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontWeight: 800,
                  textTransform: "uppercase"
                }}
              >
                {dayjs(match.date).format("DD MMM")}
              </Typography>

              <Typography
                variant="subtitle2"
                sx={{
                  mt: 0.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                {match.groupName || match.stageName || "Partida"}
              </Typography>
            </Box>

            <Chip
              size="small"
              label={status.label}
              sx={{
                flexShrink: 0,
                color: status.color,
                backgroundColor: status.background
              }}
            />
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
              alignItems: "center",
              justifyItems: "center",
              py: 1.5,
              overflow: "visible"
            }}
          >
            <Box
              sx={{
                display: "flex",
                width: "100%",
                minWidth: 0
              }}
            >
              <Team
                flag={match.homeFlag}
                name={match.homeTeam}
                onClick={(event) => openTeam(event, match.homeCode)}
              />
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                px: 1,
                minWidth: 0
              }}
            >
              <Stack
                alignItems="center"
                spacing={0.5}
                sx={{
                  width: 100,
                  flexShrink: 0
                }}
              >
                <Typography
                  align="center"
                  sx={{
                    color: hasScore
                      ? "text.primary"
                      : "primary.main",
                    fontSize: hasScore
                      ? "1.35rem"
                      : "0.9rem",
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
                  align="center"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 700
                  }}
                >
                  {dayjs(match.date).format("HH:mm")}
                </Typography>
              </Stack>
            </Box>

            <Box
              sx={{
                display: "flex",
                width: "100%"
              }}
            >
              <Team
                flag={match.awayFlag}
                name={match.awayTeam}
                onClick={(event) => openTeam(event, match.awayCode)}
              />
            </Box>
          </Box>

          <Stack
            spacing={0.5}
            sx={{
              pt: 1,
              borderTop: "1px solid",
              borderColor: "divider",
              flexShrink: 0,
              maxHeight: "fit-content",
            }}
          >
            <MetaItem
              icon={
                <AccessTimeOutlinedIcon
                  sx={{
                    fontSize: 18,
                    color: "text.secondary"
                  }}
                />
              }>
              {dayjs(match.date).format("DD/MM/YYYY HH:mm")}
            </MetaItem>

            {broadcasts.length > 0 && (
              <MetaItem
                icon={<LiveTvOutlinedIcon
                  sx={{
                    fontSize: 18,
                    color: "text.secondary"
                  }}
                />}
                logo={broadcasts[0]?.logo}
              >
                {broadcasts[0].name}
                {broadcasts.length > 1
                  ? ` +${broadcasts.length - 1}`
                  : ""}
              </MetaItem>
            )}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
