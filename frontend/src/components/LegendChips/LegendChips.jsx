import { Stack, Card, CardContent, Chip } from "@mui/material";
import { CARD_SX, BRASILEIRAO_ZONES, SUDAMERICANA_ZONES } from "../../utils/standingsUtils";
import { getCompetitionFormat } from "../../config/competitions";

const WHITE_TEXT = new Set(["#193375", "#e53935", "#102a1f", "#0B1F4F"]);

export default function LegendChips({ competitionId }) {
  const format = getCompetitionFormat(competitionId);
  let content;

  if (competitionId === "brasileirao2026") {
    content = BRASILEIRAO_ZONES.map((zone) => (
      <Chip
        key={zone.label}
        label={zone.label}
        sx={{
          bgcolor: zone.color,
          color: WHITE_TEXT.has(zone.color) ? "white" : "black",
          fontSize: { xs: "0.70rem", sm: "0.80rem" }
        }}
      />
    ));
  } else if (competitionId === "libertadores2026") {
    content = (
      <>
        <Chip color="success" label="Classificado" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }} />
        <Chip color="warning" label="Sulamericana" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }} />
        <Chip color="error" label="Eliminado" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }} />
      </>
    );
  } else if (competitionId === "sulamericana2026") {
    content = SUDAMERICANA_ZONES.map((zone) => (
      <Chip
        key={zone.label}
        label={zone.label}
        sx={{
          bgcolor: zone.color,
          color: "white",
          fontSize: { xs: "0.75rem", sm: "0.875rem" }
        }}
      />
    ));
  } else if (competitionId === "wc2026") {
    content = (
      <>
        <Chip color="success" label="Classificado" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }} />
        <Chip color="warning" label="Melhor 3º" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }} />
        <Chip color="error" label="Eliminado" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }} />
      </>
    );
  } else if (format === "knockout") {
    // Pure knockout competitions (e.g. Copa do Brasil): no group standings, so
    // show a single informational chip.
    content = (
      <Chip color="primary" label="Fase eliminatória" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }} />
    );
  } else {
    content = (
      <>
        <Chip color="success" label="Classificado" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }} />
        <Chip color="error" label="Eliminado" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }} />
      </>
    );
  }

  return (
    <Card sx={CARD_SX}>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", justifyContent: "center" }}>
          {content}
        </Stack>
      </CardContent>
    </Card>
  );
}
