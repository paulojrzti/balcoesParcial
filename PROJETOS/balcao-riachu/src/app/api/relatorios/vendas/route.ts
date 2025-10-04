import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/relatorios/vendas?ano=2025&mes=9&dia=15
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ano = Number(searchParams.get("ano"));
  const mes = Number(searchParams.get("mes"));
  const dia = searchParams.get("dia") ? Number(searchParams.get("dia")) : null;

  if (!ano || !mes) {
    return NextResponse.json({ error: "Informe ano e mes" }, { status: 400 });
  }

  // ✅ use UTC para alinhar com o POST /api/vendas
  const dataInicio = new Date(Date.UTC(ano, mes - 1, dia || 1, 0, 0, 0, 0));
  const dataFim = dia
    ? new Date(Date.UTC(ano, mes - 1, (dia as number) + 1, 0, 0, 0, 0)) // próximo dia UTC
    : new Date(Date.UTC(ano, mes, 1, 0, 0, 0, 0)); // próximo mês UTC

  const vendas = await prisma.venda.findMany({
    where: {
      data: {
        gte: dataInicio,
        lt: dataFim,
      },
    },
    include: { categoria: true },
  });

  // Agrupar vendas por categoria
  const vendasPorCategoria: Record<
    number,
    {
      categoriaId: number;
      categoria: string;
      tipo: string;
      total: number;
      quantidade: number;
    }
  > = {};

  for (const v of vendas) {
    if (!vendasPorCategoria[v.categoriaId]) {
      vendasPorCategoria[v.categoriaId] = {
        categoriaId: v.categoriaId,
        categoria: v.categoria.nome,
        tipo: v.categoria.tipo,
        total: 0,
        quantidade: 0,
      };
    }
    vendasPorCategoria[v.categoriaId].total += v.valor ?? 0;
    vendasPorCategoria[v.categoriaId].quantidade += 1;
  }

  const resultado = Object.values(vendasPorCategoria);

  return NextResponse.json(resultado);
}
