import { Box, Stack, Typography } from "@mui/material";

/**
 * Shared subcomponents for match hero displays.
 * Used by MatchHero and MatchDetailsHero to avoid duplication.
 */

/** Team flag badge with centered layout. */
export function TeamBlock({ flag, name }) {
  return (
    <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <Box
        sx={{
          width: { xs: 48, sm: 62 },
          height: { xs: 36, sm: 46 },
          mx: "auto",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          borderRadius: 1.5,
          backgroundColor: "rgba(255, 255, 255, 0.74)",
          border: "1px solid rgba(255, 255, 255, 0.72)",
          boxShadow: "0 10px 20px rgba(0, 74, 72, 0.12)"
        }}
      >
        <Box
          component="img"
          src={flag}
          alt={name || "Time"}
          sx={{ width: "72%", height: "72%", objectFit: "contain" }}
        />
      </Box>
    </Box>
  );
}

/** Team name label below the flag. */
export function TeamName({ name, fontSize = { xs: "0.75rem", sm: "0.95rem" } }) {
  return (
    <Typography
      variant="h6"
      sx={{
        width: "100%",
        textAlign: "center",
        fontSize,
        lineHeight: 1.15,
        overflowWrap: "anywhere",
        maxWidth: "100%",
        mx: "auto"
      }}
    >
      {name || "A definir"}
    </Typography>
  );
}

/** Info row with icon/logo and text — used for stadium, time, broadcasts. */
export function InfoItem({ icon, logo, children }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      sx={{ minWidth: 0, color: "rgba(255, 255, 255, 0.86)" }}
    >
      {logo ? (
        <Box
          component="img"
          src={logo}
          alt=""
          sx={{ width: 36, height: 20, objectFit: "contain", flexShrink: 0 }}
        />
      ) : (
        icon
      )}
      <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
        {children}
      </Typography>
    </Stack>
  );
}
