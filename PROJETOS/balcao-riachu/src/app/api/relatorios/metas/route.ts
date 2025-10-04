import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/relatorios/metas?ano=2025&mes=9&dia=15
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ano = Number(searchParams.get("ano"));
  const mes = Number(searchParams.get("mes"));
  const dia = searchParams.get("dia") ? Number(searchParams.get("dia")) : null;

  if (!ano || !mes) {
    return NextResponse.json({ error: "Informe ano e mes" }, { status: 400 });
  }

 const dataInicio = dia
   ? new Date(Date.UTC(ano, mes - 1, dia, 0, 0, 0))
   : new Date(Date.UTC(ano, mes - 1, 1, 0, 0, 0));

 const dataFim = dia
   ? new Date(Date.UTC(ano, mes - 1, dia + 1, 0, 0, 0))
   : new Date(Date.UTC(ano, mes, 1, 0, 0, 0));


  const metas = await prisma.metaMes.findMany({
    where: { ano, mes },
    include: {
      categoria: {
        include: {
          vendas: {
            where: {
              data: {
                gte: dataInicio,
                lt: dataFim,
              },
            },
          },
        },
      },
      metasDia: true,
    },
  });

  const resultado = metas.map((meta) => {
    const totalVendas = meta.categoria.vendas.reduce(
      (acc, v) => acc + v.valor,
      0
    );

    const valorMeta = dia
      ? meta.metasDia.find((d) => d.dia === dia)?.valor || 0
      : meta.valor;

    return {
      categoria: meta.categoria.nome,
      tipo: meta.categoria.tipo, // ✅ pega o tipo da categoria
      ano: meta.ano,
      mes: meta.mes,
      metaMensal: valorMeta,
      totalVendas,
      faltante: Math.max(valorMeta - totalVendas, 0),
      dias: meta.metasDia.map((d) => ({
        dia: d.dia,
        meta: d.valor,
      })),
    };
  });

  return NextResponse.json(resultado);
}
