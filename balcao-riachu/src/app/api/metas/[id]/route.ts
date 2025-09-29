import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const meta = await prisma.metaMes.findUnique({
    where: { id: Number(params.id) },
    include: { metasDia: true, categoria: true },
  });

  if (!meta)
    return NextResponse.json({ error: "Meta não encontrada" }, { status: 404 });
  return NextResponse.json(meta);
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { valor } = body;

  const meta = await prisma.metaMes.update({
    where: { id: Number(params.id) },
    data: { valor },
  });

  return NextResponse.json(meta);
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  await prisma.metaMes.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ message: "Meta removida com sucesso" });
}
