/**
 * ==========================================================
 * CLASSIFICAÇÃO
 * ==========================================================
 *
 * GET /standings
 * GET /standings/groups
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
 * MAPEIA DADOS PARA O FRONTEND
 * ==========================================================
 */
function formatStanding(team) {

  return {

    ...team,

    flag:
      team.teamCode
        ? `https://api.fifa.com/api/v3/picture/flags-sq-4/${team.teamCode}`
        : null

  };
}

/**
 * ==========================================================
 * TABELA COMPLETA
 * ==========================================================
 */
router.get(
  "/",
  async (req, res) => {

    try {

      const standings =
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

      const formattedStandings =

        standings.map(
          formatStanding
        );

      res.json(
        formattedStandings
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          "Erro ao buscar classificação"

      });

    }

  }
);

/**
 * ==========================================================
 * CLASSIFICAÇÃO AGRUPADA
 * ==========================================================
 *
 * Grupo A
 * Grupo B
 * Grupo C
 *
 * ==========================================================
 */
router.get(
  "/groups",
  async (req, res) => {

    try {

      const standings =
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

      const groups = {};

      for (
        const team
        of standings
      ) {

        const formattedTeam =
          formatStanding(
            team
          );

        if (
          !groups[
            formattedTeam.groupName
          ]
        ) {

          groups[
            formattedTeam.groupName
          ] = [];
        }

        groups[
          formattedTeam.groupName
        ].push(
          formattedTeam
        );
      }

      res.json(
        groups
      );

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          "Erro ao buscar grupos"

      });

    }

  }
);

module.exports =
  router;