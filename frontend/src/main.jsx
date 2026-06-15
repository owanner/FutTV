import React from "react";
import ReactDOM from "react-dom/client";

import {

  QueryClient,

  QueryClientProvider

} from "@tanstack/react-query";

import {

  ThemeProvider,

  CssBaseline

} from "@mui/material";

import App from "./App";

import theme from "./theme/theme";

const queryClient =
  new QueryClient();

ReactDOM.createRoot(
  document.getElementById("root")
).render(

  <QueryClientProvider
    client={queryClient}
  >

    <ThemeProvider theme={theme}>

      <CssBaseline />

      <App />

    </ThemeProvider>

  </QueryClientProvider>
);