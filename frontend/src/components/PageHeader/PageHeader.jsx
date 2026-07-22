import { Box, Stack, Typography } from "@mui/material";

/**
 * Consistent page header with competition accent bar, title, and optional filter slot.
 *
 * Used by Matches, Standings, and Bracket pages to match the Home page design language.
 *
 * @param {Object} props
 * @param {string} props.title — page title
 * @param {Object} [props.colors] — competition colors { primary, secondary, accent }
 * @param {React.ReactNode} [props.filters] — filter chips / controls rendered below the title
 * @param {React.ReactNode} [props.children] — additional content below filters
 */
export default function PageHeader({ title, colors, filters, children }) {
  const accent = colors?.primary || "#6366F1";

  return (
    <Stack spacing={2} sx={{ mb: 2 }}>
      {/* Accent bar */}
      <Box
        sx={{
          height: 4,
          borderRadius: 2,
          background: colors?.primary && colors?.secondary
            ? `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`
            : accent,
          mb: 0.5
        }}
      />

      {/* Title */}
      <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
        {title}
      </Typography>

      {/* Filter slot */}
      {filters && (
        <Box
          sx={{
            display: "flex",
            gap: 1,
            overflowX: "auto",
            pb: 0.5,
            "&::-webkit-scrollbar": { display: "none" },
            scrollbarWidth: "none"
          }}
        >
          {filters}
        </Box>
      )}

      {children}
    </Stack>
  );
}
