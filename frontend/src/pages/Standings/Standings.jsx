import { useState } from "react";
import {
  Stack,
  Card,
  CardContent,
  Chip,
  Box,
  Typography,
  Avatar,
  Divider
} from "@mui/material";
import { useStandings } from "../../hooks/useStandings";
import { useCompetition } from "../../contexts/CompetitionContext";
import GroupStandings from "../../components/GroupStandings/GroupStandings";
import PageHeader from "../../components/PageHeader/PageHeader";
import { getCompetition, getAllCompetitions } from "../../config/competitions";
import { getPositionColor, STAT_COLUMNS, BRASILEIRAO_ZONES } from "../../utils/standingsUtils";
import { PageLoader, PageError } from "../../components/PageLoader/PageLoader";

const CARD_SX = {
  borderRadius: 2,
  border: "1px solid",
  borderColor: "divider",
  transition: "box-shadow .15s ease",
  "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }
};

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

function LegendBar({ children }) {
  return (
    <Card sx={CARD_SX}>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", justifyContent: "center" }}>
          {children}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function Standings() {
  const { data, isLoading, error } = useStandings();
  const { competition, competitionId } = useCompetition();
  const isLibertadores = competitionId === "libertadores2026";
  const isBrasileirao = competitionId === "brasileirao2026";
  const [view, setView] = useState(isLibertadores ? "groups" : "flat");
  const comp = getCompetition(competitionId);
  const teamLabel = comp?.teamLabel || "Time";
  const allCompetitions = getAllCompetitions();

  if (isLoading) return <PageLoader />;
  if (error) return <PageError message="Erro ao carregar classificação" />;

  const groups = {};
  (data || []).forEach((team) => {
    if (!groups[team.groupName]) groups[team.groupName] = [];
    groups[team.groupName].push(team);
  });

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
        <LegendBar>{legendChips}</LegendBar>

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
