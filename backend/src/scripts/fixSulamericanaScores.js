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
      status: 0, // FINISHED
      OR: [
        { homeScore: null },
        { awayScore: null }
      ]
    },
    select: { id: true, homeTeam: true, awayTeam: true, homeScore: true, awayScore: true }
  });

  console.log(`Found ${matches.length} finished Sulamericana matches with missing scores`);

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

      if (fixture.homeScore == null || fixture.awayScore == null) {
        console.log(`  ⚠ No score on page for ${m.homeTeam} vs ${m.awayTeam}`);
        continue;
      }

      if (m.homeScore === fixture.homeScore && m.awayScore === fixture.awayScore) {
        continue; // Already correct
      }

      await prisma.match.update({
        where: { id: m.id },
        data: {
          homeScore: fixture.homeScore,
          awayScore: fixture.awayScore
        }
      });
      console.log(`  ✅ ${m.homeTeam} vs ${m.awayTeam}: ${fixture.homeScore} x ${fixture.awayScore}`);
      updated++;
    } catch (e) {
      console.log(`  ❌ Error scraping ${m.homeTeam} vs ${m.awayTeam}: ${e.message}`);
    }
  }

  console.log(`\nDone. Updated ${updated} matches.`);
  await prisma.$disconnect();
}

fixSulamericanaScores();
