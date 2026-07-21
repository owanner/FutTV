import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";
import MainLayout from "../layouts/MainLayout";
import ErrorBoundary from "../components/ErrorBoundary/ErrorBoundary";

// Lazy-loaded pages for code splitting
const Home = lazy(() => import("../pages/Home/Home"));
const Matches = lazy(() => import("../pages/Matches/Matches"));
const Standings = lazy(() => import("../pages/Standings/Standings"));
const Bracket = lazy(() => import("../pages/Bracket/Bracket"));
const MatchDetails = lazy(() => import("../pages/MatchDetails/MatchDetails"));
const GroupDetails = lazy(() => import("../pages/GroupDetails/GroupDetails"));
const TeamDetails = lazy(() => import("../pages/TeamDetails/TeamDetails"));
const NotFound = lazy(() => import("../pages/NotFound/NotFound"));

/** Loading spinner shown while lazy pages load. */
function PageLoader() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
      <CircularProgress />
    </Box>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route element={<MainLayout />}>
            <Route
              path="/"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Home />
                </Suspense>
              }
            />
            <Route
              path="/matches"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Matches />
                </Suspense>
              }
            />
            <Route
              path="/standings"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Standings />
                </Suspense>
              }
            />
            <Route
              path="/bracket"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Bracket />
                </Suspense>
              }
            />
            <Route
              path="/match/:id"
              element={
                <Suspense fallback={<PageLoader />}>
                  <MatchDetails />
                </Suspense>
              }
            />
            <Route
              path="/group/:letter"
              element={
                <Suspense fallback={<PageLoader />}>
                  <GroupDetails />
                </Suspense>
              }
            />
            <Route
              path="/team/:code"
              element={
                <Suspense fallback={<PageLoader />}>
                  <TeamDetails />
                </Suspense>
              }
            />
            <Route
              path="*"
              element={
                <Suspense fallback={<PageLoader />}>
                  <NotFound />
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
