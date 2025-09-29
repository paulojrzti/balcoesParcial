import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - listar todas as categorias
export async function GET() {
  try {
    const categorias = await prisma.categoria.findMany({
      orderBy: { id: "asc" },
    });
    return NextResponse.json(categorias);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar categorias" },
      { status: 500 }
    );
  }
}

// POST - criar nova categoria
export async function POST(req: Request) {
  try {
    const { nome, tipo } = await req.json();

    if (!nome || !tipo) {
      return NextResponse.json(
        { error: "Nome e tipo são obrigatórios" },
        { status: 400 }
      );
    }

    const novaCategoria = await prisma.categoria.create({
      data: { nome, tipo },
    });
    console.log("Recebido:", nome, tipo);
    return NextResponse.json(novaCategoria, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao criar categoria" },
      { status: 500 }
    );
  }
}
