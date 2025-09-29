import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ id: string }>;
};

// GET - obter meta por ID
export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params;

  const meta = await prisma.metaMes.findUnique({
    where: { id: Number(id) },
    include: { metasDia: true, categoria: true },
  });

  if (!meta) {
    return NextResponse.json({ error: "Meta não encontrada" }, { status: 404 });
  }

  return NextResponse.json(meta);
}

// PUT - atualizar meta
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { valor } = body;

  const meta = await prisma.metaMes.update({
    where: { id: Number(id) },
    data: { valor },
  });

  return NextResponse.json(meta);
}

// DELETE - remover meta
export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params;

  await prisma.metaMes.delete({
    where: { id: Number(id) },
  });

  return NextResponse.json({ message: "Meta removida com sucesso" });
}
