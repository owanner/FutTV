/**
 * ==========================================================
 * SINCRONIZAÇÃO DE CLASSIFICAÇÃO FIFA
 * ==========================================================
 *
 * Busca a classificação oficial da FIFA
 * e salva na tabela Standing.
 *
 * ==========================================================
 */

const cron = require("node-cron");

const prisma =
  require("../database/prisma");

const fifaApi =
  require("../services/fifaApi");

/**
 * ==========================================================
 * SINCRONIZAÇÃO PRINCIPAL
 * ==========================================================
 */
async function syncStandings() {

  try {

    console.log(
      "\n📊 Sincronizando classificação..."
    );

    const standings =
      await fifaApi.getStandings();

    console.log(
      `${standings.length} registros encontrados`
    );

    /**
     * Remove classificação antiga
     */
    await prisma.standing.deleteMany();

    /**
     * Salva novamente
     */
    for (const team of standings) {

      /**
       * Nome do grupo
       */
      const groupName =
        team.Group?.[0]
          ?.Description ||
        "Grupo desconhecido";

      /**
       * Nome do time
       */
      const teamName =
        team.Team?.Name?.[0]
          ?.Description ||
        "Time desconhecido";

      /**
       * Sigla
       */
      const teamCode =
        team.Team?.Abbreviation ||
        null;

      await prisma.standing.create({

        data: {

          groupId:
            team.IdGroup,

          groupName,

          teamId:
            team.IdTeam,

          teamName,

          teamCode,

          position:
            team.Position || 0,

          played:
            team.Played || 0,

          wins:
            team.Won || 0,

          draws:
            team.Drawn || 0,

          losses:
            team.Lost || 0,

          goalsFor:
            team.For || 0,

          goalsAgainst:
            team.Against || 0,

          goalDifference:
            team.GoalsDiference || 0,

          points:
            team.Points || 0
        }
      });
    }

    console.log(
      "✅ Classificação atualizada\n"
    );

  } catch (error) {

    console.error(
      "❌ Erro ao sincronizar classificação:"
    );

    console.error(
      error.message
    );
  }
}

/**
 * ==========================================================
 * EXECUTA A CADA 15 MINUTOS
 * ==========================================================
 */
cron.schedule(
  "*/15 * * * *",
  syncStandings
);

/**
 * ==========================================================
 * EXPORT
 * ==========================================================
 */
module.exports =
  syncStandings;