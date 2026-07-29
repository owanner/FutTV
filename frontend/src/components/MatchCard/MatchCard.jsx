import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography
} from "@mui/material";

import {
  FlagOutlined,
  LocationOnOutlined,
  LiveTvOutlined
} from "@mui/icons-material";

import dayjs from "dayjs";
import { sortBroadcasts } from "../../utils/broadcasts";
import { getStatus } from "../../utils/statusUtils";
import { formatMatchDate } from "../../utils/formatUtils";
import { abbreviateTeamName, normalizeTeamName } from "../../utils/teamUtils";
import { useNav } from "../../hooks/useNav";

/* ─── TeamBlock ──────────────────────────────────────────────────────────
   A symmetric team block: crest centered on top, name centered below.
   Shared by all MatchCard variants for visual consistency.
   `size` controls crest dimensions; `dark` flips text colour for the hero.
─────────────────────────────────────────────────────────────────────────── */
function TeamBlock({ flag, name, code, size = "md", dark = false, onClick }) {
  const dims = {
    sm: { box: [44, 34], img: [34, 26], name: "0.78rem" },
    md: { box: [56, 42], img: [44, 34], name: "0.85rem" },
    lg: { box: [72, 54], img: [56, 42], name: "0.95rem" }
  }[size];

  const handleTeamClick = (e) => {
    e?.stopPropagation?.();
    if (onClick) return onClick(e);
  };

  return (
    <Stack
      alignItems="center"
      spacing={0.75}
      sx={{
        flex: 1,
        minWidth: 0,
        maxWidth: { xs: 110, sm: 120 },
        textAlign: "center",
        cursor: onClick ? "pointer" : "default"
      }}
      onClick={handleTeamClick}
    >
      <Box
        sx={{
          width: dims.box[0],
          height: dims.box[1],
          display: "grid",
          placeItems: "center",
          borderRadius: 1.5,
          backgroundColor: "#FFFFFF",
          border: dark
            ? "1px solid rgba(255,255,255,0.18)"
            : "1px solid rgba(16,32,29,0.08)",
          boxShadow: dark ? "0 4px 16px rgba(0,0,0,0.18)" : "none",
          flexShrink: 0
        }}
      >
        {flag ? (
          <Box
            component="img"
            src={flag}
            alt={name || "Time"}
            sx={{ width: dims.img[0], height: dims.img[1], objectFit: "contain" }}
          />
        ) : (
          <FlagOutlined sx={{ color: dark ? "rgba(255,255,255,0.45)" : "text.secondary", fontSize: size === "lg" ? 30 : 24 }} />
        )}
      </Box>
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: dims.name,
          lineHeight: 1.1,
          textAlign: "center",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          color: dark ? "#fff" : "text.primary",
          width: "100%",
          "&:hover": dark ? {} : { color: code ? "primary.main" : "inherit" }
        }}
      >
        {abbreviateTeamName(normalizeTeamName(name))}
      </Typography>
    </Stack>
  );
}

/* ─── ScoreBlock ─────────────────────────────────────────────────────────
   Center column: score (or VS) + kickoff time.
   `large` makes the score bigger for the hero variant.
─────────────────────────────────────────────────────────────────────────── */
function ScoreBlock({ match, hasScore, large = false, dark = false }) {
  const scoreSize = large
    ? { xs: "1.9rem", sm: "2.4rem" }
    : { xs: "1.15rem", sm: "1.25rem" };

  return (
    <Stack
      alignItems="center"
      spacing={0.5}
      sx={{ minWidth: large ? { xs: 90, sm: 120 } : 64, flexShrink: 0 }}
    >
      <Typography
        align="center"
        sx={{
          fontSize: scoreSize,
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: -1,
          color: dark ? "#fff" : hasScore ? "text.primary" : "primary.main"
        }}
      >
        {hasScore ? `${match.homeScore ?? 0} – ${match.awayScore ?? 0}` : "VS"}
      </Typography>
      <Typography
        variant="caption"
        align="center"
        sx={{
          color: dark ? "rgba(255,255,255,0.6)" : "text.secondary",
          fontWeight: 700,
          fontSize: large ? "0.78rem" : "0.7rem"
        }}
      >
        {dayjs(match.date).format("HH:mm")}
      </Typography>
    </Stack>
  );
}

