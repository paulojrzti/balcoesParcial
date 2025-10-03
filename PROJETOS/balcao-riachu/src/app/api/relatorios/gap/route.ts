import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function buildDateWindow(d: Date) {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth(); // 0-11
  const day = d.getUTCDate();
  return {
    year: y,
    monthNumber: m + 1,
    day,
    monthStart: new Date(Date.UTC(y, m, 1, 0, 0, 0, 0)),
    dayEnd: new Date(Date.UTC(y, m, day, 23, 59, 59, 999)),
  };
}

type GapFilters = { categoriaIds?: number[] };

function round2(num: number) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

async function computeGap(target: Date, filters: GapFilters = {}) {
  const { year, monthNumber, day, monthStart, dayEnd } =
    buildDateWindow(target);
  const whereCategoria = filters.categoriaIds?.length
    ? { in: filters.categoriaIds }
    : undefined;

  // Metas acumuladas
  const metasMes = await prisma.metaMes.findMany({
    where: {
      ano: year,
      mes: monthNumber,
      ...(whereCategoria && { categoriaId: whereCategoria }),
    },
    include: {
      categoria: true, // <- já traz nome + tipo
      metasDia: { where: { dia: { lte: day } }, select: { valor: true } },
    },
  });

  const metaByCat = new Map<
    number,
    { nome: string; tipo: string; total: number }
  >();
  for (const mm of metasMes) {
    const soma = mm.metasDia.reduce((acc, m) => acc + (m.valor ?? 0), 0);
    const prev = metaByCat.get(mm.categoriaId)?.total ?? 0;
    metaByCat.set(mm.categoriaId, {
      nome: mm.categoria.nome,
      tipo: mm.categoria.tipo,
      total: prev + soma,
    });
  }

  // Vendas acumuladas
  const vendas = await prisma.venda.findMany({
    where: {
      data: { gte: monthStart, lte: dayEnd },
      ...(whereCategoria && { categoriaId: whereCategoria }),
    },
    include: { categoria: true },
  });

  const vendaByCat = new Map<
    number,
    { nome: string; tipo: string; total: number }
  >();
  for (const v of vendas) {
    const prev = vendaByCat.get(v.categoriaId)?.total ?? 0;
    vendaByCat.set(v.categoriaId, {
      nome: v.categoria.nome,
      tipo: v.categoria.tipo,
      total: prev + (v.valor ?? 0),
    });
  }

  // Unir
  const catIds = new Set<number>([...metaByCat.keys(), ...vendaByCat.keys()]);

  const result = Array.from(catIds).map((id) => {
    const meta = metaByCat.get(id);
    const venda = vendaByCat.get(id);

    const nome = meta?.nome ?? venda?.nome ?? "";
    const tipo = meta?.tipo ?? venda?.tipo ?? "UNITARIO"; // fallback
    const metaAcumulada = round2(meta?.total ?? 0);
    const vendaAcumulada = round2(venda?.total ?? 0);
    const gap = round2(metaAcumulada - vendaAcumulada);

    return {
      categoriaId: id,
      categoria: nome,
      tipo,
      metaAcumulada,
      vendaAcumulada,
      gap,
    };
  });

  result.sort((a, b) => a.categoria.localeCompare(b.categoria));
  return result;
}


function parseCategoriaIds(raw: string | null): number[] | undefined {
  if (!raw) return undefined;
  const ids = raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
  return ids.length ? ids : undefined;
}

export async function GET(req: NextRequest) {
  try {
    const dateParam = req.nextUrl.searchParams.get("date");
    const catParam = req.nextUrl.searchParams.get("categoriaId");
    const categoriaIds = parseCategoriaIds(catParam);

    const target = dateParam ? new Date(dateParam + "T00:00:00Z") : new Date();
    if (isNaN(target.getTime())) {
      return NextResponse.json(
        { error: "Parâmetro 'date' inválido (use YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const data = await computeGap(target, { categoriaIds });
    return NextResponse.json({ date: target.toISOString().slice(0, 10), data });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Falha ao gerar relatório de gap" },
      { status: 500 }
    );
  }
}

type GapPostBody = {
  date?: string;
  categoriaIds?: Array<number | string>;
  categoriaId?: string; // ex: "1,3,7"
};

export async function POST(req: NextRequest) {
  try {
    const body: GapPostBody = await req.json().catch(() => ({} as GapPostBody));

    const dateStr = body.date;

    const categoriaIds = Array.isArray(body.categoriaIds)
      ? body.categoriaIds
          .map((n) => (typeof n === "string" ? Number(n) : n))
          .filter((n): n is number => Number.isFinite(n))
      : parseCategoriaIds(
          typeof body.categoriaId === "string" ? body.categoriaId : null
        );

    const target = dateStr ? new Date(dateStr + "T00:00:00Z") : new Date();
    if (isNaN(target.getTime())) {
      return NextResponse.json(
        { error: "Campo 'date' inválido (use YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const data = await computeGap(target, { categoriaIds });
    return NextResponse.json({ date: target.toISOString().slice(0, 10), data });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Falha ao gerar relatório de gap" },
      { status: 500 }
    );
  }
}
