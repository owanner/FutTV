import {

  BrowserRouter,

  Routes,

  Route

} from "react-router-dom";

import MainLayout
  from "../layouts/MainLayout";

import Home
  from "../pages/Home/Home";

import Matches
  from "../pages/Matches/Matches";

import Standings
  from "../pages/Standings/Standings";

import Bracket
  from "../pages/Bracket/Bracket";

import MatchDetails
  from "../pages/MatchDetails/MatchDetails";


import GroupDetails
  from "../pages/GroupDetails/GroupDetails";

import TeamDetails
  from "../pages/TeamDetails/TeamDetails";


export default function AppRoutes() {

  return (

    <BrowserRouter>

      <MainLayout>

        <Routes>

          <Route

            path="/"

            element={<Home />}
          />

          <Route

            path="/matches"

            element={<Matches />}
          />

          <Route

            path="/standings"

            element={<Standings />}
          />

          <Route

            path="/bracket"

            element={<Bracket />}
          />

          <Route

            path="/match/:id"

            element={
              <MatchDetails />
            }
          />

          <Route

            path="/group/:letter"

            element={
              <GroupDetails />
            }

          />

          <Route

            path="/team/:code"

            element={
              <TeamDetails />
            }

          />

        </Routes>

      </MainLayout>

    </BrowserRouter>
  );
}