/**
 * Brasileirão broadcast synchronisation.
 * Delegates to the generic CBF broadcast sync with the Brasileirão
 * competition id. Scrapes the CBF website for each match page.
 */

const syncCbfBroadcasts = require("./syncCbfBroadcasts");

async function syncBrasileiraoBroadcasts() {
  return syncCbfBroadcasts("brasileirao2026");
}

module.exports = syncBrasileiraoBroadcasts;
