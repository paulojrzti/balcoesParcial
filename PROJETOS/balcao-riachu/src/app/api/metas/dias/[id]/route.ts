import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // ✅ precisa dar await
  const body = await req.json();
  const { valor } = body as { valor: number };

  const metaDiaExistente = await prisma.metaDia.findUnique({
    where: { id: Number(id) },
    include: { metaMes: { include: { metasDia: true } } },
  });

  if (!metaDiaExistente) {
    return NextResponse.json(
      { error: "Meta diária não encontrada" },
      { status: 404 }
    );
  }

  const { metaMes } = metaDiaExistente;

  // Soma todas as diárias, substituindo o valor da atual
  const soma = metaMes.metasDia.reduce((acc, d) => {
    if (d.id === metaDiaExistente.id) {
      return acc + valor; // novo valor
    }
    return acc + d.valor;
  }, 0);

  if (soma > metaMes.valor) {
    return NextResponse.json(
      { error: "A soma das metas diárias ultrapassa o valor da meta mensal" },
      { status: 400 }
    );
  }

  const metaDia = await prisma.metaDia.update({
    where: { id: Number(id) },
    data: { valor },
  });

  return NextResponse.json(metaDia);
}
