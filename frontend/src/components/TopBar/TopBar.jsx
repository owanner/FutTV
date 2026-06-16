import {
  AppBar,
  Toolbar,
  Typography,
  Box
} from "@mui/material";

import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";

import { useNavigate } from "react-router-dom";

export default function TopBar() {

  const navigate = useNavigate();

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background:
          "linear-gradient(135deg, #111827 0%, #1F2937 100%)",
        borderBottom:
          "1px solid rgba(255,255,255,0.08)"
      }}

    >
      <Toolbar
        sx={{
          minHeight: {
            xs: 52,
            md: 62
          }
        }}
      >
        <Box
          onClick={() => navigate("/")}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,

            cursor: "pointer",
            userSelect: "none",

            "&:hover": {
              opacity: 0.9
            }
          }}
        >
          <SportsSoccerIcon
            sx={{
              fontSize: {
                xs: 22,
                md: 36
              }
            }}
          />

          <Typography
            sx={{
              fontSize: {
                xs: "1.1rem",
                md: "2.1rem"
              },
              fontWeight: 800,
              letterSpacing: -0.5
            }}
          >
            FuteTV
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
}