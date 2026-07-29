/**
 * Fut-TV API — Main entry point.
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cron = require("node-cron");

const prisma = require("./database/prisma");

const syncMatches = require("./cron/syncMatches");
const { refreshRecentFinishedScores } = require("./cron/syncMatches");
const { startMatchScheduler } = require("./cron/matchScheduler");
const syncStandings = require("./cron/syncStandings");
const syncLibertadoresBroadcasts = require("./cron/syncLibertadoresBroadcasts");
const syncBrasileiraoBroadcasts = require("./cron/syncBrasileiraoBroadcasts");
const syncCopaDoBrasilBroadcasts = require("./cron/syncCopaDoBrasilBroadcasts");

const competitionsRoutes = require("./routes/competitions");
const matchesRoutes = require("./routes/matches");
const standingsRoutes = require("./routes/standings");
const bracketRoutes = require("./routes/bracket");
const searchRoutes = require("./routes/search");
const teamsRoutes = require("./routes/teams");
const homeRoutes = require("./routes/home");
const groupRoutes = require("./routes/group");
const clubsRoutes = require("./routes/clubs");

const app = express();

const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : true;

app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());

function withGuard(fn) {
  let running = false;
  return async (...args) => {
    if (running) {
      console.log(`[cron] Skip — already running`);
      return;
    }
    running = true;
    try {
      await fn(...args);
    } catch (error) {
      console.error(`[cron] Unhandled error:`, error.message);
    } finally {
      running = false;
    }
  };
}

const guardedSyncMatches = withGuard(syncMatches);
const guardedSyncStandings = withGuard(syncStandings);
const guardedSyncLibertadoresBroadcasts = withGuard(syncLibertadoresBroadcasts);
const guardedSyncBrasileiraoBroadcasts = withGuard(syncBrasileiraoBroadcasts);
const guardedSyncCopaDoBrasilBroadcasts = withGuard(syncCopaDoBrasilBroadcasts);

// Full sync once at boot so the DB is warm; afterwards the scheduler takes over.
guardedSyncMatches();
guardedSyncStandings();
guardedSyncLibertadoresBroadcasts();
guardedSyncBrasileiraoBroadcasts();
guardedSyncCopaDoBrasilBroadcasts();

// Fix any Sulamericana matches stuck at 0x0 after boot
refreshRecentFinishedScores("sulamericana2026").catch(() => {});

// DB-driven match scheduler — replaces the old `*/5` cron for matches.
// Per-competition: 1 min while LIVE, 10 min <2h, hourly <24h, 2x/day <=5d, daily otherwise.
startMatchScheduler();

cron.schedule("4-59/15 * * * *", guardedSyncStandings);
cron.schedule("9-59/30 * * * *", guardedSyncLibertadoresBroadcasts);
cron.schedule("19-49/30 * * * *", guardedSyncBrasileiraoBroadcasts);
cron.schedule("14-44/30 * * * *", guardedSyncCopaDoBrasilBroadcasts);

app.get("/", (req, res) => {
  res.json({ app: "Fut-TV", status: "online" });
});

app.use("/competitions", competitionsRoutes);
app.use("/home", homeRoutes);
app.use("/matches", matchesRoutes);
app.use("/standings", standingsRoutes);
app.use("/bracket", bracketRoutes);
app.use("/search", searchRoutes);
app.use("/teams", teamsRoutes);
app.use("/group", groupRoutes);
app.use("/clubs", clubsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

app.use((err, req, res, next) => {
  console.error("❌ Erro não tratado:", err.message);
  res.status(500).json({ error: "Erro interno do servidor" });
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Fut-TV API iniciada na porta ${PORT}`);
});

async function shutdown(signal) {
  console.log(`\n${signal} recebido. Encerrando...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log("✅ Servidor encerrado");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
