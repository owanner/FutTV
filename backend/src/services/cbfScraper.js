/**
 * CBF website scraper.
 * Extracts broadcast (canais) data from individual match pages.
 *
 * The CBF website embeds match data as JSON in the React Server Components payload.
 * The "canais" field contains a comma-separated string of broadcast channels.
 *
 * URL pattern:
 * /futebol-brasileiro/jogos/campeonato-brasileiro/serie-a/2026/{home-slug}-x-{away-slug}/{match-id}
 */

const axios = require("axios");
const { normalizeText } = require("../utils/textUtils");

const CBF_WEBSITE_BASE = "https://www.cbf.com.br/futebol-brasileiro/jogos/campeonato-brasileiro/serie-a/2026";
const REQUEST_TIMEOUT_MS = 10000;
const REQUEST_DELAY_MS = 200;

/**
 * Convert a team name to a URL-friendly slug.
 * Handles accents, special characters, and common CBF naming conventions.
 */
function slugifyTeamName(name) {
  if (!name) return "";
  return normalizeText(name)
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Scrape a single CBF match page and extract the broadcast channels.
 * Returns an array of channel name strings, or empty array if not found.
 */
async function scrapeMatchPage(matchId, homeSlug, awaySlug) {
  const url = `${CBF_WEBSITE_BASE}/${homeSlug}-x-${awaySlug}/${matchId}`;

  try {
    const { data: html } = await axios.get(url, {
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9"
      },
      httpsAgent: new (require("https").Agent)({ rejectUnauthorized: false })
    });

    // Extract canais from React Server Components payload
    const pattern = /canais[\\"]+:[\\"]+([^\\"]+)/;
    const match = html.match(pattern);
    if (!match || !match[1]) return [];

    return match[1]
      .split(",")
      .map(ch => ch.trim())
      .filter(ch => ch.length > 0);
  } catch (error) {
    console.warn(`  ⚠ Erro ao acessar página do jogo ${matchId}: ${error.message}`);
    return [];
  }
}

/**
 * Scrape broadcast data for all provided matches.
 * Each match should have { id, homeTeam, awayTeam }.
 * Returns array of { matchId, broadcasts: [{ name }] }.
 */
async function getAllBroadcasts(matches) {
  console.log(`[CBF] Raspando páginas de jogos para transmissões...`);

  const results = [];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const homeSlug = slugifyTeamName(match.homeTeam);
    const awaySlug = slugifyTeamName(match.awayTeam);

    // Extract numeric ID from "cbf_832121" format
    const numericId = match.id.replace("cbf_", "");
    const channels = await scrapeMatchPage(numericId, homeSlug, awaySlug);

    if (channels.length > 0) {
      results.push({
        matchId: match.id,
        broadcasts: channels.map(name => ({ name }))
      });
    }

    if (i < matches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS));
    }
  }

  console.log(`[CBF] ${results.length} jogos com transmissões encontradas`);
  return results;
}

module.exports = { slugifyTeamName, scrapeMatchPage, getAllBroadcasts };
