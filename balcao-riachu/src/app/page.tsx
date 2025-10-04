"use client";

import { useEffect, useState } from "react";
import { PeriodSelector } from "@/components";

type DiaMeta = {
  dia: number;
  meta: number;
};

type RelatorioMeta = {
  categoria: string;
  tipo: "MONETARIO" | "UNITARIO";
  ano: number;
  mes: number;
  metaMensal: number;
  totalVendas: number;
  faltante: number;
  dias: DiaMeta[];
};

type Categoria = {
  id: number;
  nome: string;
  tipo: "MONETARIO" | "UNITARIO";
};

type Venda = {
  id: number;
  valor: number;
  data: string; // no fetch sempre vem string
  categoriaId: number;
  categoria: {
    id: number;
    nome: string;
    tipo: "MONETARIO" | "UNITARIO";
  };
};

export default function HomePage() {
  const [mode, setMode] = useState<"day" | "month">("day");
  const [date, setDate] = useState<Date | null>(new Date());
  const [data, setData] = useState<RelatorioMeta[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);

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

    async function fetchData() {
      setLoading(true);
      try {
        const url =
          mode === "month"
            ? `/api/relatorios/metas?ano=${ano}&mes=${mes}`
            : `/api/relatorios/metas?ano=${ano}&mes=${mes}&dia=${dia}`;

        const res = await fetch(url);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [date, mode]);

  // Formatar valores
  const formatValue = (value: number, tipo: "MONETARIO" | "UNITARIO") =>
    tipo === "MONETARIO" ? `R$ ${value.toFixed(2)}` : value;

  return (
    <main className="flex flex-col items-center p-8 gap-10">
      <h1 className="text-5xl font-bold mb-6">Gestão de metas</h1>

      <div className="mb-8">
        <PeriodSelector
          mode={mode}
          setMode={setMode}
          date={date}
          setDate={setDate}
        />
      </div>

      {loading && <p className="text-gray-500">Carregando...</p>}

      <div className="overflow-x-auto w-full max-w-4xl">
        <table className="w-full border-collapse rounded-lg shadow-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-lg font-semibold text-gray-700 border-b border-gray-300 rounded-tl-lg">
                INDICADOR
              </th>
              <th className="px-6 py-3 text-right text-lg font-semibold text-gray-700 border-b border-gray-300">
                META
              </th>
              <th className="px-6 py-3 text-right text-lg font-semibold text-gray-700 border-b border-gray-300">
                REALIZADO
              </th>
              <th className="px-6 py-3 text-right text-lg font-semibold text-gray-700 border-b border-gray-300 rounded-tr-lg">
                % ATINGIDO
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {data.map((meta) => {
              const percentual =
                meta.metaMensal > 0
                  ? ((meta.totalVendas / meta.metaMensal) * 100).toFixed(1)
                  : "0";

              return (
                <tr
                  key={meta.categoria}
                  className="text-center text-base hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4 font-semibold text-gray-800 text-left">
                    {meta.categoria}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-800">
                    {formatValue(meta.metaMensal, meta.tipo)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-800">
                    {formatValue(meta.totalVendas, meta.tipo)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-800">
                    {percentual}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Registrar Venda */}
      {mode === "day" && (
        <div className="mt-10 w-full max-w-md bg-gray-100 p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-bold mb-4 text-center">
            Registrar Venda
          </h2>

          <form
            className="flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!date) return;

              const form = e.currentTarget;
              const formData = new FormData(form);
              const categoriaId = Number(formData.get("categoria"));
              const valor = Number(formData.get("valor"));

              if (!categoriaId || isNaN(valor)) {
                alert("Preencha todos os campos");
                return;
              }

              const ano = date.getFullYear();
              const mes = date.getMonth() + 1;
              const dia = date.getDate();

              try {
                const res = await fetch(
  `/api/vendas?ano=${ano}&mes=${mes}&dia=${dia}`
);
const vendasDoDia = await res.json();

const existente = vendasDoDia.find(
  (v: any) => v.categoriaId === categoriaId
);

let response;
if (existente) {
  // PUT → só atualiza valor da venda do dia certo
  response = await fetch(`/api/vendas/${existente.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ valor }),
  });
} else {
  // POST → cria nova venda com data correta
  response = await fetch(`/api/vendas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      valor,
      data: date,
      categoriaId,
    }),
  });
}

                if (!response.ok) {
                  throw new Error("Erro ao salvar venda");
                }

                alert("Venda registrada com sucesso!");
                form.reset();

                // Recarregar metas
                const url = `/api/relatorios/metas?ano=${ano}&mes=${mes}&dia=${dia}`;
                const metasRes = await fetch(url);
                setData(await metasRes.json());
              } catch (err) {
                console.error(err);
                alert("Falha ao registrar venda");
              }
            }}
          >
            <label className="flex flex-col">
              <span className="mb-1 text-sm font-medium">Categoria</span>
              <select
                name="categoria"
                className="p-2 border rounded-md"
                defaultValue=""
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
                type="number"
                step="0.01"
                name="valor"
                className="p-2 border rounded-md"
              />
            </label>

            <button
              type="submit"
              className="bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition"
            >
              Salvar
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
