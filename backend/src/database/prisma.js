// Cria apenas uma conexão com o banco
// para reutilizar em toda aplicação.

const {
  PrismaClient
} = require("@prisma/client");

const prisma =
  new PrismaClient();

module.exports =
  prisma;