require("dotenv").config();
const prisma = require("./src/database/prisma");
const cbfApi = require("./src/services/cbfApi");
const syncCbfBroadcasts = require("./src/cron/syncCbfBroadcasts");

(async () => {
  const comp = {
    id: "copadobrasil2026",
    name: "Copa do Brasil 2026",
    config: { cbfCompetitionId: "1260615", footballDataLeagueId: null, footballDataSeason: 2026 }
  };
  console.log("=== STEP 1: sync matches for Copa do Brasil ===");
  const matches = await cbfApi.getMatches(comp.config.cbfCompetitionId);
  console.log("CBF API returned", matches.length, "matches");
  let upserted = 0;
  for (const m of matches) {
    const matchId = `cbf_${m.id_jogo}`;
    const existing = await prisma.match.findUnique({ where: { id: matchId }, select: { manuallyAdjusted: true } });
    if (existing?.manuallyAdjusted) continue;
    const matchData = cbfApi.buildMatchData(m, comp.id, "2026");
    await prisma.match.upsert({ where: { id: matchId }, update: matchData, create: { id: matchId, ...matchData } });
    upserted++;
  }
  console.log("Upserted", upserted, "matches");

  console.log("\n=== STEP 2: sync broadcasts for Copa do Brasil (upcoming only, for speed) ===");
  const dbMatches = await prisma.match.findMany({
    where: { competitionId: "copadobrasil2026", status: 1 },
    include: { broadcasts: true },
    orderBy: { date: "asc" }
  });
  console.log("Upcoming matches to scrape broadcasts for:", dbMatches.length);

  // Lightweight, targeted scrap (only upcoming) for verification.
  for (const m of dbMatches) {
    const numericId = m.id.replace("cbf_", "");
    const homeSlug = require("./src/services/cbfScraper").slugifyTeamName(m.homeTeam);
    const awaySlug = require("./src/services/cbfScraper").slugifyTeamName(m.awayTeam);
    const channels = await require("./src/services/cbfScraper").scrapeMatchPage(numericId, homeSlug, awaySlug, m.competitionId);
    if (channels.length > 0) {
      await prisma.broadcast.deleteMany({ where: { matchId: m.id } });
      await prisma.broadcast.createMany({
        data: channels.map(name => ({ matchId: m.id, name, logo: null, url: null }))
      });
    }
    await new Promise(r => setTimeout(r, 150));
  }

  console.log("\n=== STEP 3: verify broadcasts stored ===");
  const withBroadcasts = await prisma.match.findMany({
    where: { competitionId: "copadobrasil2026", status: 1 },
    include: { broadcasts: true },
    orderBy: { date: "asc" }
  });
  const populated = withBroadcasts.filter(m => m.broadcasts.length > 0);
  console.log("Upcoming matches with broadcasts:", populated.length, "/", withBroadcasts.length);
  populated.forEach(m => {
    console.log(`  ${m.id} | ${m.homeTeam} x ${m.awayTeam} | ${m.stageName} | channels: [${m.broadcasts.map(b => b.name).join(", ")}]`);
  });
  await prisma.$disconnect();
})().catch(e => { console.error("ERR:", e); process.exit(1); });
