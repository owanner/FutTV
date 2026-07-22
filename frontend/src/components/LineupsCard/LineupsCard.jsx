import { Box, Card, CardContent, Typography, Divider, Stack, Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import MenuBookIcon from "@mui/icons-material/MenuBook";

function getDisplayPlayerName(fullName) {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const upperWords = parts.filter(
    (w) => w === w.toUpperCase() && /[A-Z\u00C0-\u00D6\u00D8-\u00DE]/.test(w)
  );
  if (upperWords.length === 1) return upperWords[0];
  if (upperWords.length > 1) return upperWords[upperWords.length - 1];
  return parts[parts.length - 1];
}

function PlayerRow({ player, compact, accentColor }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{
        py: 0.6,
        px: 1,
        borderRadius: 1,
        "&:hover": { bgcolor: "action.hover" },
        transition: "background-color .15s"
      }}
    >
      <Box
        sx={{
          width: compact ? 22 : 26,
          height: compact ? 22 : 26,
          borderRadius: "50%",
          bgcolor: accentColor || "primary.main",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: compact ? 10 : 11,
          fontWeight: 700,
          flexShrink: 0
        }}
      >
        {player.ShirtNumber}
      </Box>
      <Typography
        variant={compact ? "caption" : "body2"}
        sx={{
          lineHeight: 1.2,
          fontWeight: compact ? 600 : 400,
          fontSize: compact ? "0.78rem" : "0.85rem"
        }}
      >
        {compact
          ? getDisplayPlayerName(player.PlayerName?.[0]?.Description)
          : player.PlayerName?.[0]?.Description}
      </Typography>
    </Stack>
  );
}

function TeamColumn({ starters, bench, teamName, flag, compact, accentColor }) {
  return (
    <Stack sx={{ flex: 1, minWidth: 0 }}>
      <Stack alignItems="center" spacing={0.5} sx={{ mb: 1.5 }}>
        {flag && (
          <Box
            component="img"
            src={flag}
            alt={teamName}
            sx={{ width: 40, height: 28, borderRadius: 0.5, objectFit: "contain" }}
          />
        )}
        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.78rem", textAlign: "center", lineHeight: 1.1 }}>
          {teamName}
        </Typography>
      </Stack>

      <Chip
        label={`Titulares (${starters.length})`}
        size="small"
        sx={{
          mb: 1,
          height: 22,
          fontSize: "0.68rem",
          fontWeight: 700,
          bgcolor: `${accentColor || "#19AE47"}15`,
          color: accentColor || "success.main",
          alignSelf: "flex-start"
        }}
      />
      <Stack spacing={0.25} sx={{ mb: 1.5 }}>
        {starters.length > 0 ? (
          starters.map((p) => (
            <PlayerRow key={p.IdPlayer} player={p} compact={compact} accentColor={accentColor} />
          ))
        ) : (
          <Typography variant="caption" color="text.secondary">Nenhum titular</Typography>
        )}
      </Stack>

      <Divider sx={{ my: 1 }} />

      <Chip
        label={`Reservas (${bench.length})`}
        size="small"
        sx={{
          mb: 1,
          height: 22,
          fontSize: "0.68rem",
          fontWeight: 700,
          bgcolor: "grey.100",
          color: "text.secondary",
          alignSelf: "flex-start"
        }}
      />
      <Stack spacing={0.25}>
        {bench.length > 0 ? (
          bench.map((p) => (
            <PlayerRow key={p.IdPlayer} player={p} compact={compact} accentColor={accentColor} />
          ))
        ) : (
          <Typography variant="caption" color="text.secondary">Nenhuma reserva</Typography>
        )}
      </Stack>
    </Stack>
  );
}

export default function LineupsCard({ homeFlag, awayFlag, homeTeam, awayTeam, live, colors }) {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("md"));

  if (!live) return null;

  const homePlayers = live.HomeTeam?.Players || [];
  const awayPlayers = live.AwayTeam?.Players || [];

  const homeStarters = homePlayers.filter((p) => p.Status === 1);
  const homeBench = homePlayers.filter((p) => p.Status === 2);
  const awayStarters = awayPlayers.filter((p) => p.Status === 1);
  const awayBench = awayPlayers.filter((p) => p.Status === 2);

  return (
    <Card
      sx={{
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider"
      }}
    >
      <CardContent sx={{ px: { xs: 2, sm: 3 }, py: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 2 }}>
          <MenuBookIcon sx={{ fontSize: 18, color: colors?.primary || "primary.main" }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Escalacoes
          </Typography>
        </Stack>

        <Stack direction="row" spacing={compact ? 1 : 3} useFlexGap>
          <TeamColumn
            starters={homeStarters}
            bench={homeBench}
            teamName={homeTeam || live.HomeTeam?.TeamName?.[0]?.Description}
            flag={homeFlag}
            compact={compact}
            accentColor={colors?.primary}
          />
          <TeamColumn
            starters={awayStarters}
            bench={awayBench}
            teamName={awayTeam || live.AwayTeam?.TeamName?.[0]?.Description}
            flag={awayFlag}
            compact={compact}
            accentColor={colors?.secondary}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
