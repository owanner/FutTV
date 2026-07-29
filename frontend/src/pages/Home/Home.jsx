import { useState, useMemo } from "react";

import { Box, Chip, Stack, Typography, Button, Skeleton } from "@mui/material";
import { ArrowForward } from "@mui/icons-material";

import { useAllMatches } from "../../hooks/useAllMatches";
import { getAllCompetitions } from "../../config/competitions";
import { useCompetitionsStatus } from "../../hooks/useCompetitionsStatus";

import MatchCard from "../../components/MatchCard/MatchCard";
import SectionHeader from "../../components/SectionHeader/SectionHeader";
import { useNav } from "../../hooks/useNav";
import dayjs from "dayjs";

const ALL_ID = "__all__";
const HOME_HORIZON_DAYS = 30;

/* ─── Skeleton loaders ─── */

function HeroSkeleton() {
  return (
    <Skeleton variant="rounded" height={220} sx={{ borderRadius: 3, mb: 3 }} />
  );
}

function RowSkeleton() {
  return (
    <Stack direction="row" gap={1.5} sx={{ overflow: "hidden" }}>
      {[1, 2, 3].map((n) => (
        <Skeleton key={n} variant="rounded" width={280} height={200} sx={{ borderRadius: 2, flexShrink: 0 }} />
      ))}
    </Stack>
  );
}

function GridSkeleton() {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" }, gap: 1.5 }}>
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <Skeleton key={n} variant="rounded" height={180} sx={{ borderRadius: 2 }} />
      ))}
    </Box>
  );
}

/* ─── Main page ─── */

export default function Home() {
  const navigate = useNav();
  const allCompetitions = getAllCompetitions();
  const { data: statusMap } = useCompetitionsStatus();
  const [filterComp, setFilterComp] = useState(ALL_ID);

  const visibleCompetitions = useMemo(() =>
    allCompetitions.filter((c) => {
      const st = statusMap?.[c.id];
      if (!st) return true;
      if (st.hasLive) return true;
      if (st.hasUpcoming && st.nextMatchDate) {
        return dayjs(st.nextMatchDate).isBefore(dayjs().add(HOME_HORIZON_DAYS, "day"));
      }
      return false;
    }),
  [allCompetitions, statusMap]);

  const activeCompId = filterComp === ALL_ID ? undefined : filterComp;

  const { data, isLoading, isError } = useAllMatches({
    competitionId: activeCompId,
    liveRefetch: true // Always enable for home page to keep live scores fresh
  });

  const live = data?.live || [];
  const upcoming = data?.upcoming || [];
  const recent = data?.recent || [];
  const hasNoMoreRounds = data?.hasNoMoreRounds || false;

  const featuredUpcoming = live.length === 0 ? upcoming[0] : null;

  // Use competition-specific colors for each match, not a single active color
  // The MatchCard will use match.competitionColors for each individual match

  return (
    <Stack spacing={3} sx={{ pt: 0.5 }}>
      {/* Filter chips */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          overflowX: "auto",
          pb: 0.5,
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none"
        }}
      >
        <Chip
          label="Todos"
          onClick={() => setFilterComp(ALL_ID)}
          variant={filterComp === ALL_ID ? "filled" : "outlined"}
          color={filterComp === ALL_ID ? "primary" : "default"}
          sx={{ fontWeight: 700, flexShrink: 0 }}
        />
        {visibleCompetitions.map((c) => (
          <Chip
            key={c.id}
            label={c.shortName || c.name}
            onClick={() => setFilterComp(c.id)}
            variant={filterComp === c.id ? "filled" : "outlined"}
            sx={{
              fontWeight: 700,
              flexShrink: 0,
              bgcolor: filterComp === c.id ? c.colors.primary : undefined,
              color: filterComp === c.id ? "#fff" : undefined,
              borderColor: filterComp === c.id ? c.colors.primary : undefined,
              "&:hover": {
                bgcolor: filterComp === c.id ? c.colors.primary : `${c.colors.primary}15`
              }
            }}
          />
        ))}
      </Box>

      {/* Loading states */}
      {isLoading && (
        <>
          <HeroSkeleton />
          <Box>
            <Skeleton variant="text" width={160} height={28} sx={{ mb: 1.5 }} />
            <RowSkeleton />
          </Box>
          <Box>
            <Skeleton variant="text" width={200} height={28} sx={{ mb: 1.5 }} />
            <GridSkeleton />
          </Box>
        </>
      )}

      {/* Error */}
      {isError && (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography color="error" sx={{ fontWeight: 700 }}>
            Erro ao carregar jogos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Tente novamente mais tarde.
          </Typography>
        </Box>
      )}

      {!isLoading && !isError && (
        <>
          {/* Empty state */}
          {live.length === 0 && upcoming.length === 0 && recent.length === 0 && (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "text.secondary" }}>
                {hasNoMoreRounds
                  ? "O evento não possui mais jogos a acontecer"
                  : "Nenhum jogo próximo encontrado"}
              </Typography>
              {!hasNoMoreRounds && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {filterComp !== ALL_ID
                    ? "Tente trocar de competição ou volte mais tarde."
                    : "Volte mais tarde para ver os jogos."}
                </Typography>
              )}
            </Box>
          )}

          {/* Hero — ALL live matches (not just first) with correct competition colors */}
          {live.length > 0 && (
            <Stack spacing={2} sx={{ mb: 1 }}>
              {live.map((m) => (
                <MatchCard key={m.id} match={m} variant="hero" colors={m.competitionColors} />
              ))}
            </Stack>
          )}

          {live.length === 0 && featuredUpcoming && (
            <MatchCard match={featuredUpcoming} variant="hero" colors={featuredUpcoming.competitionColors} />
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <SectionHeader
                  label="Próximos jogos"
                  count={upcoming.length}
                  accent="#006A67"
                />
                {filterComp !== ALL_ID && (
                  {/*<Button
                    size="small"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate(`/matches?competition=${filterComp}`)}
                    sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.8rem" }}
                  >
                    Ver todos
                  </Button>*/}
                )}
              </Stack>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                  gap: 1.5
                }}
              >
                {upcoming.map((m) => (
                  <MatchCard key={m.id} match={m} variant="grid" />
                ))}
              </Box>
            </Box>
          )}

          {/* Recent results */}
          {recent.length > 0 && (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <SectionHeader
                  label="Resultados recentes"
                  count={recent.length}
                  accent="#475569"
                />
              </Stack>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                  gap: 1.5
                }}
              >
                {recent.map((m) => (
                  <MatchCard key={m.id} match={m} variant="grid" />
                ))}
              </Box>
            </Box>
          )}

          {/* Quick competition links */}
          <Box sx={{ pt: 2 }}>
            <SectionHeader label="Competições" accent="#6366F1" />
            <Stack direction="row" spacing={1.5} sx={{ overflowX: "auto", pb: 1 }}>
              {visibleCompetitions.map((c) => (
                <Box
                  key={c.id}
                  onClick={() => navigate(`/competitions/${c.id}`)}
                  sx={{
                    cursor: "pointer",
                    minWidth: 160,
                    flex: "0 0 auto",
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    p: 2,
                    background: `linear-gradient(135deg, ${c.colors.primary}14 0%, ${c.colors.secondary || "#fff"}10 100%)`,
                    transition: "transform .15s ease",
                    "&:hover": { transform: "translateY(-2px)" }
                  }}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {c.shortName || c.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Ver jogos e classificação
                    </Typography>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
        </>
      )}
    </Stack>
  );
}
