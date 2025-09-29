-- CreateEnum
CREATE TYPE "public"."TipoMeta" AS ENUM ('MONETARIO', 'UNITARIO');

-- CreateTable
CREATE TABLE "public"."Categoria" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "public"."TipoMeta" NOT NULL,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MetaMes" (
    "id" SERIAL NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MetaMes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MetaDia" (
    "id" SERIAL NOT NULL,
    "metaMesId" INTEGER NOT NULL,
    "dia" INTEGER NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MetaDia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Venda" (
    "id" SERIAL NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Venda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nome_key" ON "public"."Categoria"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "MetaMes_categoriaId_ano_mes_key" ON "public"."MetaMes"("categoriaId", "ano", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "MetaDia_metaMesId_dia_key" ON "public"."MetaDia"("metaMesId", "dia");

-- AddForeignKey
ALTER TABLE "public"."MetaMes" ADD CONSTRAINT "MetaMes_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "public"."Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MetaDia" ADD CONSTRAINT "MetaDia_metaMesId_fkey" FOREIGN KEY ("metaMesId") REFERENCES "public"."MetaMes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Venda" ADD CONSTRAINT "Venda_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "public"."Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
