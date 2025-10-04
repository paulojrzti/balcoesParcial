import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";

// GET /api/vendas?ano=2025&mes=9
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ano = Number(searchParams.get("ano"));
  const mes = Number(searchParams.get("mes"));

  const filtro: { data?: { gte: Date; lt: Date } } = {};

  if (ano && mes) {
    filtro.data = {
      gte: new Date(ano, mes - 1, 1),
      lt: new Date(ano, mes, 1),
    };
  } else if (ano) {
    filtro.data = {
      gte: new Date(ano, 0, 1),
      lt: new Date(ano + 1, 0, 1),
    };
  }

  const vendas = await prisma.venda.findMany({
    where: filtro,
    include: { categoria: true },
    orderBy: { data: "desc" },
  });

  return NextResponse.json(vendas);
}

// POST /api/vendas
export async function POST(req: Request) {
  const body = await req.json();
  const { categoriaId, valor, data } = body;

  if (!categoriaId || valor == null) {
    return NextResponse.json(
      { error: "Categoria e valor são obrigatórios" },
      { status: 400 }
    );
  }

  const venda = await prisma.venda.create({
    data: {
      categoriaId,
      valor,
      data: data ? new Date(data) : undefined,
    },
  });

  return NextResponse.json(venda, { status: 201 });
}
