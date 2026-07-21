/**
 * Fut-TV API — Main entry point.
 *
 * Sets up Express, registers routes, starts cron jobs,
 * and handles graceful shutdown.
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cron = require("node-cron");

// Database
const prisma = require("./database/prisma");

// Cron jobs
const syncMatches = require("./cron/syncMatches");
const syncStandings = require("./cron/syncStandings");

// Routes
const matchesRoutes = require("./routes/matches");
const standingsRoutes = require("./routes/standings");
const bracketRoutes = require("./routes/bracket");
const searchRoutes = require("./routes/search");
const teamsRoutes = require("./routes/teams");
const homeRoutes = require("./routes/home");
const groupRoutes = require("./routes/group");

const app = express();

app.use(cors());
app.use(express.json());

/**
 * Run initial syncs on server start.
 * Errors are caught inside the sync functions.
 */
syncMatches();
syncStandings();

/**
 * Schedule recurring syncs.
 * - Matches: every 5 minutes (was incorrectly set to every minute with duplicates)
 * - Standings: every 15 minutes
 */
cron.schedule("*/5 * * * *", syncMatches);
cron.schedule("*/15 * * * *", syncStandings);

/**
 * Health check endpoint.
 */
app.get("/", (req, res) => {
  res.json({ app: "Fut-TV", status: "online" });
});

/**
 * API routes.
 */
app.use("/home", homeRoutes);
app.use("/matches", matchesRoutes);
app.use("/standings", standingsRoutes);
app.use("/bracket", bracketRoutes);
app.use("/search", searchRoutes);
app.use("/teams", teamsRoutes);
app.use("/group", groupRoutes);

/**
 * 404 handler for unmatched routes.
 */
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

/**
 * Global error handler.
 */
app.use((err, req, res, next) => {
  console.error("❌ Erro não tratado:", err.message);
  res.status(500).json({ error: "Erro interno do servidor" });
});

/**
 * Start server.
 */
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Fut-TV API iniciada na porta ${PORT}`);
});

/**
 * Graceful shutdown: close Prisma connection on SIGTERM/SIGINT.
 */
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
