import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";

// GET /api/metas → lista metas mensais (com filtros opcionais)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ano = searchParams.get("ano");
  const mes = searchParams.get("mes");
  const categoriaId = searchParams.get("categoriaId");

  const metas = await prisma.metaMes.findMany({
    where: {
      ano: ano ? Number(ano) : undefined,
      mes: mes ? Number(mes) : undefined,
      categoriaId: categoriaId ? Number(categoriaId) : undefined,
    },
    include: { metasDia: true, categoria: true },
  });

  return NextResponse.json(metas);
}

// POST /api/metas → cria meta mensal
export async function POST(req: Request) {
  const body = await req.json();
  const { categoriaId, ano, mes, valor } = body;

  const meta = await prisma.metaMes.create({
    data: {
      categoria: { connect: { id: categoriaId } },
      ano,
      mes,
      valor,
    },
  });

  return NextResponse.json(meta, { status: 201 });
}
