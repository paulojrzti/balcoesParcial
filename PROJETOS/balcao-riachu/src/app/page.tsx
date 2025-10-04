"use client";

import { useEffect, useState } from "react";
import { PeriodSelector } from "@/components";

type DiaMeta = { dia: number; meta: number };

type RelatorioMeta = {
  categoriaId: number; // <- adicionei para casar com vendas
  categoria: string;
  tipo: "MONETARIO" | "UNITARIO";
  ano: number;
  mes: number;
  metaMensal: number; // quando há 'dia', este campo já vira "meta do dia"
  dias: DiaMeta[];
};
type Categoria = { id: number; nome: string; tipo: "MONETARIO" | "UNITARIO" };

type MoneyUnit = "MONETARIO" | "UNITARIO";

type GapRow = {
  categoriaId?: number; // ← opcional, já que o endpoint ainda pode não mandar
  categoria: string;
  tipo?: MoneyUnit; // ← opcional (vamos buscar nas categorias se vier vazio)
  metaAcumulada: number;
  vendaAcumulada: number;
  gap: number;
};

type VendaDia = {
  id: number;
  categoriaId: number;
  valor: number;
  data: string;
};

type VendaResumo = {
  categoriaId: number;
  categoria: string;
  tipo: "MONETARIO" | "UNITARIO";
  total: number; // total vendido no período (dia ou mês)
  quantidade: number;
};

