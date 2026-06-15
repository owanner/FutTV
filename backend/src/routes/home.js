/**
 * ==========================================================
 * HOME ROUTE
 * ==========================================================
 *
 * Endpoint otimizado para a Home do Fut-TV.
 *
 * GET /home
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
 * HELPERS
 * ==========================================================
 */

function startOfToday() {

  const date =
    new Date();

  date.setHours(
    0,
    0,
    0,
    0
  );

  return date;
}

function endOfToday() {

  const date =
    new Date();

  date.setHours(
    23,
    59,
    59,
    999
  );

  return date;
}

function startOfTomorrow() {

  const date =
    new Date();

  date.setDate(
    date.getDate() + 1
  );

  date.setHours(
    0,
    0,
    0,
    0
  );

  return date;
}

function endOfTomorrow() {

  const date =
    new Date();

  date.setDate(
    date.getDate() + 1
  );

  date.setHours(
    23,
    59,
    59,
    999
  );

  return date;
}

/**
 * ==========================================================
 * GET /HOME
 * ==========================================================
 */
router.get(
  "/",
  async (req, res) => {

    try {

      const now =
        new Date();

      /**
       * ======================================================
       * JOGO EM DESTAQUE
       * ======================================================
       *
       * Prioridade:
       *
       * 1. Ao vivo
       * 2. Próximo jogo
       */
      let featuredMatch =
        await prisma.match.findFirst({

          where: {
            status: 3
          },

          include: {
            broadcasts: true
          }
        });

      if (!featuredMatch) {

        featuredMatch =
          await prisma.match.findFirst({

            where: {

              status: 1,

              date: {
                gte: now
              }
            },

            include: {
              broadcasts: true
            },

            orderBy: {
              date: "asc"
            }
          });
      }

      /**
       * ======================================================
       * AO VIVO
       * ======================================================
       */
      const liveMatches =
        await prisma.match.findMany({

          where: {
            status: 3
          },

          include: {
            broadcasts: true
          }
        });

      /**
       * ======================================================
       * JOGOS DE HOJE
       * ======================================================
       */
      const todayMatches =
        await prisma.match.findMany({

          where: {

            date: {

              gte:
                startOfToday(),

              lte:
                endOfToday()
            }
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
       * RESULTADOS DE HOJE
       * ======================================================
       */
      const todayResults =
        await prisma.match.findMany({

          where: {

            status: 0,

            date: {

              gte:
                startOfToday(),

              lte:
                endOfToday()
            }
          },

          orderBy: {
            date: "desc"
          }
        });

      /**
       * ======================================================
       * AMANHÃ
       * ======================================================
       */
      const tomorrowMatches =
        await prisma.match.findMany({

          where: {

            date: {

              gte:
                startOfTomorrow(),

              lte:
                endOfTomorrow()
            }
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
       * LÍDERES DOS GRUPOS
       * ======================================================
       */
      const groupLeaders =
        await prisma.standing.findMany({

          where: {
            position: 1
          },

          orderBy: {
            groupName: "asc"
          }
        });

      /**
       * ======================================================
       * RESPOSTA
       * ======================================================
       */
      res.json({

        generatedAt:
          new Date(),

        featuredMatch,

        liveMatches,

        todayMatches,

        todayResults,

        tomorrowMatches,

        groupLeaders
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          "Erro ao gerar Home"
      });
    }
  }
);

module.exports = router;