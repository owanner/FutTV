/**
 * Bracket route.
 * GET /bracket?competitionId=wc2026
 */

const express = require("express");
const router = express.Router();
const bracketService = require("../services/bracketService");
const { setCacheHeaders, getCachedOrFetch } = require("../utils/routeHelpers");

router.get("/", async (req, res) => {
  try {
    setCacheHeaders(res, 60, 300);
    await getCachedOrFetch(req, res, async () => {
      const competitionId = req.query.competitionId || undefined;
      return bracketService.generateBracket(competitionId);
    }, 60_000);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao gerar chaveamento" });
  }
});

module.exports = router;