/* ─── HeaderBar ───────────────────────────────────────────────────────────
   Top row: competition badge (left) + status chip (right). Optional date.
   On `hero` variant the layout swaps to centered stage + status on right.
─────────────────────────────────────────────────────────────────────────── */
function HeaderBar({ match, status, align = "space-between", dark = false }) {
  const compName = match.competitionName;
  const compColors = match.competitionColors;

  return (
    <Stack
      direction="row"
      justifyContent={align}
      alignItems="center"
      spacing={1}
      sx={{ width: "100%" }}
    >
      {compName && (
        <Chip
          size="small"
          label={compName}
          sx={{
            height: 20,
            fontSize: "0.62rem",
            fontWeight: 700,
            color: dark ? "#fff" : "#fff",
            bgcolor: compColors?.primary || "#666",
            ".MuiChip-label": { px: 0.75 }
          }}
        />
      )}
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ ml: "auto" }}>
        <Typography
          variant="caption"
          sx={{
            color: dark ? "rgba(255,255,255,0.7)" : "text.secondary",
            fontWeight: 700,
            fontSize: "0.68rem"
          }}
        >
          {formatMatchDate(match.date)}
        </Typography>
        <Chip
          size="small"
          label={status.label}
          sx={{
            height: 20,
            fontSize: "0.62rem",
            fontWeight: 700,
            color: status.color,
            bgcolor: status.background
          }}
        />
      </Stack>
    </Stack>
  );
}

/* ─── FooterMeta ──────────────────────────────────────────────────────────
   Bottom meta: stadium (when present) + broadcasts. Hidden on the `row`
   variant for a more compact footprint.
─────────────────────────────────────────────────────────────────────────── */
function FooterMeta({ match, broadcasts, dark = false }) {
  const staged = match.groupName || match.stageName;
  const trim = broadcasts.slice(0, 3);

  if (!staged && !match.stadium && trim.length === 0) return null;

  const muted = dark ? "rgba(255,255,255,0.55)" : "text.secondary";

  return (
    <Stack
      spacing={0.75}
      sx={{
        pt: 1,
        borderTop: dark ? "1px solid rgba(255,255,255,0.12)" : "1px solid",
        borderColor: dark ? undefined : "divider"
      }}
    >
      {staged && (
        <Typography
          variant="caption"
          align="center"
          sx={{ color: muted, fontWeight: 600, fontSize: "0.7rem" }}
        >
          {staged}
        </Typography>
      )}
      {match.stadium && (
        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center" sx={{ color: muted }}>
          <LocationOnOutlined sx={{ fontSize: 13 }} />
          <Typography variant="caption" sx={{ fontWeight: 500, fontSize: "0.7rem" }}>
            {match.stadium}
          </Typography>
        </Stack>
      )}
      {trim.length > 0 && (
        <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center" flexWrap="wrap" useFlexGap>
          <LiveTvOutlined sx={{ fontSize: 14, color: muted }} />
          {trim.map((b) => (
            <Chip
              key={b.id}
              size="small"
              label={b.name}
              sx={{
                height: 18,
                fontSize: "0.6rem",
                fontWeight: 600,
                bgcolor: dark ? "rgba(255,255,255,0.10)" : "grey.100",
                color: dark ? "rgba(255,255,255,0.85)" : undefined
              }}
              icon={b.logo ? (
                <Box component="img" src={b.logo} alt="" sx={{ width: 12, height: 12, ml: 0.5 }} />
              ) : undefined}
            />
          ))}
          {broadcasts.length > 3 && (
            <Typography variant="caption" sx={{ color: muted, fontWeight: 600, fontSize: "0.62rem" }}>
              +{broadcasts.length - 3}
            </Typography>
          )}
        </Stack>
      )}
    </Stack>
  );
}

