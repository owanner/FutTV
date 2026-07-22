import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from "@mui/material";

import {
  Home,
  SportsSoccer,
} from "@mui/icons-material";

import { useLocation } from "react-router-dom";

import useNav from "../../hooks/useNav";

export default function BottomNav() {
  const navigate = useNav();
  const location = useLocation();

  return (
    <Paper
      elevation={3}
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        pb: "env(safe-area-inset-bottom)",
        backdropFilter: "blur(12px)",
        backgroundColor: "rgba(255,255,255,0.85)",
      }}
    >
      <BottomNavigation
        value={location.pathname}
        onChange={(_event, value) => {
          navigate(value);
        }}
        showLabels
      >
        <BottomNavigationAction
          value="/"
          label="Home"
          icon={<Home />}
        />
        <BottomNavigationAction
          value="/competitions"
          label="Competições"
          icon={<SportsSoccer />}
        />
      </BottomNavigation>
    </Paper>
  );
}
