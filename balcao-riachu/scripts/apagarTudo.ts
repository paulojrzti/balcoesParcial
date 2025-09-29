// script/apagarTudo.ts
import { prisma } from "@/lib/prisma";

async function main() {
  await prisma.venda.deleteMany();
  await prisma.metaMes.deleteMany();
  await prisma.categoria.deleteMany();
}

main()
  .then(() => {
    console.log("Todos os dados foram apagados!");
  })
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
