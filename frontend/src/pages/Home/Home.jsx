import {
  Box,
  CircularProgress,
  Stack,
  Typography
} from "@mui/material";

import MatchCard from "../../components/MatchCard/MatchCard";
import MatchHero from "../../components/MatchHero/MatchHero";
import { useHome } from "../../hooks/useHome";
import { useMatches } from "../../hooks/useMatches";

function uniqueMatches(matches) {
  const seen = new Set();

  return matches.filter((match) => {
    if (!match?.id || seen.has(match.id)) {
      return false;
    }

    seen.add(match.id);
    return true;
  });
}

function sortByDate(matches) {
  return [...matches].sort(
    (first, second) =>
      new Date(first.date).getTime() -
      new Date(second.date).getTime()
  );
}

function getFeaturedMatch(matches, fallback) {
  const liveMatch = sortByDate(
    matches.filter((match) => match.status === 3)
  )[0];

  if (liveMatch) {
    return liveMatch;
  }

  const nextMatch = sortByDate(
    matches.filter((match) => match.status === 1)
  )[0];

  return nextMatch || fallback || matches[0] || null;
}

export default function Home() {
  const {
    data,
    isLoading
  } = useHome();

  const {
    data: matchesData,
    isLoading: isLoadingMatches
  } = useMatches();

  if (isLoading || isLoadingMatches) {
    return (
      <Box
        sx={{
          minHeight: 360,
          display: "grid",
          placeItems: "center"
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const allMatches = uniqueMatches([
    data?.featuredMatch,
    ...(data?.liveMatches || []),
    ...(data?.todayMatches || []),
    ...(data?.tomorrowMatches || []),
    ...(data?.upcomingMatches || []),
    ...(matchesData || [])
  ].filter(Boolean));

  const featuredMatch = getFeaturedMatch(
    allMatches,
    data?.featuredMatch
  );

  const now = new Date();

  const carouselMatches = sortByDate(
    allMatches.filter((match) => {
      if (match.id === featuredMatch?.id) {
        return false;
      }

      if (match.status === 0) {
        return false;
      }

      return new Date(match.date).getTime() >= now.getTime();
    })
  ).slice(0, 4);

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        px: 2,
        pt: 0,
        pb: 0
      }}
    >
      <Stack
        spacing={{
          xs: 0.5,
          md: 1
        }}
        alignItems="center"
        sx={{
          width: "100%",
          maxWidth: 880,
          minHeight: 0,
          pb: 2
        }}
      >
        <Box
          sx={{
            flexShrink: 0,
            width: "100%",
            display: "flex",
            justifyContent: "center"
          }}
        >
          <MatchHero match={featuredMatch} />
        </Box>

        <Stack
          spacing={1.5}
          alignItems="center"
          sx={{
            width: "100%",
            maxWidth: 880,
            mx: "auto",
            minHeight: 0,
            flex: 1
          }}
        >
          <Stack
            direction="row"
            alignItems="flex-end"
            justifyContent="space-between"
            spacing={2}
          >
            <Box width="100%">

              <Typography
                variant="overline"
                sx={{
                  color: "primary.main",
                  fontWeight: 900
                }}
              >
                Agenda
              </Typography>

              <Typography
                sx={{
                  fontSize: {
                    xs: "1.1rem",
                    sm: "1.3rem",
                    md: "1.5rem"
                  },
                  fontWeight: 700,
                  lineHeight: 1.1
                }}
              >
                Próximas partidas
              </Typography>

            </Box>
          </Stack>

          {carouselMatches.length === 0 ? (
            <Box
              sx={{
                py: 5,
                px: 2,
                textAlign: "center",
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: 2,
                backgroundColor: "background.paper",
              }}
            >
              <Typography
                sx={{
                  fontSize: {
                    xs: "1.1rem",
                    sm: "1.3rem",
                    md: "1.5rem"
                  },
                  fontWeight: 700,
                  lineHeight: 1.1
                }}
              >
                Nenhuma próxima partida
              </Typography>

              <Typography color="text.secondary">
                Quando a agenda for atualizada, os jogos aparecem aqui.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                width: "100%",

                display: {
                  xs: "block",
                  md: "flex"
                },

                overflowX: {
                  xs: "visible",
                  md: "auto"
                },

                overflowY: "hidden",

                pb: {
                  xs: 0,
                  md: 1
                },
                pb: 0,
                flex: 1,
                mx: 0,
                px: 0,
                scrollSnapType: "x proximity",
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": {
                  height: 4
                },

                "&::-webkit-scrollbar-track": {
                  background: "transparent"
                },

                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "rgba(91, 91, 91, 0.04)",
                  borderRadius: 999
                }
              }}
            >
              <Stack
                direction="row"
                spacing={{
                  xs: 1.5,
                  md: 1
                }}
                sx={{
                  width: "fit-content",
                  pl: 2,
                  pr: 2
                }}
              >
                {carouselMatches.map((match) => (
                  <Box
                    key={match.id}
                    sx={{
                      width: {
                        xs: 260,
                        sm: 290,
                        md: 320
                      },
                      flexShrink: 0,
                      scrollSnapAlign: "start"
                    }}
                  >
                    <MatchCard
                      match={match}
                      compact
                    />
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
