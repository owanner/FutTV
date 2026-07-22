import { Box, Card, CardActionArea, CardContent, Chip, Stack, Typography } from "@mui/material";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import LiveTvOutlinedIcon from "@mui/icons-material/LiveTvOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import { sortBroadcasts } from "../../utils/broadcasts.js";
import { getStatus, hasScore } from "../../utils/statusUtils";
import { formatBroadcasts } from "../../utils/formatUtils";
import { TeamBlock, TeamName, InfoItem } from "../MatchTeamDisplay/MatchTeamDisplay";
import { useCompetition } from "../../contexts/CompetitionContext";
import dayjs from "dayjs";
import useNav from "../../hooks/useNav";

function buildCardGradient(colors) {
  return `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.secondary}cc 45%, ${colors.primary} 100%)`;
}

export default function MatchHero({ match }) {
  const navigate = useNav();
  const { competition } = useCompetition();

  if (!match) return null;

  const status = getStatus(match.status);
  const matchHasScore = hasScore(match.status);
  const broadcasts = sortBroadcasts(match.broadcasts || []);

  return (
    <Card
      sx={{
        width: "100%",
        maxWidth: 880,
        mx: "auto",
        mb: { xs: 1.25, sm: 1.5 },
        overflow: "hidden",
        border: "1px solid rgba(0, 106, 103, 0.16)",
        background: buildCardGradient(competition.colors),
        color: "#fff"
      }}
    >
      <CardActionArea onClick={() => navigate(`/match/${match.id}`)} sx={{ color: "inherit" }}>
        <CardContent sx={{ p: { xs: 1, sm: 1.5 } }}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="overline">JOGO EM DESTAQUE</Typography>
              <Chip
                label={status.label}
                size="small"
                sx={{ bgcolor: status.background, color: status.color }}
              />
            </Stack>
            <Typography sx={{ mt: 1.5, fontWeight: 800, fontSize: { xs: "1rem", md: "1.2rem" } }}>
              {match.groupName}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              alignContent: "center",
              justifyItems: "center",
              width: "100%",
              py: { xs: 1, sm: 1.25 }
            }}
          >
            <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
              <Stack alignItems="center" spacing={0.75} sx={{ width: "100%", maxWidth: { xs: 90, sm: 120 }, mx: "auto" }}>
                <TeamBlock flag={match.homeFlag} name={match.homeTeam} />
                <TeamName name={match.homeTeam} />
              </Stack>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", px: { xs: 0.5, sm: 1 } }}>
              <Stack alignItems="center" spacing={0.25}>
                <Typography sx={{ fontSize: { xs: "1.2rem", sm: "1.6rem" }, lineHeight: 1, fontWeight: 900 }}>
                  {matchHasScore ? `${match.homeScore ?? 0} x ${match.awayScore ?? 0}` : "VS"}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ alignSelf: "center", color: "rgba(255,255,255,0.7)", fontWeight: 700, textTransform: "uppercase", fontSize: { xs: "0.6rem", sm: "0.7rem" } }}
                >
                  {dayjs(match.date).format("DD MMM")}
                </Typography>
              </Stack>
            </Box>

            <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
              <Stack alignItems="center" spacing={0.75} sx={{ width: "100%", maxWidth: { xs: 90, sm: 120 }, mx: "auto" }}>
                <TeamBlock flag={match.awayFlag} name={match.awayTeam} />
                <TeamName name={match.awayTeam} />
              </Stack>
            </Box>
          </Box>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 1, md: 2 }}
            sx={{ mt: 1, pt: 1, borderTop: "1px solid rgba(255,255,255,0.18)" }}
          >
            {match.stadium && (
              <InfoItem icon={<LocationOnOutlinedIcon fontSize="small" />}>
                {match.stadium}
              </InfoItem>
            )}
            <InfoItem icon={<AccessTimeOutlinedIcon fontSize="small" />}>
              {dayjs(match.date).format("DD/MM/YYYY HH:mm")}
            </InfoItem>
            {broadcasts.length > 0 && (
              <InfoItem icon={<LiveTvOutlinedIcon fontSize="small" />} logo={broadcasts[0]?.logo}>
                {formatBroadcasts(broadcasts)}
              </InfoItem>
            )}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
