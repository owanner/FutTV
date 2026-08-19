import { useMemo, useState } from "react";
import { Card, CardContent, Typography, Stack, Box, Chip } from "@mui/material";
import { EmojiEvents, HourglassEmpty } from "@mui/icons-material";
import dayjs from "dayjs";

import { useCompetition } from "../../contexts/CompetitionContext";
import { useMatches } from "../../hooks/useMatches";
import { useBracket } from "../../hooks/useBracket";
import { getStatus } from "../../utils/statusUtils";
import { formatMatchDate } from "../../utils/formatUtils";
import { abbreviateTeamName, normalizeTeamName } from "../../utils/teamUtils";
import {
  KNOCKOUT_PHASES,
  groupMatchesByPhase,
  CARD_SX
} from "../../utils/standingsUtils";
import { useNav } from "../../hooks/useNav";
import { PageLoader, PageError } from "../../components/PageLoader/PageLoader";

function TeamSide({ team, code, flag, score, penaltyScore, isHome, winner, competitionId }) {
  const isPlaceholder = !team || team.trim().toLowerCase() === "unknown" || team.trim().toLowerCase() === "a definir";
  const displayName = isPlaceholder ? "A definir" : normalizeTeamName(team) || abbreviateTeamName(code) || "A definir";

  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      sx={{ flex: 1, minWidth: 0, opacity: winner === false ? 0.45 : 1 }}
    >
      <Box
        sx={{
          width: 24,
          height: 18,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          borderRadius: 0.5,
          backgroundColor: "#F8FAFC",
          border: "1px solid rgba(16,32,29,0.08)",
          overflow: "hidden"
        }}
      >
        {isPlaceholder ? (
          <HourglassEmpty sx={{ fontSize: 14, color: "text.disabled" }} />
        ) : flag ? (
          <Box component="img" src={flag} alt="" sx={{ width: 20, height: 14, objectFit: "contain" }} />
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem" }}>?</Typography>
        )}
      </Box>
      <Typography
        variant="body2"
        sx={{
          flex: 1,
          minWidth: 0,
          fontWeight: winner ? 800 : 500,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          color: isPlaceholder ? "text.secondary" : "text.primary",
          fontStyle: isPlaceholder ? "italic" : "normal"
        }}
      >
        {displayName}
      </Typography>
      {score != null && (
        <Typography variant="body2" sx={{ fontWeight: 800, flexShrink: 0, display: "flex", alignItems: "center", gap: 0.5 }}>
          {isHome ? (
            <>
              {score}
              {penaltyScore != null && (
                <Box component="span" sx={{ fontSize: "0.75em", fontWeight: 700, color: "text.secondary" }}>
                  ({penaltyScore})
                </Box>
              )}
            </>
          ) : (
            <>
              {penaltyScore != null && (
                <Box component="span" sx={{ fontSize: "0.75em", fontWeight: 700, color: "text.secondary" }}>
                  ({penaltyScore})
                </Box>
              )}
              {score}
            </>
          )}
        </Typography>
      )}
    </Stack>
  );
}

function BracketMatchCard({ match, navigate, isThirdPlace, competitionId }) {
  const status = getStatus(match.status);
  const showScore = match.status === 0 || match.status === 3;
  const homeScore = showScore ? match.homeScore ?? 0 : null;
  const awayScore = showScore ? match.awayScore ?? 0 : null;
  const homePenScore = showScore ? match.homePenaltyScore ?? null : null;
  const awayPenScore = showScore ? match.awayPenaltyScore ?? null : null;
  const hasPens = homePenScore != null && awayPenScore != null;
  const decided = match.status === 0 && (homeScore !== null && awayScore !== null);
  const homeWins = decided && (hasPens ? homePenScore > awayPenScore : homeScore > awayScore);
  const awayWins = decided && (hasPens ? awayPenScore > homePenScore : awayScore > homeScore);

  return (
    <Card
      sx={{
        ...CARD_SX,
        cursor: "pointer",
        "&:hover": { boxShadow: "0 6px 16px rgba(0,0,0,0.10)" }
      }}
      onClick={() => navigate(`/match/${match.id}`)}
    >
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: "0.65rem" }}>
              {formatMatchDate(match.date)} · {dayjs(match.date).format("HH:mm")}
            </Typography>
            {isThirdPlace && (
              <Chip size="small" label="3º lugar" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700 }} color="warning" />
            )}
            <Chip
              size="small"
              label={status.label}
              sx={{ height: 18, fontSize: "0.6rem", color: status.color, bgcolor: status.background, fontWeight: 700 }}
            />
          </Stack>
          <Stack spacing={0.5}>
            <TeamSide team={match.homeTeam} code={match.homeCode} flag={match.homeFlag} score={homeScore} penaltyScore={homePenScore} isHome={true} winner={decided ? homeWins : null} competitionId={competitionId} />
            <TeamSide team={match.awayTeam} code={match.awayCode} flag={match.awayFlag} score={awayScore} penaltyScore={awayPenScore} isHome={false} winner={decided ? awayWins : null} competitionId={competitionId} />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function hasRealTeams(match) {
  const home = (match.homeTeam || "").trim();
  const away = (match.awayTeam || "").trim();
  if (home.length === 0 || away.length === 0) return false;
  const placeholder = ["unknown", "a definir"];
  if (placeholder.includes(home.toLowerCase()) && placeholder.includes(away.toLowerCase())) return false;
  return true;
}

