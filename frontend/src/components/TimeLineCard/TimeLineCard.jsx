import { Card, CardContent, Typography, Stack, Chip, Box } from "@mui/material";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";

const EVENT_CONFIG = {
  0: { icon: "\u26BD", label: "Gol", color: "#19AE47" },
  2: { icon: "\uD83D\uDFE8", label: "Cartao amarelo", color: "#FFC107" },
  3: { icon: "\uD83D\uDD34", label: "Cartao vermelho", color: "#E53935" },
  5: { icon: "\uD83D\uDD04", label: "Substituicao", color: "#5C6BC0" },
  71: { icon: "\uD83C\uDFAC", label: "VAR", color: "#78909C" }
};

export default function TimeLineCard({ events, colors }) {
  if (!events) return null;

  const timeline = Array.isArray(events.Event) ? events.Event : [];
  const importantEvents = timeline.filter((e) => [0, 2, 3, 5, 71].includes(e.Type));

  if (!importantEvents.length) return null;

  return (
    <Card
      sx={{
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider"
      }}
    >
      <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 2 }}>
          <SportsSoccerIcon sx={{ fontSize: 18, color: colors?.primary || "primary.main" }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Eventos
          </Typography>
        </Stack>

        <Stack spacing={1}>
          {importantEvents.map((event) => {
            const config = EVENT_CONFIG[event.Type] || { icon: "\u2022", label: "", color: "#78909C" };
            const description = event.TypeLocalized?.[0]?.Description || "";
            const detail = event.EventDescription?.[0]?.Description || "";

            return (
              <Box
                key={event.EventId}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.5,
                  py: 1,
                  px: 1.5,
                  borderRadius: 1.5,
                  bgcolor: "grey.50",
                  border: "1px solid",
                  borderColor: "grey.100"
                }}
              >
                <Typography sx={{ fontSize: "1.1rem", lineHeight: 1.2, mt: 0.1 }}>
                  {config.icon}
                </Typography>
                <Stack sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={event.MatchMinute}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        bgcolor: colors?.primary || "primary.main",
                        color: "#fff"
                      }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.82rem" }}>
                      {description}
                    </Typography>
                  </Stack>
                  {detail && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, fontSize: "0.75rem" }}>
                      {detail}
                    </Typography>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}
