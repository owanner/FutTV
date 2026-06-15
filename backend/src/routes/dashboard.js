/**
 * ==========================================================
 * DASHBOARD
 * ==========================================================
 *
 * Endpoint único para alimentar a Home do Fut-TV.
 *
 * GET /dashboard
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

function getStartOfToday() {

  const date = new Date();

  date.setHours(
    0,
    0,
    0,
    0
  );

  return date;
}

function getEndOfToday() {

  const date = new Date();

  date.setHours(
    23,
    59,
    59,
    999
  );

  return date;
}

function getStartOfTomorrow() {

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

function getEndOfTomorrow() {

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
 * DASHBOARD
 * ==========================================================
 */
router.get(
  "/",
  async (req, res) => {

    try {

      const todayStart =
        getStartOfToday();

      const todayEnd =
        getEndOfToday();

      const tomorrowStart =
        getStartOfTomorrow();

      const tomorrowEnd =
        getEndOfTomorrow();

      /**
       * ======================================================
       * AO VIVO
       * ======================================================
       *
       * Ainda estamos validando todos os códigos FIFA.
       *
       * Atualmente:
       * 3 = ao vivo
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
                todayStart,

              lte:
                todayEnd
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
                todayStart,

              lte:
                todayEnd
            }
          },

          include: {
            broadcasts: true
          },

          orderBy: {
            date: "desc"
          }
        });

      /**
       * ======================================================
       * JOGOS DE AMANHÃ
       * ======================================================
       */
      const tomorrowMatches =
        await prisma.match.findMany({

          where: {

            date: {

              gte:
                tomorrowStart,

              lte:
                tomorrowEnd
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
       * DESTAQUE PRINCIPAL
       * ======================================================
       *
       * Prioridade:
       *
       * 1. Jogo ao vivo
       * 2. Próximo jogo
       */
      let featuredMatch =
        null;

      if (
        liveMatches.length > 0
      ) {

        featuredMatch =
          liveMatches[0];

      } else {

        featuredMatch =
          await prisma.match.findFirst({

            where: {

              status: 1,

              date: {

                gte:
                  new Date()
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
       * DESTAQUES DA CLASSIFICAÇÃO
       * ======================================================
       *
       * Retorna apenas líderes.
       */
      const standingsHighlights =
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

        stats: {

          live:
            liveMatches.length,

          today:
            todayMatches.length,

          tomorrow:
            tomorrowMatches.length
        },

        featuredMatch,

        liveMatches,

        todayMatches,

        todayResults,

        tomorrowMatches,

        standingsHighlights
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({

        error:
          "Erro ao gerar dashboard"
      });
    }
  }
);

module.exports = router;