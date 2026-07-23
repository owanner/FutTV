import { useState, useEffect } from "react";
import { Stack, Chip, Box } from "@mui/material";
import { useStandings } from "../../hooks/useStandings";
import { useCompetition } from "../../contexts/CompetitionContext";
import { getCompetition, getAllCompetitions } from "../../config/competitions";
import { buildGroups } from "../../utils/standingsUtils";
import GroupStandings from "../../components/GroupStandings/GroupStandings";
import FlatStandings from "../../components/FlatStandings/FlatStandings";
import LegendChips from "../../components/LegendChips/LegendChips";
import PageHeader from "../../components/PageHeader/PageHeader";
import { PageLoader, PageError } from "../../components/PageLoader/PageLoader";

export default function Standings() {
  const { data, isLoading, error } = useStandings();
  const { competition, competitionId } = useCompetition();
  const isLibertadores = competitionId === "libertadores2026";
  const [view, setView] = useState(isLibertadores ? "groups" : "flat");
  const comp = getCompetition(competitionId);
  const teamLabel = comp?.teamLabel || "Time";
  const allCompetitions = getAllCompetitions();

  useEffect(() => {
    setView(isLibertadores ? "groups" : "flat");
  }, [isLibertadores]);

  if (isLoading) return <PageLoader />;
  if (error) return <PageError message="Erro ao carregar classificação" />;

  const groups = buildGroups(data);

  return (
    <>
      <PageHeader
        title="Classificação"
        colors={competition?.colors}
        filters={
          <Stack direction="row" spacing={1}>
            {allCompetitions.map((c) => (
              <Chip
                key={c.id}
                label={c.shortName || c.name}
                onClick={() => {
                  const url = new URL(window.location);
                  url.searchParams.set("competition", c.id);
                  window.location.search = url.search;
                }}
                variant={c.id === competitionId ? "filled" : "outlined"}
                sx={{
                  fontWeight: 700,
                  flexShrink: 0,
                  ...(c.id === competitionId
                    ? { bgcolor: c.colors.primary, color: "#fff", borderColor: c.colors.primary }
                    : {}
                  )
                }}
              />
            ))}
          </Stack>
        }
      />

      <Stack spacing={2}>
        <LegendChips competitionId={competitionId} />

        {isLibertadores && (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Chip
              label="Fase de Grupos"
              onClick={() => setView("groups")}
              variant={view === "groups" ? "filled" : "outlined"}
              sx={{ fontWeight: 700, ...(view === "groups" ? { bgcolor: "primary.main", color: "#fff" } : {}) }}
            />
            <Chip
              label="Classificação"
              onClick={() => setView("flat")}
              variant={view === "flat" ? "filled" : "outlined"}
              sx={{ fontWeight: 700, ...(view === "flat" ? { bgcolor: "primary.main", color: "#fff" } : {}) }}
            />
          </Box>
        )}

        {isLibertadores && view === "groups" && (
          <Stack spacing={2}>
            {Object.entries(groups).map(([groupName, teams]) => (
              <GroupStandings key={groupName} groupName={groupName} teams={teams} />
            ))}
          </Stack>
        )}

        {isLibertadores && view === "flat" && (
          <FlatStandings
            teams={[...data].sort((a, b) => b.points - a.points)}
            teamLabel={teamLabel}
            competitionId={competitionId}
          />
        )}

        {!isLibertadores && Object.entries(groups).map(([groupName, teams]) => (
          <GroupStandings key={groupName} groupName={groupName} teams={teams} />
        ))}
      </Stack>
    </>
  );
}
