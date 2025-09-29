import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";

// POST /api/metas/dias → cria meta diária
export async function POST(req: Request) {
  const body = await req.json();
  const { metaMesId, dia, valor } = body;

  // Busca meta mensal e as diárias já cadastradas
  const metaMes = await prisma.metaMes.findUnique({
    where: { id: metaMesId },
    include: { metasDia: true },
  });

  if (!metaMes) {
    return NextResponse.json(
      { error: "Meta mensal não encontrada" },
      { status: 404 }
    );
  }

  // Soma as diárias já existentes + nova
  const soma = metaMes.metasDia.reduce((acc, d) => acc + d.valor, 0) + valor;

  if (soma > metaMes.valor) {
    return NextResponse.json(
      { error: "A soma das metas diárias ultrapassa o valor da meta mensal" },
      { status: 400 }
    );
  }

  const metaDia = await prisma.metaDia.create({
    data: { metaMesId, dia, valor },
  });

  return NextResponse.json(metaDia, { status: 201 });
}
