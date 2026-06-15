const express =
  require("express");

const router =
  express.Router();

const prisma =
  require("../database/prisma");

/**
 * ==========================================================
 * FORMATA TIME
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

router.get(

  "/:letter",

  async (

    req,
    res

  ) => {

    try {

      const letter =

        req.params
          .letter
          .toUpperCase();

      const groupName =
        `Grupo ${letter}`;

      const standings =

        await prisma.standing.findMany({

          where: {

            groupName

          },

          orderBy: {

            position: "asc"

          }

        });

      const formattedStandings =

        standings.map(
          formatStanding
        );

      const matches =

        await prisma.match.findMany({

          where: {

            groupName

          },

          orderBy: {

            date: "asc"

          }

        });

      res.json({

        groupName,

        standings:
          formattedStandings,

        matches

      });

    } catch (

      error

    ) {

      console.error(
        error
      );

      res.status(500).json({

        error:
          "Erro ao buscar grupo"

      });

    }

  }

);

module.exports =
  router;