/**
 * ==========================================================
 * TEAMS ROUTES
 * ==========================================================
 *
 * GET /teams
 * GET /teams/:code
 *
 * ==========================================================
 */

const express =
  require("express");

const router =
  express.Router();

const prisma =
  require("../database/prisma");

/**
 * ==========================================================
 * LISTAR TODAS AS SELEÇÕES
 * ==========================================================
 *
 * Utilizado para:
 *
 * /teams
 *
 * ==========================================================
 */
router.get(
  "/",
  async (req, res) => {

    try {

      const teams =
        await prisma.standing.findMany({

          orderBy: [
            {
              groupName: "asc"
            },
            {
              position: "asc"
            }
          ]
        });

      res.json(teams);

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          "Erro ao buscar seleções"
      });
    }
  }
);

/**
 * ==========================================================
 * DETALHES DE UMA SELEÇÃO
 * ==========================================================
 *
 * Exemplo:
 *
 * /teams/BRA
 *
 * ==========================================================
 */
router.get(
  "/:code",
  async (req, res) => {

    try {

      const code =
        req.params.code
          .toUpperCase();

      /**
       * ======================================================
       * CLASSIFICAÇÃO
       * ======================================================
       */
      const standing =
        await prisma.standing.findFirst({

          where: {
            teamCode: code
          }
        });

      if (!standing) {

        return res.status(404).json({

          error:
            "Seleção não encontrada"
        });
      }

      /**
       * ======================================================
       * TODOS OS JOGOS DA SELEÇÃO
       * ======================================================
       */
      const matches =
        await prisma.match.findMany({

          where: {

            OR: [

              {
                homeCode: code
              },

              {
                awayCode: code
              }
            ]
          },

          include: {
            broadcasts: true
          },

          orderBy: {
            date: "asc"
          }
        });

      /**
       * ======================================================
       * PRÓXIMO JOGO
       * ======================================================
       */
      const nextMatch =
        matches.find(match => {

          return (
            match.date >
            new Date()
          );
        }) || null;

      /**
       * ======================================================
       * ÚLTIMO JOGO
       * ======================================================
       */
      const previousMatches =
        matches.filter(match => {

          return (
            match.date <
            new Date()
          );
        });

      const lastMatch =
        previousMatches.length > 0

          ? previousMatches[
              previousMatches.length - 1
            ]

          : null;

      /**
       * ======================================================
       * ESTATÍSTICAS
       * ======================================================
       */
      const stats = {

        played:
          standing.played,

        wins:
          standing.wins,

        draws:
          standing.draws,

        losses:
          standing.losses,

        goalsFor:
          standing.goalsFor,

        goalsAgainst:
          standing.goalsAgainst,

        goalDifference:
          standing.goalDifference,

        points:
          standing.points
      };

      /**
       * ======================================================
       * RESPOSTA
       * ======================================================
       */
      res.json({

        team: {

          code:
            standing.teamCode,

          name:
            standing.teamName
        },

        group: {

          id:
            standing.groupId,

          name:
            standing.groupName,

          position:
            standing.position
        },

        stats,

        nextMatch,

        lastMatch,

        matches
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          "Erro ao buscar seleção"
      });
    }
  }
);

module.exports = router;