export default function HomePage() {
  const [mode, setMode] = useState<"day" | "month">("day");
  const [date, setDate] = useState<Date | null>(new Date());
  // const [data, setData] = useState<RelatorioMeta[]>([]);
  const [metasData, setMetasData] = useState<RelatorioMeta[]>([]);
  const [vendasData, setVendasData] = useState<VendaResumo[]>([]);
  const [rowsIndicadores, setRowsIndicadores] = useState<
    {
      categoriaId: number;
      categoria: string;
      tipo: MoneyUnit;
      metaPeriodo: number; // meta do dia OU meta do mês, conforme 'mode'
      realizadoPeriodo: number; // total vendido no dia OU mês
      desvio: number; // realizado - meta
      percentual: number; // 0..100 (1 casa)
    }[]
  >([]);


  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(
    null
  );
  const [valorInput, setValorInput] = useState<string>("");
  const [gapData, setGapData] = useState<GapRow[]>([]);

  // Buscar categorias
  useEffect(() => {
    async function fetchCategorias() {
      try {
        const res = await fetch("/api/categorias");
        const json = await res.json();
        setCategorias(json);
      } catch (err) {
        console.error("Erro ao buscar categorias:", err);
      }
    }
    fetchCategorias();
  }, []);

  // Buscar metas
 useEffect(() => {
   if (!date) return;

   const ano = date.getFullYear();
   const mes = date.getMonth() + 1;
   const dia = date.getDate();

   async function fetchPrimeiraTabela() {
     setLoading(true);
     try {
       const metasUrl =
         mode === "month"
           ? `/api/relatorios/metas?ano=${ano}&mes=${mes}`
           : `/api/relatorios/metas?ano=${ano}&mes=${mes}&dia=${dia}`;

       const vendasUrl =
         mode === "month"
           ? `/api/relatorios/vendas?ano=${ano}&mes=${mes}`
           : `/api/relatorios/vendas?ano=${ano}&mes=${mes}&dia=${dia}`;

       const [metasRes, vendasRes] = await Promise.all([
         fetch(metasUrl),
         fetch(vendasUrl),
       ]);

       if (!metasRes.ok) throw new Error("Falha ao buscar metas");
       if (!vendasRes.ok) throw new Error("Falha ao buscar vendas");

       const metasJson: RelatorioMeta[] = await metasRes.json();
       const vendasJson: VendaResumo[] = await vendasRes.json();

       setMetasData(metasJson);
       setVendasData(vendasJson);

       // === merge por categoriaId ===
       const metaById = new Map<number, RelatorioMeta>();
       metasJson.forEach((m) => metaById.set(m.categoriaId, m));

       const vendaById = new Map<number, VendaResumo>();
       vendasJson.forEach((v) => vendaById.set(v.categoriaId, v));

       const catIds = new Set<number>([
         ...metaById.keys(),
         ...vendaById.keys(),
       ]);

       const linhas = Array.from(catIds).map((id) => {
         const m = metaById.get(id);
         const v = vendaById.get(id);

         const categoria = m?.categoria || v?.categoria || `Categoria ${id}`;
         const tipo: MoneyUnit = (m?.tipo ||
           v?.tipo ||
           "MONETARIO") as MoneyUnit;

         // quando 'dia' é enviado, backend retorna a meta do dia em 'metaMensal'
         const metaPeriodo = m?.metaMensal ?? 0;
         const realizadoPeriodo = v?.total ?? 0;

         const desvio = Number((realizadoPeriodo - metaPeriodo).toFixed(2));
         const percentual =
           metaPeriodo > 0
             ? Number(((realizadoPeriodo / metaPeriodo) * 100).toFixed(1))
             : 0;

         return {
           categoriaId: id,
           categoria,
           tipo,
           metaPeriodo,
           realizadoPeriodo,
           desvio,
           percentual,
         };
       });

       linhas.sort((a, b) => a.categoria.localeCompare(b.categoria));
       setRowsIndicadores(linhas);
     } catch (err) {
       console.error("Erro ao buscar dados:", err);
       setMetasData([]);
       setVendasData([]);
       setRowsIndicadores([]);
     } finally {
       setLoading(false);
     }
   }

   fetchPrimeiraTabela();

   // ← mantém seu fetchGap do jeito que já está
   async function fetchGap() {
     if (mode !== "day") return;
     const d = date;
     if (!d) return;
     const dateStr = d.toISOString().slice(0, 10);
     try {
       const res = await fetch(`/api/relatorios/gap?date=${dateStr}`);
       const json = await res.json();
       setGapData(json.data || []);
     } catch (err) {
       console.error("Erro ao buscar gap:", err);
     }
   }
   fetchGap();
 }, [date, mode]);

  const formatValue = (
    value: number | undefined,
    tipo: "MONETARIO" | "UNITARIO"
  ) =>
    value !== undefined
      ? tipo === "MONETARIO"
        ? new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(value)
        : value.toString()
      : "-";

  const handleCategoriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cat = categorias.find((c) => c.id === Number(e.target.value)) || null;
    setSelectedCategoria(cat);
    setValorInput(""); // resetar campo ao mudar categoria
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    if (selectedCategoria?.tipo === "MONETARIO") {
      // Formatar como BRL dinamicamente
      // Remove tudo que não é número
      const numericValue = val.replace(/\D/g, "");
      const number = Number(numericValue) / 100; // para centavos
      val = number.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    }

    setValorInput(val);
  };

  const getTipo = (row: GapRow): MoneyUnit =>
    row.tipo ??
    categorias.find((c) => c.nome === row.categoria)?.tipo ??
    "UNITARIO";

  return (
    <main className="flex flex-col items-center p-8 gap-10">
      <h1 className="text-5xl font-bold mb-6">Gestão de metas</h1>
      <PeriodSelector
        mode={mode}
        setMode={setMode}
        date={date}
        setDate={setDate}
      />

      {loading && <p className="text-gray-500">Carregando...</p>}

      <div className="overflow-x-auto w-full max-w-4xl">
        <table className="w-full border-collapse rounded-lg shadow-lg overflow-hidden">
          <thead className="bg-zinc-900 text-white">
            <tr>
              <th className="px-6 py-3text-left text-lg font-semibold  border-b border-gray-300 rounded-tl-lg">
                INDICADOR
              </th>
              <th className="px-6 py-3 text-left text-lg font-semibold  border-b border-gray-300">
                META
              </th>
              <th className="px-6 py-3 text-left text-lg font-semibold  border-b border-gray-300">
                REALIZADO
              </th>
              <th className="px-6 py-3 text-left text-lg font-semibold  border-b border-gray-300">
                DESVIO
              </th>
              <th className="px-6 py-3 text-left text-lg font-semibold  border-b border-gray-300 rounded-tr-lg">
                % ATINGIDO
              </th>
            </tr>
          </thead>
          <tbody
            className="bg-[rgba(212,212,212,0)] backdrop-blur-[4px] 
    border border-white/10
    shadow-[0_6px_16px_rgba(0,0,0,0.25),-6px_12px_20px_rgba(255,255,255,0.2)_inset,3px_3px_20px_rgba(58,58,58,0.08)_inset] 
    rounded-lg"
          >
            {rowsIndicadores.map((row) => {
              const atingiu = row.realizadoPeriodo >= row.metaPeriodo;

              return (
                <tr
                  key={row.categoriaId}
                  className={`text-center text-base transition ${
                    atingiu
                      ? "bg-green-100 hover:bg-green-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <td className="px-6 py-4 font-semibold text-lg text-gray-800 text-left">
                    {row.categoria}
                  </td>

                  <td className="px-6 py-4 text-left text-lg text-gray-800">
                    {formatValue(row.metaPeriodo, row.tipo)}
                  </td>

                  <td className="px-6 py-4 text-left text-lg font-semibold text-gray-800">
                    {formatValue(row.realizadoPeriodo, row.tipo)}
                  </td>

                  <td
                    className={`px-6 py-4 text-left text-lg font-semibold ${
                      row.desvio > 0
                        ? "text-green-600"
                        : row.desvio < 0
                        ? "text-red-600"
                        : "text-gray-800"
                    }`}
                  >
                    {row.desvio > 0
                      ? `+${formatValue(row.desvio, row.tipo)}`
                      : formatValue(row.desvio, row.tipo)}
                  </td>

                  <td className="px-6 py-4 text-left text-gray-800">
                    {row.percentual}%
                  </td>
                </tr>
              );
            })}

            {rowsIndicadores.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Nenhum dado para este período
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* registrar venda */}
      {mode === "day" && (
        <div
          className="mt-10 w-full max-w-md bg-[rgba(212,212,212,0)] backdrop-blur-[4px] 
        border border-white/10
        shadow-[0_6px_16px_rgba(0,0,0,0.25),-6px_12px_20px_rgba(255,255,255,0.2)_inset,3px_3px_20px_rgba(58,58,58,0.08)_inset] 
         transition-all duration-500 hover:scale-[1.03] hover:shadow-[0_10px_28px_rgba(0,0,0,0.35)] p-6 rounded-lg"
        >
          <h2 className="text-lg font-bold mb-4 text-center">
            Registrar Venda
          </h2>
          <form
            className="flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!date || !selectedCategoria) return;

              // Converter valor de BRL para number se necessário
              let valorNumber = Number(valorInput.replace(/\D/g, "")) / 100;
              if (selectedCategoria.tipo === "UNITARIO") {
                valorNumber = Number(valorInput);
              }

              if (isNaN(valorNumber) || valorNumber <= 0) {
                alert("Preencha todos os campos corretamente");
                return;
              }

              const ano = date.getFullYear();
              const mes = date.getMonth() + 1;
              const dia = date.getDate();

              setLoading(true);

              try {
                // ✅ Envia data no formato ISO (YYYY-MM-DD)
                const response = await fetch(`/api/vendas`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    valor: valorNumber,
                    data: date.toISOString().slice(0, 10), // "2025-10-04"
                    categoriaId: selectedCategoria.id,
                  }),
                });

                if (!response.ok) throw new Error("Erro ao salvar venda");

                alert("Venda registrada com sucesso!");
                setValorInput("");
                setSelectedCategoria(null);

                // Atualiza tabela de metas
                const metasRes = await fetch(
                  `/api/relatorios/metas?ano=${ano}&mes=${mes}&dia=${dia}`
                );
                setDate(await metasRes.json());

                // Atualiza relatório diário (gap)
                const dateStr = date.toISOString().slice(0, 10);
                const gapRes = await fetch(
                  `/api/relatorios/gap?date=${dateStr}`
                );
                const gapJson = await gapRes.json();
                setGapData(gapJson.data || []);
              } catch (err) {
                console.error(err);
                alert("Falha ao registrar venda");
              } finally {
                setLoading(false);
              }
            }}
          >
            <label className="flex flex-col">
              <span className="mb-1 text-sm font-medium">Categoria</span>
              <select
                name="categoria"
                className="p-2 border rounded-md"
                value={selectedCategoria?.id || ""}
                onChange={handleCategoriaChange}
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col">
              <span className="mb-1 text-sm font-medium">Valor</span>
              <input
                type="text"
                name="valor"
                className="p-2 border rounded-md"
                value={valorInput}
                onChange={handleValorChange}
                placeholder={
                  selectedCategoria?.tipo === "MONETARIO" ? "R$ 0,00" : "0"
                }
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className={`py-2 px-4 rounded-md transition text-white ${
                loading
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-black hover:bg-gray-800"
              }`}
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </form>
        </div>
      )}

      {/* gap */}
      {mode === "day" && (
        <div className="overflow-x-auto w-full max-w-4xl my-30">
          <h2 className="text-3xl font-bold mb-10 text-center">
            Relatório Diário (Gap)
          </h2>

          <table className="w-full border-collapse rounded-lg shadow-lg overflow-hidden">
            <thead className="bg-zinc-900 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-lg font-semibold  border-b border-gray-300 rounded-tl-lg">
                  CATEGORIA
                </th>
                <th className="px-6 py-3 text-left text-lg font-semibold  border-b border-gray-300">
                  META ACUMULADA
                </th>
                <th className="px-6 py-3 text-left text-lg font-semibold  border-b border-gray-300">
                  VENDAS ACUMULADAS
                </th>
                <th className="px-6 py-3 text-left text-lg font-semibold  border-b border-gray-300">
                  GAP
                </th>
                <th className="px-6 py-3 text-left text-lg font-semibold border-b border-gray-300 rounded-tr-lg">
                  % ATINGIDO
                </th>
              </tr>
            </thead>

            <tbody
              className="bg-[rgba(212,212,212,0)] backdrop-blur-[4px] 
              border border-white/10
              shadow-[0_6px_16px_rgba(0,0,0,0.25),-6px_12px_20px_rgba(255,255,255,0.2)_inset,3px_3px_20px_rgba(58,58,58,0.08)_inset] 
              rounded-lg"
            >
              {gapData.map((row) => {
                const tipo = getTipo(row);
                const percentual =
                  row.metaAcumulada > 0
                    ? ((row.vendaAcumulada / row.metaAcumulada) * 100).toFixed(
                        1
                      )
                    : "0";
                const desvio = row.vendaAcumulada - row.metaAcumulada;
                const atingiu = row.vendaAcumulada >= row.metaAcumulada;

                return (
                  <tr
                    key={row.categoriaId ?? row.categoria}
                    className={`text-center text-base transition ${
                      atingiu
                        ? "bg-green-100 hover:bg-green-200"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-6 py-4 font-semibold text-gray-800 text-left">
                      {row.categoria}
                    </td>

                    <td className="px-6 py-4 text-left text-gray-800">
                      {formatValue(row.metaAcumulada, tipo)}
                    </td>

                    <td className="px-6 py-4 text-left text-gray-800">
                      {formatValue(row.vendaAcumulada, tipo)}
                    </td>

                    <td
                      className={`px-6 py-4 text-left font-semibold ${
                        desvio > 0
                          ? "text-green-600"
                          : desvio < 0
                          ? "text-red-600"
                          : "text-gray-800"
                      }`}
                    >
                      {desvio > 0
                        ? `+${formatValue(desvio, tipo)}`
                        : formatValue(desvio, tipo)}
                    </td>

                    <td className="px-6 py-4 text-right text-gray-800">
                      {percentual}%
                    </td>
                  </tr>
                );
              })}

              {gapData.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Nenhum dado encontrado para esta data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
