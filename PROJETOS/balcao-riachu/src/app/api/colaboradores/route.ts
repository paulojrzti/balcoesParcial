// src/app/api/colaboradores/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/colaboradores?q=ana&page=1&pageSize=20
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.min(
      100,
      Math.max(1, Number(searchParams.get("pageSize") || 20))
    );
    const skip = (page - 1) * pageSize;

    const where = q
      ? { nome: { contains: q, mode: "insensitive" as const } }
      : {};

    const [total, items] = await Promise.all([
      prisma.colaborador.count({ where }),
      prisma.colaborador.findMany({
        where,
        orderBy: { id: "desc" },
        skip,
        take: pageSize,
        select: { id: true, nome: true },
      }),
    ]);

    return NextResponse.json({
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      items,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao listar colaboradores" },
      { status: 500 }
    );
  }
}

// POST /api/colaboradores  { nome: "Ana" }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const nome = (body?.nome || "").trim();

    if (!nome) {
      return NextResponse.json(
        { error: "Campo 'nome' é obrigatório." },
        { status: 400 }
      );
    }

    const created = await prisma.colaborador.create({
      data: { nome },
      select: { id: true, nome: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error(err);
    // conflito por nome igual? (se você colocar @@unique em nome)
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe um colaborador com esse nome." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Erro ao criar colaborador." },
      { status: 500 }
    );
  }
}
