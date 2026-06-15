/**
 * ==========================================================
 * SINCRONIZAÇÃO DE JOGOS FIFA
 * ==========================================================
 *
 * Responsável por:
 *
 * - Buscar todos os jogos
 * - Salvar no banco
 * - Buscar transmissões
 * - Salvar transmissões
 * - Atualizar automaticamente
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
async function syncMatches() {

  try {

    console.log(
      "\n⚽ Iniciando sincronização FIFA..."
    );

    const matches =
      await fifaApi.getAllMatches();

    console.log(
      `📅 Total de jogos encontrados: ${matches.length}`
    );

    for (const match of matches) {

      const matchId =
        match.IdMatch;

      console.log(
        `➡ Processando ${matchId}`
      );

      /**
       * Árbitro
       */
      let referee = null;

      if (
        match.Officials &&
        match.Officials.length > 0
      ) {

        referee =
          match.Officials[0]
            ?.Name?.[0]
            ?.Description || null;
      }

      const homeTeam =
        match.Home
          ?.TeamName?.[0]
          ?.Description || null;

      const homeFlag =
        match.Home?.PictureUrl

          ?.replace(
            "{format}",
            "sq"
          )

          ?.replace(
            "{size}",
            "4"
          );


      const awayTeam =
        match.Away
          ?.TeamName?.[0]
          ?.Description || null;


      const awayFlag =
        match.Away?.PictureUrl

          ?.replace(
            "{format}",
            "sq"
          )

          ?.replace(
            "{size}",
            "4"
          );


      const homeCode =
        match.Home?.Abbreviation || null;

      const awayCode =
        match.Away?.Abbreviation || null;

      /**
       * Salva jogo
       */
      await prisma.match.upsert({

        where: {
          id: matchId
        },

        update: {

          competitionId:
            match.IdCompetition,

          seasonId:
            match.IdSeason,

          stageId:
            match.IdStage,

          groupId:
            match.IdGroup,

          groupName:
            match.GroupName?.[0]
              ?.Description || null,

          stageName:
            match.StageName?.[0]
              ?.Description || null,

          homeTeam,

          homeFlag,

          awayTeam,

          awayFlag,

          homeCode,

          awayCode,

          date:
            new Date(match.Date),

          stadium:
            match.Stadium?.Name?.[0]
              ?.Description || null,

          city:
            match.Stadium?.CityName?.[0]
              ?.Description || null,

          referee,

          attendance:
            match.Attendance,

          status:
            match.MatchStatus,

          homeScore:
            match.HomeTeamScore,

          awayScore:
            match.AwayTeamScore
        },

        create: {

          id: matchId,

          competitionId:
            match.IdCompetition,

          seasonId:
            match.IdSeason,

          stageId:
            match.IdStage,

          groupId:
            match.IdGroup,

          groupName:
            match.GroupName?.[0]
              ?.Description || null,

          stageName:
            match.StageName?.[0]
              ?.Description || null,

          homeTeam,

          homeFlag,

          awayTeam,

          awayFlag,

          homeCode,

          awayCode,

          date:
            new Date(match.Date),

          stadium:
            match.Stadium?.Name?.[0]
              ?.Description || null,

          city:
            match.Stadium?.CityName?.[0]
              ?.Description || null,

          referee,

          attendance:
            match.Attendance,

          status:
            match.MatchStatus,

          homeScore:
            match.HomeTeamScore,

          awayScore:
            match.AwayTeamScore
        }
      });

      /**
       * ======================================================
       * TRANSMISSÕES
       * ======================================================
       */
      try {

        const broadcasts =
          await fifaApi.getBroadcasts(
            match.IdSeason,
            matchId
          );

        /**
         * Remove canais antigos
         */
        await prisma.broadcast.deleteMany({
          where: {
            matchId
          }
        });

        /**
         * Insere novamente
         */
        for (
          const channel
          of broadcasts
        ) {

          await prisma.broadcast.create({

            data: {

              matchId,

              channelId:
                channel.IdChannel,

              name:
                channel.Name,

              logo:
                channel.Logo,

              url:
                channel.Url,

              language:
                channel.Language
            }
          });
        }

      } catch (error) {

        console.log(
          `⚠ Sem transmissões para ${matchId}`
        );
      }
    }

    console.log(
      "\n✅ Sincronização concluída\n"
    );

  } catch (error) {

    console.error(
      "❌ Erro na sincronização:",
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
  "* * * * *",
  syncMatches
);

syncMatches();

cron.schedule(
  "* * * * *",
  syncMatches
);
/**
 * ==========================================================
 * EXPORTA PARA EXECUÇÃO MANUAL
 * ==========================================================
 */


module.exports =
  syncMatches;
