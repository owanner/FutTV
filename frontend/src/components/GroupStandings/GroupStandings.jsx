import { Card, CardContent, Typography, Stack, Avatar, Divider, Box } from "@mui/material";
import { useTheme, useMediaQuery } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { abbreviateTeamName } from "../../utils/teamUtils";

/** Column definitions for the stats grid. */
const STAT_COLUMNS = [
  { key: "points", label: "P", bold: true },
  { key: "played", label: "PJ", bold: false },
  { key: "wins", label: "V", bold: false },
  { key: "draws", label: "E", bold: false },
  { key: "losses", label: "D", bold: false },
  { key: "goalDifference", label: "SG", bold: false, format: (v) => (v > 0 ? `+${v}` : v) }
];

/** Returns the qualification border color based on group position. */
function getPositionColor(position) {
  if (position <= 2) return "#43a047"; // qualified (green)
  if (position === 3) return "#fbc02d"; // playoff (yellow)
  return "#e53935"; // eliminated (red)
}

export default function GroupStandings({ groupName, teams }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const groupLetter = groupName.replace("Grupo ", "");

  return (
    <Card>
      <CardContent>
        {/* Group name — clickable to navigate to group detail */}
        <Typography
          variant="h6"
          fontWeight={700}
          gutterBottom
          sx={{ cursor: "pointer", "&:hover": { opacity: 0.8 } }}
          onClick={() => navigate(`/group/${groupLetter}`)}
        >
          {groupName}
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {/* Table header */}
        <Stack direction="row" alignItems="center" sx={{ mb: 1, px: 1, width: "100%" }}>
          <Box
            sx={{
              flex: { xs: "0 0 140px", md: 1 },
              minWidth: { xs: 140, md: 280 },
              pr: 1,
              borderRight: "2px solid",
              borderColor: "rgba(0,0,0,0.08)"
            }}
          >
            <Typography sx={{ fontSize: "0.90rem", fontWeight: 700, color: "primary.main" }} variant="caption">
              Seleção
            </Typography>
          </Box>

          {STAT_COLUMNS.map((col) => (
            <Box key={col.key} sx={{ width: { xs: 36, md: 60 }, display: "flex", justifyContent: "center" }}>
              <Typography variant="caption" fontWeight={700}>{col.label}</Typography>
            </Box>
          ))}
        </Stack>

        <Divider sx={{ mb: 1 }} />

        {/* Team rows */}
        {teams.map((team) => (
          <Stack
            key={team.teamId}
            direction="row"
            sx={{ width: "100%", py: 1, px: 1, borderLeft: `4px solid ${getPositionColor(team.position)}` }}
          >
            {/* Team name cell */}
            <Stack
              direction="row"
              spacing={0.75}
              alignItems="center"
              sx={{
                flex: { xs: "0 0 140px", md: 1 },
                minWidth: { xs: 140, md: 280 },
                ml: 1,
                pr: 1,
                borderRight: "2px solid",
                borderColor: "rgba(0,0,0,0.08)"
              }}
            >
              <Avatar
                src={team.flag}
                alt={team.teamName}
                sx={{ width: { xs: 18, md: 24 }, height: { xs: 18, md: 24 }, flexShrink: 0 }}
              />
              <Typography
                variant="body2"
                sx={{
                  cursor: "pointer",
                  fontSize: { xs: "0.80rem", md: "0.875rem" },
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  "&:hover": { textDecoration: "underline" }
                }}
                onClick={() => navigate(`/team/${team.teamCode}`)}
              >
                {isMobile ? abbreviateTeamName(team.teamName) : team.teamName}
              </Typography>
            </Stack>

            {/* Stat cells */}
            {STAT_COLUMNS.map((col) => (
              <Box key={col.key} sx={{ width: { xs: 36, md: 60 }, display: "flex", justifyContent: "center" }}>
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
