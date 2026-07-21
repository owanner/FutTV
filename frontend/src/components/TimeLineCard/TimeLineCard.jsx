import {
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
} from "@mui/material";

export default function TimeLineCard({ events }) {

  // Segurança total

  if (!events) {
    return null;
  }

  // FIFA retorna Event (singular)

  const timeline = Array.isArray(events.Event)
    ? events.Event
    : [];

  // Apenas eventos importantes

  const importantEvents = timeline.filter((event) =>
    [0, 2, 3, 5, 71].includes(event.Type)
  );

  if (!importantEvents.length) {
    return null;
  }

  const getIcon = (type) => {
    switch (type) {
      case 0:
        return "⚽";

      case 2:
        return "🟨";

      case 3:
        return "🟥";

      case 5:
        return "🔄";

      case 71:
        return "🎥";

      default:
        return "•";
    }
  };

  return (
    <Card>
      <CardContent>

        <Typography
          variant="h6"
          gutterBottom
        >
          Eventos Importantes
        </Typography>

        <Stack spacing={2}>

          {importantEvents.map((event) => (

            <Card
              key={event.EventId}
              variant="outlined"
            >

              <CardContent>

                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <Typography variant="h6">
                    {getIcon(event.Type)}
                  </Typography>

                  <Chip
                    label={event.MatchMinute}
                    size="small"
                  />

                  <Typography fontWeight={600}>
                    {
                      event.TypeLocalized?.[0]
                        ?.Description
                    }
                  </Typography>

                </Stack>

                <Typography sx={{ mt: 1 }}>
                  {
                    event.EventDescription?.[0]
                      ?.Description
                  }
                </Typography>

              </CardContent>

            </Card>

          ))}

        </Stack>

      </CardContent>
    </Card>
  );
}
