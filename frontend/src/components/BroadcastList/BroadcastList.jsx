import { Card, CardContent, Typography, Stack, Chip, Box } from "@mui/material";
import TvIcon from "@mui/icons-material/Tv";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { sortBroadcasts } from "../../utils/broadcasts.js";

export default function BroadcastList({ broadcasts, colors }) {
  if (!broadcasts?.length) return null;

  const sorted = sortBroadcasts(broadcasts);

  return (
    <Card
      sx={{
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider"
      }}
    >
      <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1.5 }}>
          <TvIcon sx={{ fontSize: 18, color: colors?.primary || "primary.main" }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Onde assistir
          </Typography>
        </Stack>

        <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: "wrap" }}>
          {sorted.map((channel) => (
            <Chip
              key={channel.id}
              icon={
                channel.logo ? (
                  <Box
                    component="img"
                    src={channel.logo}
                    alt={channel.name}
                    loading="lazy"
                    sx={{ width: 16, height: 16, ml: 0.5 }}
                  />
                ) : undefined
              }
              label={
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <span>{channel.name}</span>
                  {channel.url && <OpenInNewIcon sx={{ fontSize: 12, opacity: 0.5 }} />}
                </Stack>
              }
              href={channel.url || undefined}
              target={channel.url ? "_blank" : undefined}
              rel={channel.url ? "noopener noreferrer" : undefined}
              clickable={!!channel.url}
              sx={{
                height: 28,
                fontSize: "0.75rem",
                fontWeight: 600,
                bgcolor: "grey.50",
                border: "1px solid",
                borderColor: "grey.200",
                "&:hover": { bgcolor: "grey.100" }
              }}
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
