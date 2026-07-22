import { useState } from "react";

import {
  Box,
  Chip,
  Stack,
  Typography,
  Button,
  Card,
  CardActionArea,
  Skeleton
} from "@mui/material";

import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { useAllMatches } from "../../hooks/useAllMatches";
import { getAllCompetitions } from "../../config/competitions";

import { getStatus } from "../../utils/statusUtils";
import { sortBroadcasts } from "../../utils/broadcasts";
import { abbreviateTeamName } from "../../utils/teamUtils";

import SectionHeader from "../../components/SectionHeader/SectionHeader";
import useNav from "../../hooks/useNav";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

dayjs.locale("pt-br");

const ALL_ID = "__all__";

/* ─── Tiny helpers ─── */

function CompetitionBadge({ name, colors }) {
  if (!name) return null;

  return (
    <Chip
      size="small"
      label={name}
      sx={{
        height: 22,
        fontSize: "0.68rem",
        fontWeight: 700,
        color: "#fff",
        bgcolor: colors?.primary || "#666",
        border: "1px solid rgba(255,255,255,0.25)",
        ".MuiChip-label": { px: 1 }
      }}
    />
  );
}

function TeamMini({ flag, name }) {
  return (
    <Stack alignItems="center" spacing={0.5} sx={{ width: 80, minWidth: 80 }}>
      <Box
        sx={{
          width: 52,
          height: 40,
          display: "grid",
          placeItems: "center",
          borderRadius: 1,
          backgroundColor: "#F8FAFC",
          border: "1px solid rgba(16,32,29,0.08)"
        }}
      >
        {flag ? (
          <Box component="img" src={flag} alt="" sx={{ width: 40, height: 32, objectFit: "contain" }} />
        ) : (
          <FlagOutlinedIcon sx={{ color: "text.secondary", fontSize: 22 }} />
        )}
      </Box>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 800,
          fontSize: "0.8rem",
          lineHeight: 1.1,
          textAlign: "center",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical"
        }}
      >
        {abbreviateTeamName(name)}
      </Typography>
    </Stack>
  );
}

/* ─── Featured (hero) card ─── */

function HeroCard({ match }) {
  const navigate = useNav();
  const status = getStatus(match.status);
  const showScore = match.status === 0 || match.status === 3;

  return (
    <Card
      sx={{
        width: "100%",
        mb: 3,
        borderRadius: 3,
        overflow: "hidden",
        background: match.competitionColors?.primary
          ? `linear-gradient(135deg, ${match.competitionColors.primary}18 0%, ${match.competitionColors.secondary || "#fff"}12 100%)`
          : undefined,
        border: "1px solid",
        borderColor: "divider"
      }}
    >
      <CardActionArea
        onClick={() => navigate(`/match/${match.id}`)}
        sx={{ p: { xs: 2, md: 3 } }}
      >
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <CompetitionBadge name={match.competitionName} colors={match.competitionColors} />
            <Chip
              size="small"
              label={status.label}
              sx={{ color: status.color, bgcolor: status.background, fontWeight: 700, fontSize: "0.7rem" }}
            />
          </Stack>

          <Stack direction="row" alignItems="center" justifyContent="center" spacing={3}>
            <TeamMini flag={match.homeFlag} name={match.homeTeam} />
            <Stack alignItems="center" spacing={0.5}>
              <Typography sx={{ fontSize: "1.6rem", fontWeight: 900, lineHeight: 1, letterSpacing: -1 }}>
                {showScore ? `${match.homeScore ?? 0} – ${match.awayScore ?? 0}` : "VS"}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
                {dayjs(match.date).format("DD MMM · HH:mm")}
              </Typography>
            </Stack>
            <TeamMini flag={match.awayFlag} name={match.awayTeam} />
          </Stack>

          {(match.groupName || match.stageName) && (
            <Typography variant="caption" sx={{ textAlign: "center", color: "text.secondary", fontWeight: 600 }}>
              {match.groupName || match.stageName}
            </Typography>
          )}

          {match.broadcasts?.length > 0 && (
            <Stack direction="row" spacing={0.5} justifyContent="center" flexWrap="wrap">
              {sortBroadcasts(match.broadcasts).slice(0, 3).map((b) => (
                <Chip
                  key={b.id}
                  size="small"
                  label={b.name}
                  icon={b.logo ? <Box component="img" src={b.logo} alt="" sx={{ width: 14, height: 14, ml: 0.5 }} /> : undefined}
                  sx={{ height: 22, fontSize: "0.68rem", bgcolor: "grey.100" }}
                />
              ))}
            </Stack>
          )}
        </Stack>
      </CardActionArea>
    </Card>
  );
}

/* ─── Compact match row (for lists) ─── */

function CompactMatchRow({ match }) {
  const navigate = useNav();
  const status = getStatus(match.status);
  const showScore = match.status === 0 || match.status === 3;
  const broadcasts = sortBroadcasts(match.broadcasts || []);

  return (
    <Card
      sx={{
        minWidth: 300,
        flex: "0 0 auto",
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        transition: "transform .15s ease",
        "&:hover": { transform: "translateY(-2px)" }
      }}
    >
      <CardActionArea
        onClick={() => navigate(`/match/${match.id}`)}
        sx={{ p: 1.5 }}
      >
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <CompetitionBadge name={match.competitionName} colors={match.competitionColors} />
            <Chip
              size="small"
              label={status.label}
              sx={{ height: 20, fontSize: "0.62rem", color: status.color, bgcolor: status.background, fontWeight: 700 }}
            />
          </Stack>

          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5}>
            <TeamMini flag={match.homeFlag} name={match.homeTeam} />
            <Stack alignItems="center">
              <Typography sx={{ fontSize: "1.1rem", fontWeight: 900, lineHeight: 1 }}>
                {showScore ? `${match.homeScore ?? 0} – ${match.awayScore ?? 0}` : "VS"}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.68rem" }}>
                {dayjs(match.date).format("HH:mm")}
              </Typography>
            </Stack>
            <TeamMini flag={match.awayFlag} name={match.awayTeam} />
          </Stack>

          <Stack direction="row" spacing={0.5} justifyContent="center" flexWrap="wrap">
            {broadcasts.slice(0, 2).map((b) => (
              <Chip
                key={b.id}
                size="small"
                label={b.name}
                sx={{ height: 18, fontSize: "0.6rem", bgcolor: "grey.100" }}
              />
            ))}
          </Stack>
        </Stack>
      </CardActionArea>
    </Card>
  );
}

