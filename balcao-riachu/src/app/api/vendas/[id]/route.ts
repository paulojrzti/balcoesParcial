import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/vendas/[id]
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const venda = await prisma.venda.findUnique({
    where: { id: Number(params.id) },
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
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { valor } = body;

  const venda = await prisma.venda.update({
    where: { id: Number(params.id) },
    data: {
      valor: Number(valor),
    },
  });

  return NextResponse.json(venda);
}

// DELETE /api/vendas/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await prisma.venda.delete({
    where: { id: Number(params.id) },
  });

  return NextResponse.json({ message: "Venda removida com sucesso" });
}