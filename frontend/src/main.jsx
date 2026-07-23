import React, { useMemo } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { BrowserRouter } from "react-router-dom";
import { CompetitionProvider, useCompetition } from "./contexts/CompetitionContext";
import createCompetitionTheme from "./theme/createCompetitionTheme";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 2,
      refetchOnWindowFocus: true,
      refetchInterval: 60 * 1000
    }
  }
});

/**
 * Inner wrapper that reads the current competition and provides a dynamic theme.
 * BrowserRouter must live outside this so CompetitionProvider can use useSearchParams.
 */
function ThemedApp() {
  const { competition } = useCompetition();
  const theme = useMemo(() => createCompetitionTheme(competition), [competition]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CompetitionProvider>
          <ThemedApp />
        </CompetitionProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
