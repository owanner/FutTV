import { Box, Card, CardActionArea, CardContent, Stack, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { getAllCompetitions } from "../../config/competitions";
import useNav from "../../hooks/useNav";

export default function Competitions() {
  const navigate = useNav();
  const allCompetitions = getAllCompetitions();

  return (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
        Competições
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
          gap: 2
        }}
      >
        {allCompetitions.map((c) => (
          <Card
            key={c.id}
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              overflow: "hidden",
              transition: "transform .18s ease, box-shadow .18s ease",
              "&:hover": {
                transform: "translateY(-3px)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.10)"
              }
            }}
          >
            {/* Color band */}
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
                    <ArrowForwardIcon sx={{ color: "text.secondary", mt: 0.5 }} />
                  </Stack>

                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 0.5 }}>
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
                      Jogos · Classificação · Transmissões
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Stack>
  );
}
