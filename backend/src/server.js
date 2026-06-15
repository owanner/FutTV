/**
 * ==========================================================
 * FUT-TV API
 * ==========================================================
 *
 * Ponto de entrada principal.
 *
 * ==========================================================
 */

require("dotenv").config();

const express =
  require("express");

const cors =
  require("cors");

/**
 * ==========================================================
 * ROTAS
 * ==========================================================
 */
const syncStandings =
  require("./cron/syncStandings");

const matchesRoutes =
  require("./routes/matches");

const standingsRoutes =
  require("./routes/standings");

const bracketRoutes =
  require("./routes/bracket");

const dashboardRoutes =
  require("./routes/dashboard");

const searchRoutes =
  require("./routes/search");

const teamsRoutes =
  require("./routes/teams");

const homeRoutes =
  require("./routes/home");

const groupRoutes =
  require("./routes/group");

const teamRoutes =
  require("./routes/team");

/**
 * ==========================================================
 * CRONS
 * ==========================================================
 */

const syncMatches =
  require("./cron/syncMatches");

/**
 * ==========================================================
 * APP
 * ==========================================================
 */

const app =
  express();

app.use(cors());

app.use(express.json());

/**
 * ==========================================================
 * EXECUTA SINCRONIZAÇÃO
 * AO INICIAR O SERVIDOR
 * ==========================================================
 */

syncMatches();

syncStandings();

/**
 * ==========================================================
 * HEALTH CHECK
 * ==========================================================
 */
app.get(
  "/",
  (req, res) => {

    res.json({

      app: "Fut-TV",

      status: "online"
    });
  }
);

/**
 * ==========================================================
 * ROTAS API
 * ==========================================================
 */

app.use(
  "/matches",
  matchesRoutes
);

app.use(
  "/standings",
  standingsRoutes
);

app.use(
  "/bracket",
  bracketRoutes
);

app.use(
  "/dashboard",
  dashboardRoutes
);

app.use(
  "/search",
  searchRoutes
);

app.use(
  "/teams",
  teamsRoutes
);

app.use(
  "/home",
  homeRoutes
);

app.use(
  "/group",
  groupRoutes
);

app.use(
  "/team",
  teamRoutes
);

/**
 * ==========================================================
 * START
 * ==========================================================
 */

const PORT =
  process.env.PORT || 3000;

app.listen(
  PORT,
  () => {

    console.log(
      `🚀 Fut-TV API iniciada na porta ${PORT}`
    );
  }
);