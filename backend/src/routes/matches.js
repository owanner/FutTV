/**
 * ==========================================================
 * ROTAS DE PARTIDAS
 * ==========================================================
 *
 * Endpoints:
 *
 * GET /matches
 * GET /matches/upcoming
 * GET /matches/live
 * GET /matches/finished
 * GET /matches/:id
 *
 * ==========================================================
 */

const express =
  require("express");

const router =
  express.Router();

const prisma =
  require("../database/prisma");

const fifaApi =
 require("../services/fifaApi");

/**
 * ==========================================================
 * TODOS OS JOGOS
 * ==========================================================
 */
router.get(
  "/",
  async (req, res) => {

    try {

      const matches =
        await prisma.match.findMany({

          include: {
            broadcasts: true
          },

          orderBy: {
            date: "asc"
          }
        });

      res.json(matches);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error:
          "Erro ao buscar partidas"
      });
    }
  }
);

/**
 * ==========================================================
 * JOGOS FUTUROS
 * ==========================================================
 *
 * Status FIFA:
 *
 * 1 = agendado
 */
router.get(
  "/upcoming",
  async (req, res) => {

    try {

      const matches =
        await prisma.match.findMany({

          where: {
            status: 1
          },

          include: {
            broadcasts: true
          },

          orderBy: {
            date: "asc"
          }
        });

      res.json(matches);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error:
          "Erro ao buscar jogos futuros"
      });
    }
  }
);

/**
 * ==========================================================
 * JOGOS AO VIVO
 * ==========================================================
 *
 * Ainda vamos validar todos os
 * códigos da FIFA.
 *
 * Por enquanto:
 *
 * 3 = ao vivo
 */
router.get(
  "/live",
  async (req, res) => {

    try {

      const matches =
        await prisma.match.findMany({

          where: {
            status: 3
          },

          include: {
            broadcasts: true
          }
        });

      res.json(matches);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error:
          "Erro ao buscar jogos ao vivo"
      });
    }
  }
);

/**
 * ==========================================================
 * JOGOS FINALIZADOS
 * ==========================================================
 *
 * Pelo que observamos:
 *
 * 0 = encerrado
 */
router.get(
  "/finished",
  async (req, res) => {

    try {

      const matches =
        await prisma.match.findMany({

          where: {
            status: 0
          },

          include: {
            broadcasts: true
          },

          orderBy: {
            date: "desc"
          }
        });

      res.json(matches);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error:
          "Erro ao buscar resultados"
      });
    }
  }
);

/**
 * ==========================================================
 * DETALHES DE UMA PARTIDA
 * ==========================================================
 */
router.get(
  "/:id",
  async (req, res) => {

    try {

      const match =
        await prisma.match.findUnique({

          where: {
            id: req.params.id
          },

          include: {
            broadcasts: true
          }
        });

      if (!match) {

        return res.status(404).json({

          error:
            "Partida não encontrada"
        });
      }

      res.json(match);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error:
          "Erro ao buscar partida"
      });
    }
  }
);

/**
 * ==========================================================
 * DETALHES COMPLETOS DA PARTIDA
 * ==========================================================
 *
 * Busca:
 *
 * - banco local
 * - transmissões
 * - timeline
 * - dados ao vivo
 *
 * ==========================================================
 */
router.get(
  "/:id/details",
  async (req, res) => {

    try {

      const matchId =
        req.params.id;

      /**
       * Busca jogo local
       */
      const match =
        await prisma.match.findUnique({

          where: {
            id: matchId
          },

          include: {
            broadcasts: true
          }
        });

      if (!match) {

        return res.status(404).json({

          error:
            "Partida não encontrada"
        });
      }

      /**
       * Timeline FIFA
       */
      let timeline = null;

      /**
       * Dados ao vivo FIFA
       */
      let live = null;

      try {

        timeline =
          await fifaApi
            .getTimeline(
              matchId
            );

      } catch {

        timeline = null;
      }

      try {

        live =
          await fifaApi
            .getLive(
              matchId
            );

      } catch {

        live = null;
      }

      res.json({

        match,

        timeline,

        live
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          "Erro ao buscar detalhes"
      });
    }
  }
);

module.exports = router;