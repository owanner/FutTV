import { Card, CardContent, Typography, Stack, Chip, Divider, Box } from "@mui/material";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import SportsScoreOutlinedIcon from "@mui/icons-material/SportsScoreOutlined";
import { getStatus, hasScore } from "../../utils/statusUtils";
import { abbreviateTeamName } from "../../utils/teamUtils";

function TeamBlock({ flag, name, colors }) {
  return (
    <Stack alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
      <Box
        sx={{
          width: { xs: 56, sm: 72 },
          height: { xs: 42, sm: 54 },
          display: "grid",
          placeItems: "center",
          borderRadius: 2,
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow: `0 4px 16px ${colors?.primary || "#000"}22`
        }}
      >
        {flag ? (
          <Box
            component="img"
            src={flag}
            alt={name || "Time"}
            sx={{ width: "72%", height: "72%", objectFit: "contain" }}
          />
        ) : (
          <Typography variant="h6" sx={{ color: "rgba(255,255,255,0.4)" }}>?</Typography>
        )}
      </Box>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 700,
          fontSize: { xs: "0.82rem", sm: "0.95rem" },
          textAlign: "center",
          lineHeight: 1.15,
          color: "#fff",
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

export default function MatchDetailsHero({ match, colors }) {
  if (!match) return null;

  const status = getStatus(match.status);
  const matchHasScore = hasScore(match.status);
  const scoreLabel =
    matchHasScore && Number.isFinite(match.homeScore) && Number.isFinite(match.awayScore)
      ? `${match.homeScore} x ${match.awayScore}`
      : "";
  const centerLabel = matchHasScore ? scoreLabel : "VS";

  const gradient = `linear-gradient(135deg, ${colors.secondary || "#1a1a1a"} 0%, ${colors.secondary || "#1a1a1a"}cc 45%, ${colors.primary} 100%)`;

  return (
    <Card
      sx={{
        width: "100%",
        overflow: "hidden",
        borderRadius: 3,
        boxShadow: `0 12px 40px ${colors.primary || "#000"}28`,
        border: "1px solid rgba(255,255,255,0.06)",
        background: gradient,
        color: "#fff"
      }}
    >
      <CardContent sx={{ pt: { xs: 3, sm: 4 }, pb: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 } }}>
        {/* Group + status */}
        <Stack direction="row" justifyContent="center" alignItems="center" spacing={1.5} mb={2}>
          <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>
            {match.groupName || match.stageName || "Fase Final"}
          </Typography>
          <Chip
            label={status.label}
            size="small"
            sx={{
              height: 22,
              fontSize: "0.68rem",
              fontWeight: 700,
              bgcolor: status.background,
              color: status.color,
              border: "1px solid rgba(255,255,255,0.15)"
            }}
          />
        </Stack>

        {/* Teams + score */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: { xs: 1, sm: 2, md: 4 },
          }}
        >
          <TeamBlock flag={match.homeFlag} name={match.homeTeam} colors={colors} />

          <Stack alignItems="center" spacing={0.5} sx={{ minWidth: { xs: 80, sm: 120 } }}>
            <Typography
              sx={{
                fontSize: { xs: "1.8rem", sm: "2.4rem" },
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: -1
              }}
            >
              {centerLabel || "\u00A0"}
            </Typography>
            {matchHasScore && (
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>
                {match.stageName || ""}
              </Typography>
            )}
          </Stack>

          <TeamBlock flag={match.awayFlag} name={match.awayTeam} colors={colors} />
        </Box>

        {/* Info bar */}
        <Divider sx={{ my: 2.5, borderColor: "rgba(255,255,255,0.12)" }} />

        <Stack spacing={1} alignItems="center">
          {match.stadium && (
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: "rgba(255,255,255,0.7)" }}>
              <LocationOnOutlinedIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 500 }}>{match.stadium}</Typography>
            </Stack>
          )}
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: "rgba(255,255,255,0.55)" }}>
            <SportsScoreOutlinedIcon sx={{ fontSize: 16 }} />
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              Arbitro: {match.referee || "Nao informado"}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
