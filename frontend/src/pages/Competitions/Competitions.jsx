import { Box, Card, CardActionArea, CardContent, Stack, Typography, Skeleton, Chip } from "@mui/material";
import { ArrowForward } from "@mui/icons-material";
import { getAllCompetitions } from "../../config/competitions";
import { useNav } from "../../hooks/useNav";
import { useCompetitionsStatus } from "../../hooks/useCompetitionsStatus";
import dayjs from "dayjs";

function CompetitionCard({ c, finished = false, lastFinishedDate }) {
  const navigate = useNav();

  return (
    <Card
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
        transition: "transform .18s ease, box-shadow .18s ease",
        opacity: finished ? 0.72 : 1,
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
          opacity: 1
        }
      }}
    >
      <Box
        sx={{
          height: 8,
          background: `linear-gradient(90deg, ${c.colors.primary}, ${c.colors.secondary || c.colors.primary})`
        }}
      />

      <CardActionArea
        onClick={() => navigate(`/competitions/${c.id}`)}
        sx={{ p: 0 }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  {c.shortName || c.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {c.name}
                </Typography>
              </Box>
              {finished ? (
                <Chip
                  size="small"
                  label="Encerrada"
                  sx={{ height: 22, fontWeight: 700, fontSize: "0.68rem" }}
                />
              ) : (
                <ArrowForward sx={{ color: "text.secondary", mt: 0.5 }} />
              )}
            </Stack>

            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 0.5, alignItems: "center" }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: c.colors.primary,
                  flexShrink: 0
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {finished
                  ? (lastFinishedDate
                      ? `Último jogo: ${dayjs(lastFinishedDate).format("DD [de] MMMM [de] YYYY")}`
                      : "Concluída")
                  : "Jogos · Classificação · Transmissões"}
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default function Competitions() {
  const allCompetitions = getAllCompetitions();
  const { data: statusMap, isLoading } = useCompetitionsStatus();

  const active = [];
  const finished = [];

  for (const c of allCompetitions) {
    const st = statusMap?.[c.id];
    const isActive = st ? st.hasUpcoming || st.hasLive : true;
    (isActive ? active : finished).push({ c, st });
  }

  const finishedSorted = [...finished].sort((a, b) => {
    const ad = a.st?.lastFinishedDate ? new Date(a.st.lastFinishedDate) : 0;
    const bd = b.st?.lastFinishedDate ? new Date(b.st.lastFinishedDate) : 0;
    return bd - ad;
  });

  return (
    <Stack spacing={3}>
      <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
        Competições
      </Typography>

      <Box>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.8, mb: 1, display: "block" }}>
          Em andamento
        </Typography>

        {isLoading ? (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 2 }}>
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} variant="rounded" height={130} sx={{ borderRadius: 3 }} />
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
              gap: 2
            }}
          >
            {active.map(({ c }) => <CompetitionCard key={c.id} c={c} />)}
          </Box>
        )}
      </Box>

      {finishedSorted.length > 0 && (
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.8 }}>
              Competições encerradas
            </Typography>
          </Stack>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
              gap: 2
            }}
          >
            {finishedSorted.map(({ c, st }) => (
              <CompetitionCard
                key={c.id}
                c={c}
                finished
                lastFinishedDate={st?.lastFinishedDate}
              />
            ))}
          </Box>
        </Box>
      )}
    </Stack>
  );
}
