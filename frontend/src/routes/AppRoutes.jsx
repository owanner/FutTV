import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import ErrorBoundary from "../components/ErrorBoundary/ErrorBoundary";
import { PageLoader } from "../components/PageLoader/PageLoader";

const Home = lazy(() => import("../pages/Home/Home"));
const Competitions = lazy(() => import("../pages/Competitions/Competitions"));
const CompetitionDetail = lazy(() => import("../pages/CompetitionDetail/CompetitionDetail"));
const Matches = lazy(() => import("../pages/Matches/Matches"));
const Standings = lazy(() => import("../pages/Standings/Standings"));
const Bracket = lazy(() => import("../pages/Bracket/Bracket"));
const MatchDetails = lazy(() => import("../pages/MatchDetails/MatchDetails"));
const GroupDetails = lazy(() => import("../pages/GroupDetails/GroupDetails"));
const TeamDetails = lazy(() => import("../pages/TeamDetails/TeamDetails"));
const NotFound = lazy(() => import("../pages/NotFound/NotFound"));

function withSuspense(Component) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={withSuspense(Home)} />
        <Route path="/competitions" element={withSuspense(Competitions)} />
        <Route path="/competitions/:id" element={withSuspense(CompetitionDetail)} />
        <Route path="/matches" element={withSuspense(Matches)} />
        <Route path="/standings" element={withSuspense(Standings)} />
        <Route path="/bracket" element={withSuspense(Bracket)} />
        <Route path="/match/:id" element={withSuspense(MatchDetails)} />
        <Route path="/group/:letter" element={withSuspense(GroupDetails)} />
        <Route path="/team/:code" element={withSuspense(TeamDetails)} />
        <Route path="*" element={withSuspense(NotFound)} />
      </Route>
    </Routes>
  );
}
