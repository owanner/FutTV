import { Box, Container } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";
import TopBar from "../components/TopBar/TopBar";
import CompetitionBar from "../components/CompetitionBar/CompetitionBar";
import BottomNav from "../components/BottomNav/BottomNav";

/**
 * Main application shell.
 * Uses React Router's Outlet for nested route rendering.
 * TopBar + CompetitionBar are sticky at the top, BottomNav is fixed at the bottom.
 *
 * The CompetitionBar is hidden on the Home page (/) since Home has its own
 * cross-competition filter chips and does not depend on a single active competition.
 */
export default function MainLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Sticky header */}
      <Box sx={{ position: "sticky", top: 0, zIndex: 1200 }}>
        <TopBar />
        {!isHome && <CompetitionBar />}
      </Box>

      {/* Scrollable content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          overflowX: "hidden"
        }}
      >
        <Container maxWidth="lg" sx={{ pt: 1.5, pb: 8 }}>
          <Outlet />
        </Container>
      </Box>

      <BottomNav />
    </Box>
  );
}
