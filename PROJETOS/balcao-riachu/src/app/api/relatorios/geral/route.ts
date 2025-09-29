import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";

// GET /api/relatorios/geral?ano=2025&mes=9
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ano = Number(searchParams.get("ano"));
  const mes = Number(searchParams.get("mes"));

  if (!ano || !mes) {
    return NextResponse.json({ error: "Informe ano e mes" }, { status: 400 });
  }

  // metas do mês
  const metas = await prisma.metaMes.findMany({
    where: { ano, mes },
    include: { categoria: true },
  });

  const totalMeta = metas.reduce((acc, m) => acc + m.valor, 0);

  // vendas do mês
  const vendas = await prisma.venda.findMany({
    where: {
      data: {
        gte: new Date(ano, mes - 1, 1),
        lt: new Date(ano, mes, 1),
      },
    },
  });

  const totalVendas = vendas.reduce((acc, v) => acc + v.valor, 0);

  const resultado = {
    metas: {
      totalMensal: totalMeta,
      atingido: totalVendas,
      faltante: Math.max(totalMeta - totalVendas, 0),
      percentual:
        totalMeta > 0 ? Math.round((totalVendas / totalMeta) * 100) : 0,
    },
    vendas: {
      quantidade: vendas.length,
      valorTotal: totalVendas,
    },
  };

  return NextResponse.json(resultado);
}
