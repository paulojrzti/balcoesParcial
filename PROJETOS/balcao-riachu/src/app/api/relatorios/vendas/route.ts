import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";

// GET /api/relatorios/vendas?ano=2025&mes=9
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
  });

  const consolidado: Record<string, number> = {};
  vendas.forEach((v) => {
    consolidado[v.categoria.nome] =
      (consolidado[v.categoria.nome] || 0) + v.valor;
  });

  const resultado = Object.entries(consolidado).map(([categoria, total]) => ({
    categoria,
    total,
  }));

  return NextResponse.json(resultado);
}
