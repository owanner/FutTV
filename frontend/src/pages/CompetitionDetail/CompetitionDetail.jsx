import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Chip,
  Stack,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Avatar,
  Divider,
  Tabs,
  Tab
} from "@mui/material";

import { getCompetition, getAllCompetitions } from "../../config/competitions";
import { useMatches } from "../../hooks/useMatches";
import { useStandings } from "../../hooks/useStandings";
import { getStatus } from "../../utils/statusUtils";
import { sortBroadcasts } from "../../utils/broadcasts";
import { abbreviateTeamName } from "../../utils/teamUtils";
import { normalizeText } from "../../utils/formatUtils";
import {
  getPositionColor,
  STAT_COLUMNS,
  BRASILEIRAO_ZONES
} from "../../utils/standingsUtils";
import GroupStandings from "../../components/GroupStandings/GroupStandings";
import SectionHeader from "../../components/SectionHeader/SectionHeader";
import PageHeader from "../../components/PageHeader/PageHeader";
import { PageLoader, PageError } from "../../components/PageLoader/PageLoader";

import useNav from "../../hooks/useNav";
import dayjs from "dayjs";

/* ─── Card style constant ─── */
const CARD_SX = {
  borderRadius: 2,
  border: "1px solid",
  borderColor: "divider",
  transition: "box-shadow .15s ease",
  "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }
};

/* ─── Compact match card ─── */

function MatchRow({ match }) {
  const navigate = useNav();
  const status = getStatus(match.status);
  const showScore = match.status === 0 || match.status === 3;
  const broadcasts = sortBroadcasts(match.broadcasts || []);

  return (
    <Card sx={CARD_SX}>
      <CardActionArea onClick={() => navigate(`/match/${match.id}`)} sx={{ p: 1.5 }}>
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700 }}>
              {dayjs(match.date).format("DD/MM · HH:mm")}
            </Typography>
            <Chip
              size="small"
              label={status.label}
              sx={{ height: 20, fontSize: "0.62rem", color: status.color, bgcolor: status.background, fontWeight: 700 }}
            />
          </Stack>

          <Stack direction="row" alignItems="center" justifyContent="center" spacing={2}>
            <TeamMini flag={match.homeFlag} name={match.homeTeam} />
            <Stack alignItems="center">
              <Typography sx={{ fontSize: "1.15rem", fontWeight: 900, lineHeight: 1 }}>
                {showScore ? `${match.homeScore ?? 0} – ${match.awayScore ?? 0}` : "VS"}
              </Typography>
            </Stack>
            <TeamMini flag={match.awayFlag} name={match.awayTeam} />
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
}

function TeamMini({ flag, name }) {
  return (
    <Stack alignItems="center" spacing={0.5} sx={{ width: 80, minWidth: 80 }}>
      <Box
        sx={{
          width: 48,
          height: 36,
          display: "grid",
          placeItems: "center",
          borderRadius: 1,
          backgroundColor: "#F8FAFC",
          border: "1px solid rgba(16,32,29,0.08)"
        }}
      >
        {flag ? (
          <Box component="img" src={flag} alt="" sx={{ width: 38, height: 30, objectFit: "contain" }} />
        ) : (
          <Typography variant="caption" color="text.secondary">?</Typography>
        )}
      </Box>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 800,
          fontSize: "0.78rem",
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

/* ─── Matches tab ─── */

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "live", label: "Ao vivo", accent: "#DC2626" },
  { value: "upcoming", label: "Próximos", accent: "#006A67" },
  { value: "finished", label: "Encerrados", accent: "#475569" }
];

