import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, CssBaseline } from "@mui/material";
import App from "./App";
import theme from "./theme/theme";
import "./index.css";

/**
 * QueryClient with sensible defaults for a sports data app:
 * - staleTime: 30s — sports data changes frequently but not every second
 * - retry: 2 — avoid hammering the API on failures
 * - refetchOnWindowFocus: false — prevent unnecessary refetches
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 2,
      refetchOnWindowFocus: false
    }
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
