/**
 * One-time fix: Re-scrape all finished Sulamericana matches to populate scores.
 * The CONMEBOL pages contain scores in the HTML but the scraper wasn't extracting them.
 */

require("dotenv").config();

const prisma = require("../database/prisma");
const conmebolScraper = require("../services/conmebolScraper");

async function fixSulamericanaScores() {
  const matches = await prisma.match.findMany({
    where: {
      competitionId: "sulamericana2026",
      date: { lt: new Date() },
      OR: [
        { homeScore: null },
        { awayScore: null },
        { status: 1 }
      ]
    },
    select: { id: true, homeTeam: true, awayTeam: true, homeScore: true, awayScore: true, date: true }
  });

  console.log(`Found ${matches.length} past Sulamericana matches to fix/update`);

  let updated = 0;
  for (const m of matches) {
    // Extract fixture ID from match ID (format: conmebol_sudamericana_XXXX)
    const fixtureId = m.id.replace("conmebol_sudamericana_", "");
    try {
      const fixture = await conmebolScraper.scrapeFixturePage(fixtureId, "sudamericana", {
        expectedCompetitionId: "102"
      });
      if (!fixture) {
        console.log(`  ⚠ Could not scrape fixture ${fixtureId} (${m.homeTeam} vs ${m.awayTeam})`);
        continue;
      }

      const now = new Date();
      const twoHours = 2 * 60 * 60 * 1000;
      const isFinished = fixture.fixtureDate ? fixture.fixtureDate.getTime() + twoHours < now.getTime() : true;
      const status = isFinished ? 0 : 3;

      await prisma.match.update({
        where: { id: m.id },
        data: {
          homeScore: fixture.homeScore,
          awayScore: fixture.awayScore,
          status
        }
      });
      console.log(`  ✅ ${m.homeTeam} vs ${m.awayTeam}: ${fixture.homeScore ?? "?"} x ${fixture.awayScore ?? "?"} (status: ${status})`);
      updated++;
    } catch (e) {
      console.log(`  ❌ Error scraping ${m.homeTeam} vs ${m.awayTeam}: ${e.message}`);
    }
  }

  console.log(`\nDone. Updated ${updated} matches.`);
  await prisma.$disconnect();
}

fixSulamericanaScores();
