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
                fontSize: 56
              }}
            />

            <Typography
                sx={{
                  fontSize: {
                    xs: "1.5rem",
                    sm: "1.7rem",
                    md: "1.9rem"
                  },
                  fontWeight: 700,
                  lineHeight: 1.1
                }}
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
            sx={{
                  fontSize: {
                    xs: "1.0rem",
                    sm: "1.1rem",
                    md: "1.3rem"
                  },
                  fontWeight: 700,
                  lineHeight: 1.1
                }}
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