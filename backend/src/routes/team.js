const express =
  require("express");

const router =
  express.Router();

const prisma =
  require("../database/prisma");

/**
 * ==========================================================
 * GET /team/:code
 * ==========================================================
 */
router.get(
  "/:code",
  async (req, res) => {

    try {

      const code =
        req.params.code.toUpperCase();

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

          orderBy: {

            date: "asc"

          }

        });

      const nextMatches =

        matches.filter(

          match =>
            match.status === 1

        );

      const finishedMatches =

        matches.filter(

          match =>
            match.status === 0

        );

      res.json({

        team: {

          ...standing,

          flag:
            `https://api.fifa.com/api/v3/picture/flags-sq-4/${code}`,

          status:

            standing.position <= 2

              ? "qualified"

              : standing.position === 3

              ? "playoff"

              : "eliminated"

        },

        nextMatches,

        finishedMatches

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

module.exports =
  router;