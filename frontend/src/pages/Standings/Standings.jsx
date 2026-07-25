import { useState } from "react";
import { Stack, Chip, Box, Typography } from "@mui/material";
import { useStandings } from "../../hooks/useStandings";
import { useCompetition } from "../../contexts/CompetitionContext";
import {
  getCompetition,
  getAllCompetitions,
  getCompetitionFormat,
  hasKnockoutStage
} from "../../config/competitions";
import { buildGroups } from "../../utils/standingsUtils";
import GroupStandings from "../../components/GroupStandings/GroupStandings";
import FlatStandings from "../../components/FlatStandings/FlatStandings";
import LegendChips from "../../components/LegendChips/LegendChips";
import PageHeader from "../../components/PageHeader/PageHeader";
import { PageLoader, PageError } from "../../components/PageLoader/PageLoader";
import Bracket from "../Bracket/Bracket";

export default function Standings() {
  const { data, isLoading, error } = useStandings();
  const { competition, competitionId } = useCompetition();
  const format = getCompetitionFormat(competitionId);
  const showGroupsToggle = format === "groups-then-knockout" || competitionId === "libertadores2026";
  const showKnockoutTab = hasKnockoutStage(competitionId);
  const defaultTab = format === "knockout" ? "knockout" : "groups";
  const [tab, setTab] = useState(defaultTab);
  const [view, setView] = useState("groups");
  const comp = getCompetition(competitionId);
  const teamLabel = comp?.teamLabel || "Time";
  const allCompetitions = getAllCompetitions();

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
        {/* Tournament stage tabs: Groups / Knockout (Mata-mata) */}
        {showKnockoutTab && (
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
              label="Fase de Grupos"
              onClick={() => setTab("groups")}
              variant={tab === "groups" ? "filled" : "outlined"}
              sx={{ fontWeight: 700, ...(tab === "groups" ? { bgcolor: "primary.main", color: "#fff" } : {}) }}
            />
            <Chip
              label="Mata-Mata"
              onClick={() => setTab("knockout")}
              variant={tab === "knockout" ? "filled" : "outlined"}
              sx={{ fontWeight: 700, ...(tab === "knockout" ? { bgcolor: "primary.main", color: "#fff" } : {}) }}
            />
          </Box>
        )}

        {/* Knockout tab */}
        {tab === "knockout" ? (
          <Bracket competitionId={competitionId} />
        ) : format === "knockout" ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
              Esta competição é disputada apenas em mata-mata.
            </Typography>
          </Box>
        ) : (
          <>
            <LegendChips competitionId={competitionId} />

            {/* Groups <-> Flat toggle (Brasileirão/Variants supports "flat"; Libertadores/Sulamericana supports "groups") */}
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

            {view === "flat" && data && data.length > 0 ? (
              <FlatStandings
                teams={[...data].sort((a, b) => b.points - a.points)}
                teamLabel={teamLabel}
                competitionId={competitionId}
              />
            ) : data && data.length > 0 ? (
              <Stack spacing={2}>
                {Object.entries(groups).map(([groupName, teams]) => (
                  <GroupStandings key={groupName} groupName={groupName} teams={teams} competitionId={competitionId} />
                ))}
              </Stack>
            ) : (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
                  Classificação indisponível
                </Typography>
              </Box>
            )}
          </>
        )}
      </Stack>
    </>
  );
}
