/**
 * Copa do Brasil broadcast synchronisation.
 * Delegates to the generic CBF broadcast sync with the Copa do Brasil
 * competition id. Scrapes the CBF website for each match page.
 *
 * The CBF Copa do Brasil match-page URLs follow the pattern:
 *   /futebol-brasileiro/jogos/copa-do-brasil/masculino/2026/{home-slug}-x-{away-slug}/{match-id}
 *
 * The page embeds the broadcast channels in the React Server Components
 * payload under the `"canais"` field (comma-separated string), e.g.:
 *   "canais":"Amazon Prime, GE TV, Globo, Premiere, Sportv"
 */

const syncCbfBroadcasts = require("./syncCbfBroadcasts");

async function syncCopaDoBrasilBroadcasts() {
  return syncCbfBroadcasts("copadobrasil2026");
}

module.exports = syncCopaDoBrasilBroadcasts;
