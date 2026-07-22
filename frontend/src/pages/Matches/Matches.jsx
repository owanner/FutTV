import { Box, Stack } from "@mui/material";
import { useMemo, useState } from "react";

import { useMatches } from "../../hooks/useMatches";
import { useCompetition } from "../../contexts/CompetitionContext";
import MatchCard from "../../components/MatchCard/MatchCard";
import MatchesFilters from "../../components/MatchesFilters/MatchesFilters";
import PageHeader from "../../components/PageHeader/PageHeader";
import SectionHeader from "../../components/SectionHeader/SectionHeader";
import { normalizeText } from "../../utils/formatUtils";
import { PageLoader, PageError } from "../../components/PageLoader/PageLoader";

function groupByStatus(matches) {
  const live = [];
  const upcoming = [];
  const finished = [];

  for (const m of matches) {
    if (m.status === 3) live.push(m);
    else if (m.status === 0) finished.push(m);
    else upcoming.push(m);
  }

  return { live, upcoming, finished };
}

export default function Matches() {
  const { data, isLoading, error } = useMatches();
  const { competition } = useCompetition();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const filteredMatches = useMemo(() => {
    if (!data) return [];

    return data.filter(match => {
      const needle = normalizeText(search);
      const matchesSearch =
        normalizeText(match.homeTeam).includes(needle) ||
        normalizeText(match.awayTeam).includes(needle);

      let matchesStatus = true;
      if (status === "live") matchesStatus = match.status === 3;
      if (status === "upcoming") matchesStatus = match.status === 1;
      if (status === "finished") matchesStatus = match.status === 0;

      return matchesSearch && matchesStatus;
    });
  }, [data, search, status]);

  if (isLoading) return <PageLoader />;
  if (error) return <PageError message="Erro ao carregar partidas" />;

  const { live, upcoming, finished } = groupByStatus(filteredMatches);

  const compColors = competition?.colors;

  return (
    <>
      <PageHeader
        title="Jogos"
        colors={compColors}
        filters={
          <MatchesFilters
            search={search}
            setSearch={setSearch}
            status={status}
            setStatus={setStatus}
          />
        }
      />

      <Stack spacing={3}>
        {live.length > 0 && (
          <Box>
            <SectionHeader label="Ao vivo" count={live.length} accent="#DC2626" />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" },
                gap: 1.5
              }}
            >
              {live.map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </Box>
          </Box>
        )}

        {upcoming.length > 0 && (
          <Box>
            <SectionHeader label="Próximos" count={upcoming.length} accent="#006A67" />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" },
                gap: 1.5
              }}
            >
              {upcoming.map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </Box>
          </Box>
        )}

        {finished.length > 0 && (
          <Box>
            <SectionHeader label="Encerrados" count={finished.length} accent="#475569" />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" },
                gap: 1.5
              }}
            >
              {finished.map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </Box>
          </Box>
        )}

        {live.length === 0 && upcoming.length === 0 && finished.length === 0 && (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <PageError message="Nenhum jogo encontrado" />
          </Box>
        )}
      </Stack>
    </>
  );
}
