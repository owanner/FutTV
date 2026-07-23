import { Stack, Card, CardContent, Chip } from "@mui/material";
import { CARD_SX, BRASILEIRAO_ZONES } from "../../utils/standingsUtils";

export default function LegendChips({ competitionId }) {
  return (
    <Card sx={CARD_SX}>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", justifyContent: "center" }}>
          {competitionId === "brasileirao2026"
            ? BRASILEIRAO_ZONES.map((zone) => (
                <Chip
                  key={zone.label}
                  label={zone.label}
                  sx={{
                    bgcolor: zone.color,
                    color: zone.color === "#193375" || zone.color === "#e53935" ? "white" : "black",
                    fontSize: { xs: "0.70rem", sm: "0.80rem" }
                  }}
                />
              ))
            : competitionId === "libertadores2026"
              ? (
                  <>
                    <Chip color="success" label="Classificado" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }} />
                    <Chip color="warning" label="Sulamericana" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }} />
                    <Chip color="error" label="Eliminado" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }} />
                  </>
                )
              : (
                  <>
                    <Chip color="success" label="Classificado" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }} />
                    <Chip color="warning" label="Melhor 3º" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }} />
                    <Chip color="error" label="Eliminado" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }} />
                  </>
                )
          }
        </Stack>
      </CardContent>
    </Card>
  );
}
