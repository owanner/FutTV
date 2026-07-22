import {
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
} from "@mui/material";

import { sortBroadcasts } from "../../utils/broadcasts.js";

export default function BroadcastList({ broadcasts }) {
  if (!broadcasts?.length) {
    return null;
  }

  const sortedBroadcasts = sortBroadcasts(broadcasts);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Onde assistir
        </Typography>

        <Stack spacing={1}>
          {sortedBroadcasts.map((channel) => (
            <Button
              key={channel.id}
              href={channel.url}
              target="_blank"
              variant="outlined"
              startIcon={
                channel.logo ? (
                  <img
                    src={channel.logo}
                    alt={channel.name}
                    style={{ width: 28, height: 18, objectFit: "contain" }}
                  />
                ) : null
              }
              sx={{
                justifyContent: "flex-start",
                textTransform: "none",
                py: 1.25,
              }}
            >
              {channel.name}
            </Button>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