/* ─── Horizontal scroll row ─── */

function HorizontalScroll({ children }) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        overflowX: "auto",
        pb: 1,
        scrollSnapType: "x mandatory",
        "&::-webkit-scrollbar": { display: "none" },
        scrollbarWidth: "none"
      }}
    >
      {children}
    </Box>
  );
}

/* ─── Grid for upcoming/recent ─── */

function MatchGrid({ matches }) {
  const navigate = useNav();

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
        gap: 1.5
      }}
    >
      {matches.map((m) => {
        const status = getStatus(m.status);
        const showScore = m.status === 0 || m.status === 3;
        const broadcasts = sortBroadcasts(m.broadcasts || []);

        return (
          <Card
            key={m.id}
            sx={{
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              transition: "transform .15s ease",
              "&:hover": { transform: "translateY(-2px)" }
            }}
          >
            <CardActionArea onClick={() => navigate(`/match/${m.id}`)} sx={{ p: 1.5 }}>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <CompetitionBadge name={m.competitionName} colors={m.competitionColors} />
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.68rem" }}>
                      {dayjs(m.date).format("DD/MM · HH:mm")}
                    </Typography>
                    <Chip
                      size="small"
                      label={status.label}
                      sx={{ height: 20, fontSize: "0.62rem", color: status.color, bgcolor: status.background, fontWeight: 700 }}
                    />
                  </Stack>
                </Stack>

                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5}>
                  <TeamMini flag={m.homeFlag} name={m.homeTeam} />
                  <Stack alignItems="center">
                    <Typography sx={{ fontSize: "1.1rem", fontWeight: 900, lineHeight: 1 }}>
                      {showScore ? `${m.homeScore ?? 0} – ${m.awayScore ?? 0}` : "VS"}
                    </Typography>
                  </Stack>
                  <TeamMini flag={m.awayFlag} name={m.awayTeam} />
                </Stack>

                {broadcasts.length > 0 && (
                  <Stack direction="row" spacing={0.5} justifyContent="center" flexWrap="wrap">
                    {broadcasts.slice(0, 2).map((b) => (
                      <Chip
                        key={b.id}
                        size="small"
                        label={b.name}
                        sx={{ height: 18, fontSize: "0.6rem", bgcolor: "grey.100" }}
                      />
                    ))}
                  </Stack>
                )}
              </Stack>
            </CardActionArea>
          </Card>
        );
      })}
    </Box>
  );
}

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
        <Skeleton key={n} variant="rounded" width={300} height={200} sx={{ borderRadius: 2, flexShrink: 0 }} />
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
  const [filterComp, setFilterComp] = useState(ALL_ID);

  const activeCompId = filterComp === ALL_ID ? undefined : filterComp;
  const { data, isLoading, isError } = useAllMatches({ competitionId: activeCompId });

  const live = data?.live || [];
  const upcoming = data?.upcoming || [];
  const recent = data?.recent || [];

  const featured = live[0] || upcoming[0] || null;

  const liveNoHero = featured ? live.filter((m) => m.id !== featured.id) : live;

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
        {allCompetitions.map((c) => (
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
                Nenhum jogo encontrado
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {filterComp !== ALL_ID
                  ? "Tente trocar de competição ou volte mais tarde."
                  : "Volte mais tarde para ver os jogos."}
              </Typography>
            </Box>
          )}

          {/* Hero — live or next upcoming */}
          {featured && (
            <HeroCard match={featured} />
          )}

          {/* Live section */}
          {liveNoHero.length > 0 && (
            <Box>
              <SectionHeader
                label="Ao vivo"
                count={liveNoHero.length}
                accent="#DC2626"
              />
              <HorizontalScroll>
                {liveNoHero.map((m) => (
                  <CompactMatchRow key={m.id} match={m} />
                ))}
              </HorizontalScroll>
            </Box>
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
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate(`/matches?competition=${filterComp}`)}
                    sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.8rem" }}
                  >
                    Ver todos
                  </Button>
                )}
              </Stack>
              <MatchGrid matches={upcoming} />
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
              <MatchGrid matches={recent} />
            </Box>
          )}

          {/* Quick competition links */}
          <Box sx={{ pt: 2 }}>
            <SectionHeader label="Competições" accent="#6366F1" />
            <Stack direction="row" spacing={1.5} sx={{ overflowX: "auto", pb: 1 }}>
              {allCompetitions.map((c) => (
                <Card
                  key={c.id}
                  sx={{
                    minWidth: 160,
                    flex: "0 0 auto",
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    background: `linear-gradient(135deg, ${c.colors.primary}14 0%, ${c.colors.secondary || "#fff"}10 100%)`
                  }}
                >
                  <CardActionArea
                    onClick={() => navigate(`/competitions/${c.id}`)}
                    sx={{ p: 2 }}
                  >
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        {c.shortName || c.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ver jogos e classificação
                      </Typography>
                    </Stack>
                  </CardActionArea>
                </Card>
              ))}
            </Stack>
          </Box>
        </>
      )}
    </Stack>
  );
}
