import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";

// GET - obter categoria por ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const categoria = await prisma.categoria.findUnique({
      where: { id: Number(params.id) },
    });
    if (!categoria) {
      return NextResponse.json(
        { error: "Categoria não encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json(categoria);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar categoria" },
      { status: 500 }
    );
  }
}

// PUT - atualizar categoria
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { nome } = await req.json();
    const categoria = await prisma.categoria.update({
      where: { id: Number(params.id) },
      data: { nome },
    });
    return NextResponse.json(categoria);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao atualizar categoria" },
      { status: 500 }
    );
  }
}

// DELETE - remover categoria
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.categoria.delete({
      where: { id: Number(params.id) },
    });
    return NextResponse.json({ message: "Categoria deletada com sucesso" });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao deletar categoria" },
      { status: 500 }
    );
  }
}
