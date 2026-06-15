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

        height: "100vh",
background:
  "linear-gradient(135deg, #F8FAFC 0%, #EEF2F7 100%)",
        display: "flex",

        flexDirection: "column",

        overflow: "hidden"

      }}

    >

      <TopBar />

      <CompetitionBar />

      <Box

        component="main"

        sx={{

          flex: 1,

          overflowY: "auto",

          pb: "40px"

        }}

      >

        <Container

          maxWidth="lg"

          sx={{

            pt: 2,

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