/**
 * Generic CBF website broadcast synchronisation.
 * Used by both the Brasileirão and the Copa do Brasil broadcast cron jobs —
 * the only difference is the `competitionId` filter.
 */

const prisma = require("../database/prisma");
const cbfScraper = require("../services/cbfScraper");

/**
 * Synchronise broadcasts for a given CBF competition, scraping each match
 * page and persisting the channel list to the `Broadcast` table.
 *
 * @param {string} competitionId — e.g. "brasileirao2026", "copadobrasil2026"
 */
async function syncCbfBroadcasts(competitionId) {
  try {
    console.log(`\n📺 [${competitionId}] Sincronizando transmissões...`);

    const dbMatches = await prisma.match.findMany({
      where: { competitionId },
      include: { broadcasts: true }
    });
    console.log(`[${competitionId}] ${dbMatches.length} partidas no banco de dados`);

    // The scraper needs the DB id and the competitionId to pick the right
    // CBF path prefix.
    const matchesForScraper = dbMatches.map((m) => ({
      id: m.id,
      competitionId: m.competitionId,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam
    }));

    const scraped = await cbfScraper.getAllBroadcasts(matchesForScraper);

    let created = 0;
    for (const item of scraped) {
      if (!item.broadcasts || item.broadcasts.length === 0) continue;

      // Replace existing broadcasts with the freshly scraped ones.
      await prisma.broadcast.deleteMany({ where: { matchId: item.matchId } });

      await prisma.broadcast.createMany({
        data: item.broadcasts.map((ch) => ({
          matchId: item.matchId,
          name: ch.name,
          logo: ch.logo || null,
          url: ch.url || null
        }))
      });

      created += item.broadcasts.length;
    }

    console.log(`✅ [${competitionId}] Transmissões: ${scraped.length} partidas correspondidas, ${created} canais criados\n`);
  } catch (error) {
    console.error(`❌ [${competitionId}] Erro ao sincronizar transmissões:`, error.message);
  }
}

module.exports = syncCbfBroadcasts;
