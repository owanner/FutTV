import { useState, useMemo, useCallback } from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Skeleton,
  Stack,
  TextField,
  Typography,
  Tooltip,
  Collapse,
} from "@mui/material";
import {
  Search,
  Close,
  ExpandMore,
  CalendarToday,
  Groups,
  LiveTv,
} from "@mui/icons-material";
import { useClubs, useClub } from "../../hooks/useClubs";
import {
  filterClubs,
  filterMatches,
  groupMatchesByCompetition,
  groupMatchesByDate,
} from "../../utils/clubsUtils";
import { STATUS_FILTERS } from "../../utils/statusUtils";
import { normalizeTeamName } from "../../utils/teamUtils";
import MatchCard from "../../components/MatchCard/MatchCard";
import SectionHeader from "../../components/SectionHeader/SectionHeader";
import PageHeader from "../../components/PageHeader/PageHeader";
import { PageError } from "../../components/PageLoader/PageLoader";

/* ─── ClubCard ──────────────────────────────────────────────────────── */
function ClubCard({ club, expanded, onToggleExpand, upcomingCount, liveCount }) {

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
        transition: "transform .2s ease, box-shadow .2s ease, border-color .2s ease",
        backgroundColor: "background.paper",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
          borderColor: "primary.200",
        },
      }}
    >
      <CardActionArea onClick={onToggleExpand} sx={{ p: 0, display: "flex", flexDirection: "column", alignItems: "stretch" }}>
        <CardContent sx={{ p: 2, display: "flex", flexDirection: "row", alignItems: { xs: "flex-start", sm: "center" }, gap: 2 }}>
          <Tooltip title={normalizeTeamName(club.teamName)}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background: "linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)",
                border: "1px solid",
                borderColor: "divider",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {club.badge ? (
                <Box
                  component="img"
                  src={club.badge}
                  alt={club.teamName}
                  sx={{
                    width: 40,
                    height: 40,
                    objectFit: "contain",
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                  }}
                />
              ) : (
                <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main" }}>
                  {club.teamName?.charAt(0)}
                </Typography>
              )}
            </Box>
          </Tooltip>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                lineHeight: 1.2,
                color: "text.primary",
              }}
            >
              {normalizeTeamName(club.teamName)}
            </Typography>

            <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", gap: 0.75, mt: 1 }}>
              {(club.competitions || []).slice(0, 4).map((comp) => {
                const cc = comp.colors || {};
                return (
                  <Chip
                    key={comp.id}
                    size="small"
                    label={comp.shortName || comp.name}
                    sx={{
                      height: 20,
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      borderRadius: 1,
                      bgcolor: `${cc.primary || "#666"}15`,
                      color: cc.primary || "#666",
                      borderColor: `${cc.primary || "#666"}30`,
                    }}
                  />
                );
              })}
              {(club.competitions || []).length > 4 && (
                <Chip
                  size="small"
                  label={`+${club.competitions.length - 4}`}
                  sx={{
                    height: 20,
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    borderRadius: 1,
                    bgcolor: "grey.100",
                    color: "text.secondary",
                  }}
                />
              )}
            </Stack>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
            {(liveCount || 0) > 0 && (
              <Tooltip title={`${liveCount} jogo${liveCount > 1 ? "s" : ""} ao vivo`}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1.5,
                    backgroundColor: "#DC2626",
                    color: "#fff",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    fontFamily: "inherit",
                  }}
                >
                  <LiveTv sx={{ fontSize: 14 }} />
                  <span>{liveCount}</span>
                </Box>
              </Tooltip>
            )}
            {(upcomingCount || 0) > 0 && (
              <Tooltip title={`${upcomingCount} jogo${upcomingCount > 1 ? "s" : ""} futuro${upcomingCount > 1 ? "s" : ""}`}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1.5,
                    backgroundColor: "#006A67",
                    color: "#fff",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    fontFamily: "inherit",
                  }}
                >
                  <CalendarToday sx={{ fontSize: 14 }} />
                  <span>{upcomingCount}</span>
                </Box>
              </Tooltip>
            )}
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              size="small"
              aria-label={expanded ? "Recolher" : "Expandir"}
              sx={{
                color: "text.secondary",
                transition: "transform .2s ease",
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <ExpandMore />
            </IconButton>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function ClubSkeleton() {
  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", width: "100%" }}>
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Skeleton variant="circular" width={56} height={56} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="40%" height={16} sx={{ mt: 1 }} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function SearchField({ value, onChange, onClear, placeholder }) {
  return (
    <TextField
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      size="small"
      fullWidth
      variant="outlined"
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" sx={{ color: "text.secondary" }} />
            </InputAdornment>
          ),
          endAdornment: value ? (
            <InputAdornment position="end">
              <Close
                fontSize="small"
                onClick={onClear}
                sx={{ cursor: "pointer", color: "text.secondary" }}
              />
            </InputAdornment>
          ) : undefined,
        },
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: 2,
          bgcolor: "background.paper",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "primary.300",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderWidth: 2,
            borderColor: "primary.main",
          },
        },
        "& .MuiInputBase-input": {
          py: 1.5,
        },
      }}
    />
  );
}

