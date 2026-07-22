/**
 * ==========================================================
 * BRACKET ROUTES
 * ==========================================================
 *
 * GET /bracket
 *
 * ==========================================================
 */

const express =
  require("express");

const router =
  express.Router();

const bracketService =
  require(
    "../services/bracketService"
  );

/**
 * ==========================================================
 * RETORNA CHAVEAMENTO
 * ==========================================================
 */
router.get(
  "/",
  async (req, res) => {

    try {

      const competitionId =
        req.query.competitionId || undefined;

      const bracket =
        await bracketService
          .generateBracket(competitionId);

      res.json(bracket);

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          "Erro ao gerar chaveamento"
      });
    }
  }
);

module.exports = router;