/**
 * Libertadores broadcast synchronization.
 * Scrapes gol.conmebol.com for broadcast data and matches it to existing DB records.
 */

const prisma = require("../database/prisma");
const conmebolScraper = require("../services/conmebolScraper");
const { normalizeText } = require("../utils/textUtils");

/**
 * Try to match a scraped CONMEBOL match to a DB match by team names + date proximity.
 * Score: 2 per team name match + up to 3 for date proximity. Minimum 3 to accept.
 */
function findBestMatch(scraped, dbMatches) {
  if (!scraped.homeTeam || !scraped.awayTeam) return null;

  const scrapedHome = normalizeText(scraped.homeTeam);
  const scrapedAway = normalizeText(scraped.awayTeam);
  const scrapedDate = scraped.fixtureDate instanceof Date ? scraped.fixtureDate : null;

  let bestMatch = null;
  let bestScore = 0;

  for (const dbMatch of dbMatches) {
    const dbHome = normalizeText(dbMatch.homeTeam || "");
    const dbAway = normalizeText(dbMatch.awayTeam || "");

    let score = 0;

    // Bidirectional substring match for team names (skip empty/null teams)
    if (scrapedHome && dbHome && (scrapedHome.includes(dbHome) || dbHome.includes(scrapedHome))) score += 2;
    if (scrapedAway && dbAway && (scrapedAway.includes(dbAway) || dbAway.includes(scrapedAway))) score += 2;

    // Fuzzy match: try last meaningful word (e.g. "tolima" from "cd tolima" vs "deportes tolima")
    if (score < 4) {
      const scrapedHomeLast = scrapedHome.split(/\s+/).pop();
      const dbHomeLast = dbHome.split(/\s+/).pop();
      const scrapedAwayLast = scrapedAway.split(/\s+/).pop();
      const dbAwayLast = dbAway.split(/\s+/).pop();

      if (scrapedHomeLast && dbHomeLast && scrapedHomeLast === dbHomeLast) score += 1;
      if (scrapedAwayLast && dbAwayLast && scrapedAwayLast === dbAwayLast) score += 1;
    }

    // Date proximity bonus
    if (scrapedDate && dbMatch.date) {
      const diffHours = Math.abs(scrapedDate - new Date(dbMatch.date)) / (1000 * 60 * 60);
      if (diffHours < 24) score += 1;
      if (diffHours < 3) score += 2;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = dbMatch;
    }
  }

  return bestScore >= 3 ? bestMatch : null;
}

async function syncLibertadoresBroadcasts() {
  try {
    console.log("\n📺 [Libertadores] Sincronizando transmissões...");

    const scraped = await conmebolScraper.getAllBroadcasts();
    console.log(`[Libertadores] ${scraped.length} partidas com transmissões raspadas`);

    const dbMatches = await prisma.match.findMany({
      where: { competitionId: "libertadores2026" },
      include: { broadcasts: true }
    });
    console.log(`[Libertadores] ${dbMatches.length} partidas no banco de dados`);

    let matched = 0;
    let unmatched = 0;
    let created = 0;

    for (const item of scraped) {
      if (!item.broadcasts || item.broadcasts.length === 0) continue;

      const dbMatch = findBestMatch(item, dbMatches);
      if (!dbMatch) {
        unmatched++;
        console.log(`⚠ Sem correspondência: ${item.homeTeam} vs ${item.awayTeam} (${item.fixtureDate?.toISOString()?.split("T")[0] || "?"})`);
        continue;
      }

      matched++;

      // Delete existing broadcasts and recreate
      await prisma.broadcast.deleteMany({ where: { matchId: dbMatch.id } });

      await prisma.broadcast.createMany({
        data: item.broadcasts.map(ch => ({
          matchId: dbMatch.id,
          name: ch.name,
          logo: ch.logo,
          url: ch.url
        }))
      });

      created += item.broadcasts.length;
    }

    console.log(`✅ [Libertadores] Transmissões: ${matched} partidas correspondidas, ${unmatched} sem correspondência, ${created} canais criados\n`);
  } catch (error) {
    console.error("❌ [Libertadores] Erro ao sincronizar transmissões:", error.message);
  }
}

module.exports = syncLibertadoresBroadcasts;
