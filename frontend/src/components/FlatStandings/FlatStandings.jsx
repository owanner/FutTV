import { Stack, Card, CardContent, Box, Typography, Avatar, Divider } from "@mui/material";
import { CARD_SX, getPositionColor, STAT_COLUMNS } from "../../utils/standingsUtils";

export default function FlatStandings({ teams, teamLabel, competitionId }) {
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
