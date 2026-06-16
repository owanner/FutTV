import {
  Box,
  Container
} from "@mui/material";

import TopBar
  from "../components/TopBar/TopBar";

import CompetitionBar
  from "../components/CompetitionBar/CompetitionBar";

import BottomNav
  from "../components/BottomNav/BottomNav";

export default function MainLayout({
  children
}) {
  return (
<Box
  sx={{
    minHeight: "100dvh",
    display: "flex",
    flexDirection: "column",
    overflowX: "clip",
    background:
      "linear-gradient(135deg, #F8FAFC 0%, #EEF2F7 100%)"
  }}
>
<Box
  sx={{
    position: "sticky",
    top: 0,
    zIndex: 1200
  }}
>
        <TopBar />
        <CompetitionBar />

        </Box>

      {/* Conteúdo */}
      <Box
        component="main"
        sx={{
          flex: 1,

          overflowX: "hidden",

          pb: {
            xs: "72px",
            md: 3
          }
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            pt: 1.5,
            pb: 3
          }}
        >
          {children}
        </Container>
      </Box>

      <BottomNav />
    </Box>
  );
}