/* ─── ClubMatchesGrid: displays matches for expanded club ──────────── */
function ClubMatchesGrid({ matches, isLoading }) {
  const [viewMode, setViewMode] = useState("competitions");
  const [matchSearch, setMatchSearch] = useState("");
  const [matchStatus, setMatchStatus] = useState("");

  const filtered = useMemo(() => {
    return filterMatches(matches, { search: matchSearch, status: matchStatus });
  }, [matches, matchSearch, matchStatus]);

  const grouped = useMemo(() => {
    return viewMode === "competitions" ? groupMatchesByCompetition(filtered) : groupMatchesByDate(filtered);
  }, [filtered, viewMode]);

  const { live, upcoming, finished } = useMemo(() => {
    const l = filtered.filter((m) => m.status === 3);
    const u = filtered.filter((m) => m.status === 1);
    const f = filtered.filter((m) => m.status === 0);
    return { live: l, upcoming: u, finished: f };
  }, [filtered]);

  if (isLoading) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress size={28} color="primary" />
      </Box>
    );
  }

  if (matches.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Typography variant="body1" color="text.secondary">
          Sem partidas registradas para este clube.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", mb: 0.5 }}>
            Partidas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filtered.length} de {matches.length} partidas
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton
            onClick={() => setViewMode("competitions")}
            size="small"
            sx={{
              bgcolor: viewMode === "competitions" ? "primary.main" : "transparent",
              color: viewMode === "competitions" ? "#fff" : "text.secondary",
              border: viewMode === "competitions" ? "none" : "1px solid",
              borderColor: "divider",
            }}
          >
            <Groups fontSize="small" />
          </IconButton>
          <IconButton
            onClick={() => setViewMode("date")}
            size="small"
            sx={{
              bgcolor: viewMode === "date" ? "primary.main" : "transparent",
              color: viewMode === "date" ? "#fff" : "text.secondary",
              border: viewMode === "date" ? "none" : "1px solid",
              borderColor: "divider",
            }}
          >
            <CalendarToday fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="stretch">
        {/*<Box sx={{ flex: 1, maxWidth: 480 }}>
          <SearchField
            value={matchSearch}
            onChange={(e) => setMatchSearch(e.target.value)}
            onClear={() => setMatchSearch("")}
            placeholder="Buscar partidas..."
          />
        </Box>*/}
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            flexWrap: { xs: "nowrap", sm: "wrap" },
            overflowX: { xs: "auto", sm: "visible" },
            pb: { xs: 0.5, sm: 0 },
            alignItems: "center",
          }}
        >
          {STATUS_FILTERS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              size="small"
              onClick={() => setMatchStatus(opt.value === matchStatus ? "" : opt.value)}
              variant={matchStatus === opt.value ? "filled" : "outlined"}
              sx={{
                fontWeight: 700,
                fontSize: { xs: "0.7rem", sm: "0.8125rem" },
                height: { xs: 28, sm: 32 },
                flexShrink: 0,
                ...(matchStatus === opt.value && opt.accent
                  ? { bgcolor: opt.accent, color: "#fff", borderColor: opt.accent }
                  : matchStatus === opt.value
                    ? { bgcolor: "primary.main", color: "#fff" }
                    : {}),
                "&:hover": opt.accent ? { bgcolor: `${opt.accent}20` } : {},
              }}
            />
          ))}
        </Stack>
      </Stack>

      {live.length > 0 && (
        <Box>
          <SectionHeader label="Ao vivo" count={live.length} accent="#DC2626" />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" }, gap: 1.5 }}>
            {live.map((m) => (
              <MatchCard key={m.id} match={m} variant="grid" />
            ))}
          </Box>
        </Box>
      )}

      {upcoming.length > 0 && (
        <Box>
          <SectionHeader label="Próximos" count={upcoming.length} accent="#006A67" />
          {viewMode === "date" &&
            Object.values(grouped).map((group, idx) => {
              const dateMatches = group.matches?.filter((m) => m.status === 1) || [];
              if (dateMatches.length === 0) return null;
              return (
                <Box key={idx} sx={{ mb: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <CalendarToday sx={{ fontSize: 16, color: "primary.main" }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary" }}>
                      {group.formatted}
                    </Typography>
                  </Stack>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" }, gap: 1.5 }}>
                    {dateMatches.map((m) => (
                      <MatchCard key={m.id} match={m} variant="grid" />
                    ))}
                  </Box>
                </Box>
              );
            })}
          {viewMode === "competitions" &&
            Object.values(grouped).map((group) => {
              const compMatches = group.matches?.filter((m) => m.status === 1) || [];
              if (compMatches.length === 0) return null;
              const cc = group.colors || {};
              return (
                <Box key={group.id} sx={{ mb: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: cc.primary || "#666",
                        boxShadow: `0 0 0 2px ${(cc.primary || "#666")}30`,
                      }}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary" }}>
                      {group.name}
                    </Typography>
                    <Chip
                      size="small"
                      label={`${compMatches.length} jogo${compMatches.length > 1 ? "s" : ""}`}
                      sx={{
                        height: 20,
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        bgcolor: `${cc.primary || "#666"}15`,
                        color: cc.primary || "#666",
                      }}
                    />
                  </Stack>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" }, gap: 1.5 }}>
                    {compMatches.map((m) => (
                      <MatchCard key={m.id} match={m} variant="grid" />
                    ))}
                  </Box>
                </Box>
              );
            })}
        </Box>
      )}

      {finished.length > 0 && (
        <Box>
          <SectionHeader label="Encerrados" count={finished.length} accent="#475569" />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" }, gap: 1.5 }}>
            {finished.map((m) => (
              <MatchCard key={m.id} match={m} variant="grid" />
            ))}
          </Box>
        </Box>
      )}

      {filtered.length === 0 && (matchSearch || matchStatus) && (
        <Box sx={{ py: 4, textAlign: "center" }}>
          <Search sx={{ fontSize: 40, color: "grey.400", mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", mb: 1 }}>
            Nenhuma partida encontrada
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tente buscar com outro termo.
          </Typography>
        </Box>
      )}
    </Stack>
  );
}

/* ─── Main Clubs page ─────────────────────────────────────────────── */
export default function Clubs() {
  const [search, setSearch] = useState("");
  const [expandedClub, setExpandedClub] = useState(null);

  const { data, isLoading, error } = useClubs();
  const clubs = useMemo(() => data?.clubs || [], [data]);

  const { data: clubDetail, isLoading: isLoadingMatches, error: clubError } = useClub(expandedClub);

  const filteredClubs = useMemo(() => {
    return filterClubs(clubs, search);
  }, [clubs, search]);

  const handleClubClick = useCallback((clubCode) => {
    setExpandedClub((prev) => (prev === clubCode ? null : clubCode));
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value);
    setExpandedClub(null);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearch("");
    setExpandedClub(null);
  }, []);

  if (isLoading) {
    return (
      <Stack spacing={3} sx={{ py: 3 }}>
        <PageHeader title="Clubes" />
        <Stack spacing={2}>
          {[...Array(8)].map((_, i) => (
            <ClubSkeleton key={i} />
          ))}
        </Stack>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack spacing={3} sx={{ py: 3 }}>
        <PageHeader title="Clubes" />
        <PageError message="Erro ao carregar clubes" />
      </Stack>
    );
  }

  return (
    <Stack spacing={0} sx={{ pb: 12 }}>
      <Box sx={{ mb: 2 }}>
        <PageHeader
          title="Clubes"
          filters={
            <SearchField
              value={search}
              onChange={handleSearchChange}
              onClear={handleClearSearch}
              placeholder="Buscar clube por nome..."
            />
          }
        >
          <Typography variant="body2" color="text.secondary" sx={{ mt: -1 }}>
            {filteredClubs.length === clubs.length
              ? `${clubs.length} clubes com jogos futuros ou ao vivo`
              : `${filteredClubs.length} de ${clubs.length} clubes encontrados`}
          </Typography>
        </PageHeader>
      </Box>

      {filteredClubs.length === 0 ? (
        <Box sx={{ py: 12, textAlign: "center", px: 2 }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 96,
              height: 96,
              borderRadius: "50%",
              bgcolor: "grey.100",
              mb: 3,
            }}
          >
            <Search sx={{ fontSize: 40, color: "grey.400" }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "text.primary", mb: 1 }}>
            {search ? "Nenhum clube encontrado" : "Nenhum clube com jogos futuros ou ao vivo"}
          </Typography>
          {search ? (
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 320, mx: "auto" }}>
              Tente buscar com outro termo ou limpe a pesquisa.
            </Typography>
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 320, mx: "auto" }}>
              No momento, nenhum clube possui partidas agendadas ou ao vivo.
            </Typography>
          )}
        </Box>
      ) : (
        <Stack spacing={1}>
          {filteredClubs.map((club) => (
            <Box key={club.key || club.teamCode || club.teamId}>
              <ClubCard
                club={club}
                expanded={expandedClub === (club.key || club.teamCode || club.teamId)}
                onToggleExpand={() => handleClubClick(club.key || club.teamCode || club.teamId)}
                upcomingCount={club.upcomingCount || 0}
                liveCount={club.liveCount || 0}
              />
              
              {/* Expanded matches grid - appears below the card */}
              <Collapse in={expandedClub === (club.key || club.teamCode || club.teamId)}>
                {expandedClub === (club.key || club.teamCode || club.teamId) && clubError && (
                  <Box sx={{ mt: 1, pl: 2, pr: 2, pb: 2 }}>
                    <PageError message="Erro ao carregar partidas do clube. Tente novamente." />
                  </Box>
                )}
                {expandedClub === (club.key || club.teamCode || club.teamId) && clubDetail && !clubError && (
                  <Box sx={{ mt: 1, pl: 2, pr: 2, pb: 2 }}>
                    <ClubMatchesGrid
                      matches={[...(clubDetail.nextMatches || []), ...(clubDetail.liveMatches || []), ...(clubDetail.finishedMatches || [])]}
                      isLoading={isLoadingMatches}
                    />
                  </Box>
                )}
              </Collapse>
            </Box>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
