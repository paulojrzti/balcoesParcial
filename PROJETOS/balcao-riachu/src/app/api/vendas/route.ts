import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { categoriaId, valor, data } = body;

  // 1️⃣ Validação inicial
  if (!categoriaId || valor == null || !data) {
    return NextResponse.json(
      { error: "Categoria, valor e data são obrigatórios" },
      { status: 400 }
    );
  }

  // 2️⃣ Cria o objeto Date e garante que seja válido
  const dataVenda = new Date(data);
  if (isNaN(dataVenda.getTime())) {
    return NextResponse.json(
      { error: "Data inválida. Use formato ISO: YYYY-MM-DD" },
      { status: 400 }
    );
  }

  // ⚙️ Normaliza a data para UTC (garante dia exato)
  dataVenda.setUTCHours(0, 0, 0, 0);

  // Intervalo de busca (mesmo dia)
  const inicioDoDiaUTC = new Date(dataVenda);
  const fimDoDiaUTC = new Date(dataVenda);
  fimDoDiaUTC.setUTCHours(23, 59, 59, 999);

  // 3️⃣ Busca venda existente para MESMO DIA e CATEGORIA
  const existente = await prisma.venda.findFirst({
    where: {
      categoriaId,
      data: {
        gte: inicioDoDiaUTC,
        lte: fimDoDiaUTC,
      },
    },
  });

  // 4️⃣ Atualiza ou cria sobrescrevendo o valor
  let venda;
  if (existente) {
    venda = await prisma.venda.update({
      where: { id: existente.id },
      data: {
        valor,
        data: dataVenda,
      },
    });
  } else {
    venda = await prisma.venda.create({
      data: {
        categoriaId,
        valor,
        data: dataVenda,
      },
    });
  }

  // 5️⃣ Retorna resposta
  return NextResponse.json(venda, { status: 201 });
}
