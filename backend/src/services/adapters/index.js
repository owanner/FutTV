/**
 * Competition Adapter Factory.
 * Returns the correct adapter instance for a given competition object.
 */

const CbfAdapter = require("./cbfAdapter");
const ConmebolAdapter = require("./conmebolAdapter");
const FootballDataAdapter = require("./footballDataAdapter");
const FifaAdapter = require("./fifaAdapter");

function getAdapter(comp) {
  switch (comp.apiProvider) {
    case "cbf":
      return new CbfAdapter(comp);
    case "conmebol":
      return new ConmebolAdapter(comp);
    case "football-data":
      return new FootballDataAdapter(comp);
    case "fifa":
      return new FifaAdapter(comp);
    default:
      throw new Error(`Unknown apiProvider: ${comp.apiProvider}`);
  }
}

module.exports = { getAdapter };
