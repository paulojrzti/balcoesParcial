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

  // Busca metas do mês
  const metas = await prisma.metaMes.findMany({
    where: { ano, mes },
    include: {
      categoria: true, // só traz info da categoria
      metasDia: true, // metas diárias
    },
  });

  const resultado = metas.map((meta) => {
    // Se for consulta de dia específico, pega meta do dia
    const valorMeta = dia
      ? meta.metasDia.find((d) => d.dia === dia)?.valor || 0
      : meta.valor;

    return {
      categoriaId: meta.categoriaId,
      categoria: meta.categoria.nome,
      tipo: meta.categoria.tipo,
      ano: meta.ano,
      mes: meta.mes,
      metaMensal: valorMeta,
      dias: meta.metasDia.map((d) => ({
        dia: d.dia,
        meta: d.valor,
      })),
    };
  });

  return NextResponse.json(resultado);
}
