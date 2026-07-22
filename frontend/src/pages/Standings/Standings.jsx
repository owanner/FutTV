import { useState } from "react";
import {
  Stack,
  Card,
  CardContent,
  Chip,
  Tabs,
  Tab,
  Box,
  Typography,
  Avatar,
  Divider
} from "@mui/material";
import { useStandings } from "../../hooks/useStandings";
import { useCompetition } from "../../contexts/CompetitionContext";
import GroupStandings from "../../components/GroupStandings/GroupStandings";
import { getCompetition } from "../../config/competitions";
import { getPositionColor, STAT_COLUMNS, BRASILEIRAO_ZONES } from "../../utils/standingsUtils";
import { PageLoader, PageError } from "../../components/PageLoader/PageLoader";

function FlatStandings({ teams, teamLabel, competitionId }) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" sx={{ mb: 1, px: 1, width: "100%" }}>
          <Box
            sx={{
              flex: 1,
              minWidth: 180,
              pr: 1,
              borderRight: "2px solid",
              borderColor: "rgba(0,0,0,0.08)"
            }}
          >
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

        <Divider sx={{ mb: 1 }} />

        {teams.map((team) => (
          <Stack
            key={team.teamId}
            direction="row"
            sx={{ width: "100%", py: 1, px: 1, borderLeft: `4px solid ${getPositionColor(team.position, competitionId)}` }}
          >
            <Stack
              direction="row"
              spacing={0.75}
              alignItems="center"
              sx={{
                flex: 1,
                minWidth: 180,
                ml: 1,
                pr: 1,
                borderRight: "2px solid",
                borderColor: "rgba(0,0,0,0.08)"
              }}
            >
              <Typography variant="body2" sx={{ fontSize: "0.75rem", fontWeight: 700, color: "text.secondary", minWidth: 18 }}>
                {team.position}
              </Typography>
              <Avatar
                src={team.flag}
                alt={team.teamName}
                sx={{ width: 20, height: 20, flexShrink: 0 }}
              />
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

export default function Standings() {
  const { data, isLoading, error } = useStandings();
  const { competition } = useCompetition();
  const isLibertadores = competition?.id === "libertadores2026";
  const isBrasileirao = competition?.id === "brasileirao2026";
  const [tab, setTab] = useState(0);
  const comp = getCompetition(competition?.id);
  const teamLabel = comp?.teamLabel || "Time";

  if (isLoading) {
    return <PageLoader />;
  }

  if (error) {
    return <PageError message="Erro ao carregar classificação" />;
  }

  const groups = {};
  data.forEach((team) => {
    if (!groups[team.groupName]) {
      groups[team.groupName] = [];
    }
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

  if (isLibertadores) {
    const sortedTeams = [...data].sort((a, b) => b.points - a.points);

    return (
      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", justifyContent: "center" }}>
              {legendChips}
            </Stack>
          </CardContent>
        </Card>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            minHeight: 36,
            "& .MuiTab-root": { minHeight: 36, py: 0 }
          }}
        >
          <Tab label="Fase de Grupos" />
          <Tab label="Classificação" />
        </Tabs>

        {tab === 0 && (
          <Stack spacing={3}>
            {Object.entries(groups).map(([groupName, teams]) => (
              <GroupStandings key={groupName} groupName={groupName} teams={teams} />
            ))}
          </Stack>
        )}

        {tab === 1 && (
          <FlatStandings teams={sortedTeams} teamLabel={teamLabel} competitionId={competition?.id} />
        )}
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
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