function PhaseBlock({ phase, matches, navigate, competitionId }) {
  const isThirdPlace = phase.key === "THIRD_PLACE";
  const sortedMatches = [...matches].sort((a, b) => new Date(a.date) - new Date(b.date));
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
          {phase.label}
        </Typography>
        <Chip
          size="small"
          label={`${sortedMatches.length}/${phase.matchCount}`}
          sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700, bgcolor: "primary.light", color: "primary.dark" }}
        />
      </Stack>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" },
          gap: 1.5
        }}
      >
        {sortedMatches.map((m) => (
          <BracketMatchCard key={m.id} match={m} navigate={navigate} isThirdPlace={isThirdPlace} competitionId={competitionId} />
        ))}
        {sortedMatches.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
            Confrontos a definir.
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default function Bracket({ competitionId: overrideId }) {
  const { competitionId: ctxId } = useCompetition();
  const navigate = useNav();
  const competitionId = overrideId || ctxId;

  const phases = KNOCKOUT_PHASES[competitionId];
  const matchesQuery = useMatches(competitionId);
  const bracketQuery = useBracket(competitionId);
  const [selectedPhase, setSelectedPhase] = useState("ALL");

  const byPhase = useMemo(() => {
    if (!phases) return null;
    if (matchesQuery.data && matchesQuery.data.length > 0) {
      return groupMatchesByPhase(matchesQuery.data, phases, competitionId);
    }
    return null;
  }, [matchesQuery.data, phases, competitionId]);

  const realByPhase = useMemo(() => {
    if (!byPhase) return null;
    const result = {};
    for (const [key, matches] of Object.entries(byPhase)) {
      result[key] = matches.filter(hasRealTeams);
    }
    return result;
  }, [byPhase]);

  if (matchesQuery.isLoading) return <PageLoader />;
  if (matchesQuery.error) return <PageError message="Erro ao carregar fase eliminatória" />;
  if (!phases) {
    return (
      <Card>
        <CardContent>
          <Stack spacing={1} alignItems="center" sx={{ py: 2 }}>
            <EmojiEvents sx={{ fontSize: 40, color: "text.secondary" }} />
            <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
              Esta competição não possui fase de eliminatória.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  const totalDecided = phases.reduce((acc, phase) => {
    const list = realByPhase?.[phase.key] || [];
    return acc + list.length;
  }, 0);

  return (
    <Stack spacing={2.5}>
      <Card>
        <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <EmojiEvents color="primary" fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Fase eliminatória
            </Typography>
            <Chip
              size="small"
              label={bracketQuery.isLoading ? "Gerando chaveamento…" : `${totalDecided} confrontos definidos`}
              sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700 }}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Phase filter chips */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          overflowX: "auto",
          pb: 0.5,
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none"
        }}
      >
        <Chip
          label="Todas as fases"
          onClick={() => setSelectedPhase("ALL")}
          variant={selectedPhase === "ALL" ? "filled" : "outlined"}
          sx={{ fontWeight: 700, flexShrink: 0, ...(selectedPhase === "ALL" ? { bgcolor: "primary.main", color: "#fff" } : {}) }}
        />
        {phases.map((phase, index) => {
          const rawCount = realByPhase?.[phase.key]?.length || 0;
          return (
            <Chip
              key={phase.key}
              label={`${phase.label} · ${rawCount}/${phase.matchCount}`}
              onClick={() => setSelectedPhase(phase.key)}
              variant={selectedPhase === phase.key ? "filled" : "outlined"}
              sx={{ fontWeight: 700, flexShrink: 0, ...(selectedPhase === phase.key ? { bgcolor: "primary.main", color: "#fff" } : {}) }}
            />
          );
        })}
      </Box>

      {phases
        .filter((phase) => selectedPhase === "ALL" || selectedPhase === phase.key)
        .map((phase) => (
          <PhaseBlock
            key={phase.key}
            phase={phase}
            matches={realByPhase?.[phase.key] || []}
            navigate={navigate}
            competitionId={competitionId}
          />
        ))}
    </Stack>
  );
}
