import { Card, CardContent, Typography, Stack, Chip } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

import { useCompetition } from "../../contexts/CompetitionContext";

export default function Bracket() {
  const { competition } = useCompetition();

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Stack spacing={2} alignItems="center">
            <EmojiEventsIcon sx={{ fontSize: 56 }} />
            <Typography variant="h5" fontWeight={700} lineHeight={1.1}>
              Chaveamento
            </Typography>
            <Chip label="Em breve" color="primary" />
            <Typography textAlign="center" color="text.secondary">
              O chaveamento oficial da {competition.name} será
              disponibilizado conforme o avanço da competição.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={700}>
            O que estará disponível
          </Typography>
          <Typography>• 16avos de final</Typography>
          <Typography>• Oitavas de final</Typography>
          <Typography>• Quartas de final</Typography>
          <Typography>• Semifinais</Typography>
          <Typography>• Disputa de 3º lugar</Typography>
          <Typography>• Final</Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}
