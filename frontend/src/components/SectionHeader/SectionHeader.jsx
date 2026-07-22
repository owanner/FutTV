import { Box, Chip, Stack, Typography } from "@mui/material";

/**
 * Consistent section header with accent bar, label, and optional count badge.
 *
 * Used across Home, Matches, and Standings pages for visual consistency.
 *
 * @param {Object} props
 * @param {string} props.label — section title
 * @param {number} [props.count] — optional count badge
 * @param {string} [props.accent] — accent bar color (defaults to primary.main)
 */
export default function SectionHeader({ label, count, accent }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
      <Box
        sx={{
          width: 4,
          height: 22,
          borderRadius: 2,
          bgcolor: accent || "primary.main"
        }}
      />
      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
        {label}
      </Typography>
      {count > 0 && (
        <Chip
          size="small"
          label={count}
          sx={{
            height: 22,
            fontSize: "0.7rem",
            fontWeight: 700,
            bgcolor: "grey.100"
          }}
        />
      )}
    </Stack>
  );
}
