import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Categorias iniciais
  const categorias = [
    { nome: "PL", tipo: "MONETARIO" },
    { nome: "VJ", tipo: "MONETARIO" },
    { nome: "VENDAS BELEZA", tipo: "MONETARIO" },
    { nome: "VENDAS ELETRONICOS", tipo: "MONETARIO" },
    { nome: "VENDAS RELOGIO", tipo: "MONETARIO" },
    { nome: "CARTAO", tipo: "UNITARIO" },
    { nome: "PLANO", tipo: "UNITARIO" },
    { nome: "SEGURO", tipo: "UNITARIO" },
  ];

  for (const c of categorias) {
    await prisma.categoria.upsert({
      where: { nome: c.nome },
      update: {},
      create: c,
    });
  }

  console.log("✅ Seed finalizado com categorias iniciais");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
