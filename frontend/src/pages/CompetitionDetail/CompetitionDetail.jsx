import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Chip,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  Tabs,
  Tab
} from "@mui/material";

import { getCompetition, getCompetitionFormat, hasGroupStage, hasKnockoutStage } from "../../config/competitions";
import { useMatches } from "../../hooks/useMatches";
import { useStandings } from "../../hooks/useStandings";
import { normalizeText } from "../../utils/formatUtils";
import { buildGroups } from "../../utils/standingsUtils";
import { normalizeTeamName } from "../../utils/teamUtils";
import MatchCard from "../../components/MatchCard/MatchCard";
import GroupStandings from "../../components/GroupStandings/GroupStandings";
import FlatStandings from "../../components/FlatStandings/FlatStandings";
import LegendChips from "../../components/LegendChips/LegendChips";
import SectionHeader from "../../components/SectionHeader/SectionHeader";
import { PageLoader, PageError } from "../../components/PageLoader/PageLoader";
import Bracket from "../Bracket/Bracket";

import useNav from "../../hooks/useNav";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";

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
    const comp = getCompetition(competitionId);
    const compMeta = {
      competitionName: comp?.shortName || comp?.name || competitionId,
      competitionColors: comp?.colors
    };
    return data.filter((m) => {
      const needle = normalizeText(search);
      const matchSearch =
        !needle ||
        normalizeText(normalizeTeamName(m.homeTeam)).includes(needle) ||
        normalizeText(normalizeTeamName(m.awayTeam)).includes(needle) ||
        normalizeText(m.homeTeam).includes(needle) ||
        normalizeText(m.awayTeam).includes(needle);
      let matchStatus = true;
      if (status === "live") matchStatus = m.status === 3;
      if (status === "upcoming") matchStatus = m.status === 1;
      if (status === "finished") matchStatus = m.status === 0;
      return matchSearch && matchStatus;
    }).map((m) => ({ ...m, ...compMeta }));
  }, [data, search, status, competitionId]);

  if (isLoading) return <PageLoader />;
  if (error) return <PageError message="Erro ao carregar jogos" />;

  const live = filtered.filter((m) => m.status === 3);
  const upcoming = filtered.filter((m) => m.status === 1);
  const finished = filtered.filter((m) => m.status === 0);

  return (
    <Stack spacing={2}>
      <Stack spacing={1.5}>
        <TextField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar time..."
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <CloseIcon
                  fontSize="small"
                  onClick={() => setSearch("")}
                  sx={{ cursor: "pointer", color: "text.secondary" }}
                />
              </InputAdornment>
            ) : undefined
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              bgcolor: "background.paper"
            }
          }}
        />
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

      {live.length > 0 && (
        <Box>
          <SectionHeader label="Ao vivo" count={live.length} accent="#DC2626" />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" }, gap: 1.5 }}>
            {live.map((m) => <MatchCard key={m.id} match={m} variant="grid" />)}
          </Box>
        </Box>
      )}

      {upcoming.length > 0 && (
        <Box>
          <SectionHeader label="Próximos" count={upcoming.length} accent="#006A67" />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" }, gap: 1.5 }}>
            {upcoming.map((m) => <MatchCard key={m.id} match={m} variant="grid" />)}
          </Box>
        </Box>
      )}

      {finished.length > 0 && (
        <Box>
          <SectionHeader label="Encerrados" count={finished.length} accent="#475569" />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" }, gap: 1.5 }}>
            {finished.map((m) => <MatchCard key={m.id} match={m} variant="grid" />)}
          </Box>
        </Box>
      )}

      {live.length === 0 && upcoming.length === 0 && finished.length === 0 && (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
            {search ? "Nenhum jogo encontrado para este time" : "Nenhum jogo encontrado"}
          </Typography>
          {search && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Limpe a busca para ver todos os jogos.
            </Typography>
          )}
        </Box>
      )}
    </Stack>
  );
}

function StandingsTab({ competitionId }) {
  const { data, isLoading, error } = useStandings(competitionId);
  const format = getCompetitionFormat(competitionId);
  const comp = getCompetition(competitionId);
  const teamLabel = comp?.teamLabel || "Time";
  const showGroupsToggle = format === "groups-then-knockout" || competitionId === "libertadores2026";
  const [view, setView] = useState("groups");

  if (isLoading) return <PageLoader />;
  if (error) return <PageError message="Erro ao carregar classificação" />;

  if (format === "knockout") {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
          Esta competição é disputada apenas em fase eliminatória.
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
          Veja a aba “Fase Eliminatória” para os confrontos.
        </Typography>
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
          Classificação indisponível
        </Typography>
      </Box>
    );
  }

  const groups = buildGroups(data);

  return (
    <Stack spacing={2}>
      <LegendChips competitionId={competitionId} />

      {showGroupsToggle && (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Chip
            label="Fase de Grupos"
            onClick={() => setView("groups")}
            variant={view === "groups" ? "filled" : "outlined"}
            sx={{ fontWeight: 700, ...(view === "groups" ? { bgcolor: "primary.main", color: "#fff" } : {}) }}
          />
          <Chip
            label="Classificação Geral"
            onClick={() => setView("flat")}
            variant={view === "flat" ? "filled" : "outlined"}
            sx={{ fontWeight: 700, ...(view === "flat" ? { bgcolor: "primary.main", color: "#fff" } : {}) }}
          />
        </Box>
      )}

      {view === "flat" ? (
        <FlatStandings
          teams={[...data].sort((a, b) => b.points - a.points)}
          teamLabel={teamLabel}
          competitionId={competitionId}
        />
      ) : (
        <Stack spacing={2}>
          {Object.entries(groups).map(([groupName, teams]) => (
            <GroupStandings key={groupName} groupName={groupName} teams={teams} competitionId={competitionId} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

export default function CompetitionDetail() {
  const { id } = useParams();
  const navigate = useNav();
  const competition = getCompetition(id);
  const showStandingsTab = hasGroupStage(id);
  const showKnockoutTab = hasKnockoutStage(id);
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

  // Tabs are assembled dynamically so that pure-knockout competitions
  // (e.g. Copa do Brasil) omit the "Classificação" tab, while league/group
  // competitions show it. The Knockouts tab appears whenever the competition
  // has a knockout stage.
  // Order: [Jogos] [Classificação (when hasGroupStage)] [Knockouts (when hasKnockoutStage)]
  const tabs = ["Jogos"];
  if (showStandingsTab) tabs.push("Classificação");
  if (showKnockoutTab) tabs.push("Fase Eliminatória");

  const standingsTabIndex = showStandingsTab ? 1 : -1;
  const bracketTabIndex = (showStandingsTab ? 2 : 1);

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box
          onClick={() => navigate("/competitions")}
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
            height: 6,
            width: 40,
            borderRadius: 2,
            background: `linear-gradient(90deg, ${competition.colors.primary}, ${competition.colors.secondary || competition.colors.primary})`
          }}
        />
        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
          {competition.shortName || competition.name}
        </Typography>
      </Stack>

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
        {tabs.map((label) => (
          <Tab key={label} label={label} />
        ))}
      </Tabs>

      {tab === 0 && <MatchesTab competitionId={id} />}
      {standingsTabIndex !== -1 && tab === standingsTabIndex && <StandingsTab key={id} competitionId={id} />}
      {showKnockoutTab && tab === bracketTabIndex && <Bracket key={id} competitionId={id} />}
    </Stack>
  );
}
