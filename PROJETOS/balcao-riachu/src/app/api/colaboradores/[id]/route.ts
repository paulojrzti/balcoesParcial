// src/app/api/colaboradores/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseId(param: string | null): number | null {
  if (!param) return null;
  const n = Number(param);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// GET /api/colaboradores/123
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseId(params?.id);
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  try {
    const item = await prisma.colaborador.findUnique({
      where: { id },
      select: { id: true, nome: true },
    });
    if (!item)
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    return NextResponse.json(item);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao buscar colaborador" },
      { status: 500 }
    );
  }
}

// PUT/PATCH /api/colaboradores/123  { nome: "Novo Nome" }
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return updateHandler(req, params);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return updateHandler(req, params);
}

async function updateHandler(req: NextRequest, params: { id: string }) {
  const id = parseId(params?.id);
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  try {
    const body = await req.json().catch(() => ({}));
    const nome = body?.nome?.trim();

    if (!nome) {
      return NextResponse.json(
        { error: "Campo 'nome' é obrigatório." },
        { status: 400 }
      );
    }

    const updated = await prisma.colaborador.update({
      where: { id },
      data: { nome },
      select: { id: true, nome: true },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error(err);
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "Já existe um colaborador com esse nome." },
        { status: 409 }
      );
    }
    if (err.code === "P2025") {
      return NextResponse.json(
        { error: "Colaborador não encontrado." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Erro ao atualizar colaborador." },
      { status: 500 }
    );
  }
}

// DELETE /api/colaboradores/123
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseId(params?.id);
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  try {
    // Se quiser soft delete, adicione um campo isActive no modelo e troque por update.
    // Aqui é delete "hard":
    await prisma.colaborador.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    if (err.code === "P2025") {
      return NextResponse.json(
        { error: "Colaborador não encontrado." },
        { status: 404 }
      );
    }
    // Caso seu banco tenha FK de vendas/alocações, o delete pode falhar (P2003).
    if (err.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "Não é possível remover: colaborador referenciado em vendas ou rateios.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Erro ao excluir colaborador." },
      { status: 500 }
    );
  }
}
