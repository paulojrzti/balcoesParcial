import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/vendas/[id]
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const venda = await prisma.venda.findUnique({
    where: { id: Number(id) },
    include: { categoria: true },
  });

  if (!venda) {
    return NextResponse.json(
      { error: "Venda não encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json(venda);
}

// PUT /api/vendas/[id]
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await req.json();
  const { valor, data, categoriaId } = body as {
    valor: number;
    data?: string;
    categoriaId: number;
  };

  const venda = await prisma.venda.update({
    where: { id: Number(id) },
    data: {
      valor,
      data: data ? new Date(data) : undefined,
      categoriaId,
    },
  });

  return NextResponse.json(venda);
}

// DELETE /api/vendas/[id]
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  await prisma.venda.delete({
    where: { id: Number(id) },
  });

  return NextResponse.json({ message: "Venda removida com sucesso" });
}
