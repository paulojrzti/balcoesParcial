-- AlterTable
ALTER TABLE "public"."Venda" ADD COLUMN     "colaboradorId" INTEGER,
ADD COLUMN     "quantidade" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "public"."Colaborador" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Colaborador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VendaAlocacao" (
    "id" SERIAL NOT NULL,
    "vendaId" INTEGER NOT NULL,
    "colaboradorId" INTEGER NOT NULL,
    "valor" DOUBLE PRECISION,
    "quantidade" DOUBLE PRECISION,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendaAlocacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MetaColabMes" (
    "id" SERIAL NOT NULL,
    "colaboradorId" INTEGER NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "valor" DOUBLE PRECISION,
    "quantidade" DOUBLE PRECISION,

    CONSTRAINT "MetaColabMes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Colaborador_nome_idx" ON "public"."Colaborador"("nome");

-- CreateIndex
CREATE INDEX "VendaAlocacao_vendaId_idx" ON "public"."VendaAlocacao"("vendaId");

-- CreateIndex
CREATE INDEX "VendaAlocacao_colaboradorId_idx" ON "public"."VendaAlocacao"("colaboradorId");

-- CreateIndex
CREATE UNIQUE INDEX "MetaColabMes_colaboradorId_categoriaId_ano_mes_key" ON "public"."MetaColabMes"("colaboradorId", "categoriaId", "ano", "mes");

-- AddForeignKey
ALTER TABLE "public"."Venda" ADD CONSTRAINT "Venda_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "public"."Colaborador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendaAlocacao" ADD CONSTRAINT "VendaAlocacao_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES "public"."Venda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendaAlocacao" ADD CONSTRAINT "VendaAlocacao_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "public"."Colaborador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MetaColabMes" ADD CONSTRAINT "MetaColabMes_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "public"."Colaborador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MetaColabMes" ADD CONSTRAINT "MetaColabMes_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "public"."Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