function MatchesTab({ competitionId }) {
  const { data, isLoading, error } = useMatches(competitionId);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((m) => {
      const needle = normalizeText(search);
      const matchSearch =
        normalizeText(m.homeTeam).includes(needle) ||
        normalizeText(m.awayTeam).includes(needle);
      let matchStatus = true;
      if (status === "live") matchStatus = m.status === 3;
      if (status === "upcoming") matchStatus = m.status === 1;
      if (status === "finished") matchStatus = m.status === 0;
      return matchSearch && matchStatus;
    });
  }, [data, search, status]);

  if (isLoading) return <PageLoader />;
  if (error) return <PageError message="Erro ao carregar jogos" />;

  const live = filtered.filter((m) => m.status === 3);
  const upcoming = filtered.filter((m) => m.status === 1);
  const finished = filtered.filter((m) => m.status === 0);

  return (
    <Stack spacing={2}>
      {/* Search + filter chips */}
      <Stack spacing={1.5}>
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
          {STATUS_FILTERS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              onClick={() => setStatus(opt.value)}
              variant={status === opt.value ? "filled" : "outlined"}
              sx={{
                fontWeight: 700,
                flexShrink: 0,
                ...(status === opt.value && opt.accent
                  ? { bgcolor: opt.accent, color: "#fff", borderColor: opt.accent }
                  : status === opt.value
                    ? { bgcolor: "primary.main", color: "#fff" }
                    : {}
                ),
                "&:hover": opt.accent ? { bgcolor: `${opt.accent}20` } : {}
              }}
            />
          ))}
        </Box>
      </Stack>

      {/* Live */}
      {live.length > 0 && (
        <Box>
          <SectionHeader label="Ao vivo" count={live.length} accent="#DC2626" />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" }, gap: 1.5 }}>
            {live.map((m) => <MatchRow key={m.id} match={m} />)}
          </Box>
        </Box>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <Box>
          <SectionHeader label="Próximos" count={upcoming.length} accent="#006A67" />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" }, gap: 1.5 }}>
            {upcoming.map((m) => <MatchRow key={m.id} match={m} />)}
          </Box>
        </Box>
      )}

      {/* Finished */}
      {finished.length > 0 && (
        <Box>
          <SectionHeader label="Encerrados" count={finished.length} accent="#475569" />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" }, gap: 1.5 }}>
            {finished.map((m) => <MatchRow key={m.id} match={m} />)}
          </Box>
        </Box>
      )}

      {live.length === 0 && upcoming.length === 0 && finished.length === 0 && (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
            Nenhum jogo encontrado
          </Typography>
        </Box>
      )}
    </Stack>
  );
}

/* ─── Standings tab ─── */

function StandingsTab({ competitionId, competition }) {
  const { data, isLoading, error } = useStandings(competitionId);
  const isLibertadores = competitionId === "libertadores2026";
  const isBrasileirao = competitionId === "brasileirao2026";
  const comp = getCompetition(competitionId);
  const teamLabel = comp?.teamLabel || "Time";
  const [view, setView] = useState(isLibertadores ? "groups" : "flat");

  if (isLoading) return <PageLoader />;
  if (error) return <PageError message="Erro ao carregar classificação" />;

  if (!data || data.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
          Classificação indisponível
        </Typography>
      </Box>
    );
  }

  /* Legend chips */
  const legendChips = isBrasileirao ? (
    BRASILEIRAO_ZONES.map((zone) => (
      <Chip
        key={zone.label}
        label={zone.label}
        sx={{
          bgcolor: zone.color,
          color: zone.color === "#193375" || zone.color === "#e53935" ? "white" : "black",
          fontSize: { xs: "0.70rem", sm: "0.80rem" }
        }}
      />
    ))
  ) : isLibertadores ? (
    <>
      <Chip color="success" label="Classificado" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }} />
      <Chip color="warning" label="Sulamericana" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }} />
      <Chip color="error" label="Eliminado" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }} />
    </>
  ) : (
    <>
      <Chip color="success" label="Classificado" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }} />
      <Chip color="warning" label="Melhor 3º" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }} />
      <Chip color="error" label="Eliminado" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }} />
    </>
  );

  /* Group data */
  const groups = {};
  data.forEach((team) => {
    if (!groups[team.groupName]) groups[team.groupName] = [];
    groups[team.groupName].push(team);
  });

  /* Libertadores view toggle chips */
  if (isLibertadores) {
    const sortedTeams = [...data].sort((a, b) => b.points - a.points);

    return (
      <Stack spacing={2}>
        <Card sx={CARD_SX}>
          <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", justifyContent: "center" }}>
              {legendChips}
            </Stack>
          </CardContent>
        </Card>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Chip
            label="Fase de Grupos"
            onClick={() => setView("groups")}
            variant={view === "groups" ? "filled" : "outlined"}
            sx={{
              fontWeight: 700,
              ...(view === "groups"
                ? { bgcolor: "primary.main", color: "#fff" }
                : {}
              )
            }}
          />
          <Chip
            label="Classificação"
            onClick={() => setView("flat")}
            variant={view === "flat" ? "filled" : "outlined"}
            sx={{
              fontWeight: 700,
              ...(view === "flat"
                ? { bgcolor: "primary.main", color: "#fff" }
                : {}
              )
            }}
          />
        </Box>

        {view === "groups" && (
          <Stack spacing={2}>
            {Object.entries(groups).map(([groupName, teams]) => (
              <GroupStandings key={groupName} groupName={groupName} teams={teams} />
            ))}
          </Stack>
        )}

        {view === "flat" && (
          <FlatStandings teams={sortedTeams} teamLabel={teamLabel} competitionId={competitionId} />
        )}
      </Stack>
    );
  }

  /* Default: Brasileirão or WC — just show groups */
  return (
    <Stack spacing={2}>
      <Card sx={CARD_SX}>
        <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", justifyContent: "center" }}>
            {legendChips}
          </Stack>
        </CardContent>
      </Card>

      {Object.entries(groups).map(([groupName, teams]) => (
        <GroupStandings key={groupName} groupName={groupName} teams={teams} />
      ))}
    </Stack>
  );
}

