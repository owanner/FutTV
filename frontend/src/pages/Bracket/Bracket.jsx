import {
  Card,
  CardContent,
  Typography,
  Stack,
  Chip
} from "@mui/material";

import EmojiEventsIcon
from "@mui/icons-material/EmojiEvents";

export default function Bracket() {

  return (

    <Stack
      spacing={3}
    >

      <Card>

        <CardContent>

          <Stack

            spacing={2}

            alignItems="center"
          >

            <EmojiEventsIcon
              sx={{
                fontSize: 64
              }}
            />

            <Typography
              variant="h4"
            >
              Chaveamento
            </Typography>

            <Chip
              label="Em breve"
              color="primary"
            />

            <Typography

              textAlign="center"

              color="text.secondary"
            >

              O chaveamento oficial da Copa do Mundo FIFA 2026
              será disponibilizado conforme o avanço da competição.

            </Typography>

          </Stack>

        </CardContent>

      </Card>

      <Card>

        <CardContent>

          <Typography
            variant="h6"
            gutterBottom
          >
            O que estará disponível
          </Typography>

          <Typography>

            • 16avos de final

          </Typography>

          <Typography>

            • Oitavas de final

          </Typography>

          <Typography>

            • Quartas de final

          </Typography>

          <Typography>

            • Semifinais

          </Typography>

          <Typography>

            • Disputa de 3º lugar

          </Typography>

          <Typography>

            • Final

          </Typography>

        </CardContent>

      </Card>

    </Stack>
  );
}