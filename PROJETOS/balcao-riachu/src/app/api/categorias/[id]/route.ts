import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ id: string }>;
};

// GET - obter categoria por ID
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params; // 👈 precisa dar await agora

  try {
    const categoria = await prisma.categoria.findUnique({
      where: { id: Number(id) },
    });

    if (!categoria) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(categoria);
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar categoria" },
      { status: 500 }
    );
  }
}

// PUT - atualizar categoria
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    const { nome } = await req.json();

    const categoria = await prisma.categoria.update({
      where: { id: Number(id) },
      data: { nome },
    });

    return NextResponse.json(categoria);
  } catch {
    return NextResponse.json(
      { error: "Erro ao atualizar categoria" },
      { status: 500 }
    );
  }
}

// DELETE - remover categoria
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    await prisma.categoria.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: "Categoria deletada com sucesso" });
  } catch {
    return NextResponse.json(
      { error: "Erro ao deletar categoria" },
      { status: 500 }
    );
  }
}
