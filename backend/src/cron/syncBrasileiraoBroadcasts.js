/**
 * Brasileirão broadcast synchronization.
 * Scrapes CBF website for broadcast data and matches it to existing DB records.
 */

const prisma = require("../database/prisma");
const cbfScraper = require("../services/cbfScraper");

async function syncBrasileiraoBroadcasts() {
  try {
    console.log("\n📺 [Brasileirão] Sincronizando transmissões...");

    const dbMatches = await prisma.match.findMany({
      where: { competitionId: "brasileirao2026" },
      include: { broadcasts: true }
    });
    console.log(`[Brasileirão] ${dbMatches.length} partidas no banco de dados`);

    const scraped = await cbfScraper.getAllBroadcasts(dbMatches);

    let created = 0;

    for (const item of scraped) {
      if (!item.broadcasts || item.broadcasts.length === 0) continue;

      // Delete existing broadcasts and recreate
      await prisma.broadcast.deleteMany({ where: { matchId: item.matchId } });

      await prisma.broadcast.createMany({
        data: item.broadcasts.map(ch => ({
          matchId: item.matchId,
          name: ch.name,
          logo: null,
          url: null
        }))
      });

      created += item.broadcasts.length;
    }

    console.log(`✅ [Brasileirão] Transmissões: ${scraped.length} partidas correspondidas, ${created} canais criados\n`);
  } catch (error) {
    console.error("❌ [Brasileirão] Erro ao sincronizar transmissões:", error.message);
  }
}

module.exports = syncBrasileiraoBroadcasts;
