/**
 * ==========================================================
 * SEARCH
 * ==========================================================
 *
 * GET /search?q=brasil
 *
 * Busca:
 *
 * - Times
 * - Partidas
 * - Grupos
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
 * SEARCH
 * ==========================================================
 */
router.get(
  "/",
  async (req, res) => {

    try {

      const query =
        req.query.q;

      /**
       * Não pesquisar vazio
       */
      if (
        !query ||
        query.trim() === ""
      ) {

        return res.json({

          query,

          teams: [],

          matches: [],

          groups: []
        });
      }

      /**
       * ======================================================
       * TIMES
       * ======================================================
       *
       * Busca na classificação
       */
      const teams =
        await prisma.standing.findMany({

          where: {

            OR: [

              {
                teamName: {

                  contains: query.trim()
                }
              },

              {
                teamCode: {

                  contains:
                    query.toUpperCase()
                }
              }
            ]
          },

          orderBy: {

            teamName:
              "asc"
          }
        });

      /**
       * ======================================================
       * PARTIDAS
       * ======================================================
       */
      const matches =
        await prisma.match.findMany({

          where: {

            OR: [

              {
                homeTeam: {

                  contains:
                    query.trim()
                }
              },

              {
                awayTeam: {

                  contains:
                    query.trim()
                }
              },

              {
                groupName: {

                  contains:
                    query.trim()
                }
              },

              {
                stageName: {

                  contains:
                    query.trim()
                }
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
       * GRUPOS
       * ======================================================
       */
      const groups =
        await prisma.standing.findMany({

          where: {

            groupName: {

              contains:
                query.trim()
            }
          },

          orderBy: [

            {
              groupName:
                "asc"
            },

            {
              position:
                "asc"
            }
          ]
        });

      /**
       * ======================================================
       * RESPOSTA
       * ======================================================
       */
      res.json({

        query,

        teams,

        matches,

        groups
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          "Erro ao pesquisar"
      });
    }
  }
);

module.exports = router;