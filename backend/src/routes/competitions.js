/**
 * Competitions route.
 *
 * GET /competitions — list available competitions
 */

const express = require("express");
const router = express.Router();
const { getAllCompetitions } = require("../config/competitions");

router.get("/", (req, res) => {
  res.json(getAllCompetitions());
});

module.exports = router;
