import {
  BottomNavigation,
  BottomNavigationAction,
  Paper
} from "@mui/material";

import {
  Home,
  SportsSoccer,
  TableChart,
  AccountTree
} from "@mui/icons-material";

import {
  useLocation,
  useNavigate
} from "react-router-dom";

export default function BottomNav() {

  const navigate =
    useNavigate();

  const location =
    useLocation();

  return (

    <Paper

      elevation={3}

      sx={{

        position: "fixed",

        bottom: 0,

        left: 0,

        right: 0,

        pb: "env(safe-area-inset-bottom)",

        backdropFilter:
          "blur(12px)",

        backgroundColor:
          "rgba(255,255,255,0.85)"

      }}

    >

      <BottomNavigation

        value={
          location.pathname
        }

        onChange={(
          event,
          value
        ) => {

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

          value="/matches"

          label="Jogos"

          icon={<SportsSoccer />}

        />

        <BottomNavigationAction

          value="/standings"

          label="Tabela"

          icon={<TableChart />}

        />

        <BottomNavigationAction

          value="/bracket"

          label="Fase Final"

          icon={<AccountTree />}

        />

      </BottomNavigation>

    </Paper>

  );
}