const express = require("express");
const cors = require("cors");

const prisma = require("./database/prisma");
const syncMatches = require("./cron/syncMatches");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Fut TV backend rodando"
  });
});

app.get("/matches", async (req, res) => {
  const matches = await prisma.match.findMany({
    orderBy: {
      date: "asc"
    },
    include: {
      broadcasts: true
    }
  });

  res.json(matches);
});

app.get("/standings", async (req, res) => {
  const standings = await prisma.standing.findMany({
    orderBy: [
      {
        groupName: "asc"
      },
      {
        position: "asc"
      }
    ]
  });

  res.json(standings);
});

app.get("/stages", async (req, res) => {
  const stages = await prisma.stage.findMany({
    orderBy: {
      sequence: "asc"
    }
  });

  res.json(stages);
});

syncMatches();

app.listen(PORT, () => {
  console.log(
    `Servidor rodando na porta ${PORT}`
  );
});
