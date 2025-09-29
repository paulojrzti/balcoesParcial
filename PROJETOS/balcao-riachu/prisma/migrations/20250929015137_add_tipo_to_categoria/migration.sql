/*
  Warnings:

  - You are about to drop the `Meta` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `descricao` on the `Venda` table. All the data in the column will be lost.
  - Added the required column `tipo` to the `Categoria` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Meta";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "MetaMes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "categoriaId" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "valor" REAL NOT NULL,
    CONSTRAINT "MetaMes_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MetaDia" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "metaMesId" INTEGER NOT NULL,
    "dia" INTEGER NOT NULL,
    "valor" REAL NOT NULL,
    CONSTRAINT "MetaDia_metaMesId_fkey" FOREIGN KEY ("metaMesId") REFERENCES "MetaMes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Categoria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL
);
INSERT INTO "new_Categoria" ("id", "nome") SELECT "id", "nome" FROM "Categoria";
DROP TABLE "Categoria";
ALTER TABLE "new_Categoria" RENAME TO "Categoria";
CREATE UNIQUE INDEX "Categoria_nome_key" ON "Categoria"("nome");
CREATE TABLE "new_Venda" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "categoriaId" INTEGER NOT NULL,
    "valor" REAL NOT NULL,
    "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Venda_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Venda" ("categoriaId", "data", "id", "valor") SELECT "categoriaId", "data", "id", "valor" FROM "Venda";
DROP TABLE "Venda";
ALTER TABLE "new_Venda" RENAME TO "Venda";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "MetaMes_categoriaId_ano_mes_key" ON "MetaMes"("categoriaId", "ano", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "MetaDia_metaMesId_dia_key" ON "MetaDia"("metaMesId", "dia");
