import {
  Box,
  Typography
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export default function CompetitionBar({
  competition = "Copa do Mundo 2026",
  multipleCompetitions = false
}) {
  return (
    <Box
      sx={{
            height: {
      xs: 32,
      md: 42
    },

        background:
          "linear-gradient(90deg,#3558A8 0%, #C94848 50%, #2F8A54 100%)",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        boxShadow:
          "0 4px 12px rgba(0,0,0,.08)"
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",

          gap: 0.5,

          px: 2,
          py: 0.75,

          borderRadius: 99,

          cursor: multipleCompetitions
            ? "pointer"
            : "default",

          transition: "0.2s",

          "&:hover": multipleCompetitions
            ? {
              backgroundColor:
                "rgba(15,118,110,0.06)"
            }
            : {}
        }}
      >
        <Typography
          sx={{
            color: "#fff",
            fontWeight: 800,
            fontSize: "1.0rem",
            letterSpacing: ".03em"
          }}
        >
          {competition}
        </Typography>

        {multipleCompetitions && (
          <ExpandMoreIcon
            fontSize="small"
          />
        )}
      </Box>
    </Box>
  );
}