/* ─── MatchCard ──────────────────────────────────────────────────────────
   Unified match-card component. All variants share the same symmetric
   layout: crests horizontally centered, team names below, score in the
   middle. Variants:
     - "grid" : compact card for matches/competition grids (default)
     - "row"  : compact horizontal-scroll card (Home/upcoming rail)
     - "hero" : large dark-gradient card (MatchDetails hero)
   All variants render a clickable CardActionArea navigating to /match/:id.
─────────────────────────────────────────────────────────────────────────── */
export default function MatchCard({ match, variant = "grid", size, colors, onClick, noAction = false }) {
  const navigate = useNav();
  const status = getStatus(match.status);
  const broadcasts = sortBroadcasts(match.broadcasts || []);
  const showScore = match.status === 0 || match.status === 3;

  const teamSize = size || (variant === "hero" ? "lg" : variant === "row" ? "sm" : "md");

  const handleClick = noAction
    ? undefined
    : onClick
      ? (e) => { e?.stopPropagation?.(); onClick(e); }
      : () => navigate(`/match/${match.id}`);

  /* ───── Hero variant: large dark gradient ───── */
  if (variant === "hero") {
    const c = colors || match.competitionColors || { primary: "#1a1a1a", secondary: "#1a1a1a" };
    const gradient = `linear-gradient(135deg, ${c.primary} 0%, ${c.primary}cc 45%, ${c.secondary || "#1a1a1a"} 100%)`;

    const Wrapper = noAction ? Box : CardActionArea;
    const wrapperProps = noAction
      ? {}
      : { onClick: handleClick, sx: { "&:hover": { backgroundColor: "transparent" } } };

    return (
      <Card
        sx={{
          width: "100%",
          overflow: "hidden",
          borderRadius: 3,
          boxShadow: `0 12px 40px ${c.primary || "#000"}28`,
          border: "1px solid rgba(255,255,255,0.06)",
          background: gradient,
          color: "#fff"
        }}
      >
        <Wrapper {...wrapperProps} sx={{ ...(wrapperProps.sx || {}), p: { xs: 2.5, sm: 3.5 } }}>
          <Stack spacing={2.5} sx={{ width: "100%" }}>
            {/* Stage label centered + status chip */}
            <Stack direction="row" justifyContent="center" alignItems="center" spacing={1.5}>
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}
              >
                {match.groupName || match.stageName || "Partida"}
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
                {formatMatchDate(match.date)}
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
                justifyItems: "center",
                gap: { xs: 1, sm: 2, md: 3 }
              }}
            >
              <TeamBlock flag={match.homeFlag} name={match.homeTeam} code={match.homeCode} size={teamSize} dark />
              <ScoreBlock match={match} hasScore={showScore} large dark />
              <TeamBlock flag={match.awayFlag} name={match.awayTeam} code={match.awayCode} size={teamSize} dark />
            </Box>

            {/* Footer */}
            <FooterMeta match={match} broadcasts={broadcasts} dark />
          </Stack>
        </Wrapper>
      </Card>
    );
  }

  /* ───── grid & row variants ───── */
  const isRow = variant === "row";

  return (
    <Card
      sx={{
        width: "100%",
        height: isRow ? 200 : "100%",
        minWidth: isRow ? 280 : "unset",
        flex: isRow ? "0 0 auto" : "unset",
        mx: isRow ? 0 : "auto",
        maxWidth: isRow ? 320 : 360,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        transition: "transform .18s ease, box-shadow .18s ease",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 8px 18px rgba(81, 81, 81, 0.16)"
        }
      }}
    >
      <CardActionArea
        onClick={handleClick}
        sx={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          p: 0,
          "&:hover": { backgroundColor: "transparent" }
        }}
      >
        <CardContent
          sx={{
            width: "100%",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            p: 1.5,
            height: "100%",
            overflow: "hidden"
          }}
        >
          <Stack spacing={1.5} sx={{ flex: 1 }}>
            <HeaderBar match={match} status={status} align="space-between" />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                alignItems: "center",
                justifyItems: "center",
                gap: 1,
                py: 1
              }}
            >
              <TeamBlock flag={match.homeFlag} name={match.homeTeam} code={match.homeCode} size={teamSize} />
              <ScoreBlock match={match} hasScore={showScore} />
              <TeamBlock flag={match.awayFlag} name={match.awayTeam} code={match.awayCode} size={teamSize} />
            </Box>
          </Stack>

          {!isRow && <FooterMeta match={match} broadcasts={broadcasts} />}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
