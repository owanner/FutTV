/**
 * CONMEBOL Libertadores scraper.
 * Extracts broadcast data from gol.conmebol.com fixture pages.
 * Broadcast data is not available via any free API.
 *
 * Approach: scan fixture IDs directly (the tournament page loads via
 * client-side JS, so cheerio can't parse it). Individual fixture pages
 * contain broadcast data in static HTML.
 */

const axios = require("axios");
const cheerio = require("cheerio");

const BASE_URL = "https://gol.conmebol.com";
const BATCH_SIZE = 10;
const REQUEST_TIMEOUT_MS = 6000;

/**
 * Try to fetch a single fixture page and extract match + broadcast data.
 * Returns null if the page doesn't exist or has no team data.
 */
async function scrapeFixturePage(fixtureId) {
  const url = `${BASE_URL}/libertadores/pt-br/fixture/view/${fixtureId}`;
  const { data: html } = await axios.get(url, {
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "Accept-Language": "pt-BR,pt;q=0.9"
    }
  });

  const $ = cheerio.load(html);

  // Extract metadata from Drupal settings JSON
  const scriptTag = $('script[data-drupal-selector="drupal-settings-json"]');
  if (!scriptTag.length) return null;

  const settings = JSON.parse(scriptTag.html());
  const targeting = settings?.metadata?.targeting;
  if (!targeting?.fixture_home_team_title || !targeting?.fixture_away_team_title) return null;

  // Extract broadcasts from the page
  const broadcasts = [];
  $(".m-broadcast-list__item").each((_, el) => {
    const name = $(el).find("img").attr("alt") || $(el).find("a").text().trim();
    if (name && name !== "Social / Facebook" && name !== "Unknown") {
      broadcasts.push({
        name,
        logo: $(el).find("img").attr("src") || null,
        url: $(el).find("a").attr("href") || null
      });
    }
  });

  // fixture_date is a Unix timestamp in seconds
  const fixtureDate = typeof targeting.fixture_date === "number"
    ? new Date(targeting.fixture_date * 1000)
    : null;

  return {
    conmebolFixtureId: fixtureId,
    homeTeam: targeting.fixture_home_team_title,
    awayTeam: targeting.fixture_away_team_title,
    fixtureDate,
    externalId: targeting.external_id || null,
    stageName: targeting.fixture_stage_title || null,
    venue: targeting.relations?.cc_venue_vocab?.[0]?.label || null,
    broadcasts
  };
}

/**
 * Discover all valid fixture IDs by scanning a range in parallel batches.
 * Returns only pages that have valid team metadata.
 */
async function discoverFixtureIds(startId = 1500, endId = 1800) {
  const results = [];

  for (let batchStart = startId; batchStart <= endId; batchStart += BATCH_SIZE) {
    const ids = [];
    for (let id = batchStart; id < batchStart + BATCH_SIZE && id <= endId; id++) {
      ids.push(id);
    }

    const batch = ids.map(id =>
      scrapeFixturePage(id).then(data => (data ? { id, ...data } : null)).catch(() => null)
    );

    const batchResults = await Promise.all(batch);
    for (const result of batchResults) {
      if (result) results.push(result);
    }
  }

  return results;
}

/**
 * Scrape broadcast data for all Libertadores matches.
 * Returns only matches that have at least one broadcast channel.
 */
async function getAllBroadcasts() {
  console.log("[Conmebol] Scanning fixture pages for broadcast data...");
  const allFixtures = await discoverFixtureIds();
  console.log(`[Conmebol] Found ${allFixtures.length} valid fixtures`);

  const withBroadcasts = allFixtures.filter(f => f.broadcasts.length > 0);
  console.log(`[Conmebol] ${withBroadcasts.length} fixtures have broadcast data`);

  return withBroadcasts;
}

module.exports = { scrapeFixturePage, discoverFixtureIds, getAllBroadcasts };