/* ─── Flat standings table ─── */

function FlatStandings({ teams, teamLabel, competitionId }) {
  return (
    <Card sx={CARD_SX}>
      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
        <Stack direction="row" alignItems="center" sx={{ mb: 1, px: 2, pt: 2, width: "100%" }}>
          <Box sx={{ flex: 1, minWidth: 180, pr: 1, borderRight: "2px solid", borderColor: "rgba(0,0,0,0.08)" }}>
            <Typography sx={{ fontSize: "0.90rem", fontWeight: 700, color: "primary.main" }} variant="caption">
              {teamLabel}
            </Typography>
          </Box>
          {STAT_COLUMNS.map((col) => (
            <Box key={col.key} sx={{ width: 48, display: "flex", justifyContent: "center" }}>
              <Typography variant="caption" fontWeight={700}>{col.label}</Typography>
            </Box>
          ))}
        </Stack>
        <Divider sx={{ mx: 2 }} />
        {teams.map((team) => (
          <Stack key={team.teamId} direction="row" sx={{ width: "100%", py: 1, px: 2, borderLeft: `4px solid ${getPositionColor(team.position, competitionId)}` }}>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flex: 1, minWidth: 180, ml: 1, pr: 1, borderRight: "2px solid", borderColor: "rgba(0,0,0,0.08)" }}>
              <Typography variant="body2" sx={{ fontSize: "0.75rem", fontWeight: 700, color: "text.secondary", minWidth: 18 }}>
                {team.position}
              </Typography>
              <Avatar src={team.flag} alt={team.teamName} sx={{ width: 20, height: 20, flexShrink: 0 }} />
              <Typography variant="body2" sx={{ fontSize: "0.85rem", fontWeight: 500 }}>
                {team.teamName}
              </Typography>
            </Stack>
            {STAT_COLUMNS.map((col) => (
              <Box key={col.key} sx={{ width: 48, display: "flex", justifyContent: "center" }}>
                <Typography textAlign="center" fontWeight={col.bold ? 700 : col.key === "goalDifference" ? 600 : 400}>
                  {col.format ? col.format(team[col.key]) : team[col.key]}
                </Typography>
              </Box>
            ))}
          </Stack>
        ))}
      </CardContent>
    </Card>
  );
}

/* ─── Main page ─── */

export default function CompetitionDetail() {
  const { id } = useParams();
  const competition = getCompetition(id);
  const [tab, setTab] = useState(0);

  if (!competition) {
    return (
      <Box sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
          Competição não encontrada
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {/* Header */}
      <Box
        sx={{
          height: 6,
          borderRadius: 2,
          background: `linear-gradient(90deg, ${competition.colors.primary}, ${competition.colors.secondary || competition.colors.primary})`
        }}
      />
      <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
        {competition.shortName || competition.name}
      </Typography>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="fullWidth"
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          minHeight: 40,
          "& .MuiTab-root": { minHeight: 40, py: 0, fontWeight: 700 }
        }}
      >
        <Tab label="Jogos" />
        <Tab label="Classificação" />
      </Tabs>

      {/* Tab content */}
      {tab === 0 && <MatchesTab competitionId={id} />}
      {tab === 1 && <StandingsTab competitionId={id} competition={competition} />}
    </Stack>
  );
}
