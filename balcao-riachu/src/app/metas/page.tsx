"use client";

import { useEffect, useState } from "react";
import { DateSelector } from "@/components";
import { Save } from "lucide-react";

type Categoria = {
  id: number;
  nome: string;
  tipo: "MONETARIO" | "UNITARIO";
};

interface MetaDia {
  id: number;
  dia: number;
  valor: number;
}

interface MetaMes {
  id: number;
  categoriaId: number;
  ano: number;
  mes: number;
  valor: number;
  categoria: Categoria;
  metasDia: MetaDia[];
}

export default function Metas() {
  const [mode] = useState<"month" | "day">("month");
  const [date, setDate] = useState<Date | null>(new Date());
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [metas, setMetas] = useState<{ [key: number]: string }>({});
  const [metasDefinidas, setMetasDefinidas] = useState<{
    [key: number]: { valor: number; distribuido: number };
  }>({});
  const [metasDiarias, setMetasDiarias] = useState<{
    [dia: number]: { [categoriaId: number]: number };
  }>({});
  const [formatted, setFormatted] = useState<number[]>([]);

  // estado do modal
  const [openDia, setOpenDia] = useState<number | null>(null);

  // helpers
  const ano = date?.getFullYear() ?? 0;
  const mes = date?.getMonth() != null ? date.getMonth() + 1 : 0;

  // busca categorias
  const fetchCategorias = async () => {
    const res = await fetch("/api/categorias");
    const data = await res.json();
    setCategorias(data);
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  // cria array de dias do mês
  const getDiasDoMes = (date: Date) => {
    const ano = date.getFullYear();
    const mes = date.getMonth();
    const numDias = new Date(ano, mes + 1, 0).getDate();
    return Array.from({ length: numDias }, (_, i) => i + 1);
  };

  useEffect(() => {
    if (date) {
      setFormatted(getDiasDoMes(date));
    }
  }, [date]);

  // busca metas mensais e distribuídas
  useEffect(() => {
    const fetchMetas = async () => {
      if (!date) return;
      const ano = date.getFullYear();
      const mes = date.getMonth() + 1;

      const res = await fetch(`/api/metas?ano=${ano}&mes=${mes}`);
      const data: MetaMes[] = await res.json();

      const metasMap: {
        [key: number]: { valor: number; distribuido: number };
      } = {};
      data.forEach((meta) => {
        const distribuido = meta.metasDia.reduce((acc, d) => acc + d.valor, 0);
        metasMap[meta.categoriaId] = {
          valor: meta.valor,
          distribuido,
        };
      });

      setMetasDefinidas(metasMap);
    };

    fetchMetas();
  }, [date]);

  // input meta mensal
  const handleChangeMeta = (categoriaId: number, value: string) => {
    setMetas((prev) => ({ ...prev, [categoriaId]: value }));
  };

  const handleSaveMetaMensal = async (categoriaId: number) => {
    const valor = metas[categoriaId];
    if (!valor) return alert("Digite um valor para a meta");

    const payload = { categoriaId, ano, mes, valor: Number(valor) };

    try {
      // checa se já existe meta para essa categoria no mês/ano
      const resCheck = await fetch(
        `/api/metas?ano=${ano}&mes=${mes}&categoriaId=${categoriaId}`
      );
      const dataCheck: MetaMes[] = await resCheck.json();
      const existente = dataCheck[0];

      let res;
      if (existente) {
        // já existe → atualiza com PUT
        res = await fetch(`/api/metas/${existente.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ valor: Number(valor) }),
        });
      } else {
        // não existe → cria com POST
        res = await fetch("/api/metas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error("Erro ao salvar meta");

      const data = await res.json();
      setMetasDefinidas((prev) => ({
        ...prev,
        [categoriaId]: {
          valor: data.valor,
          distribuido: prev[categoriaId]?.distribuido ?? 0,
        },
      }));

      alert("Meta salva com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar meta");
    }
  };

  // input meta diária
  const handleChangeMetaDia = (
    dia: number,
    categoriaId: number,
    value: string
  ) => {
    setMetasDiarias((prev) => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        [categoriaId]: Number(value),
      },
    }));
  };

  // ao abrir modal, buscar dados já salvos
  useEffect(() => {
    const fetchMetasDia = async () => {
      if (openDia == null) return;

      for (const cat of categorias) {
        const res = await fetch(
          `/api/metas?ano=${ano}&mes=${mes}&categoriaId=${cat.id}`
        );
        const metaMes: MetaMes[] = await res.json();
        if (!metaMes[0]) continue;

        const existente = metaMes[0].metasDia.find((d) => d.dia === openDia);
        if (existente) {
          setMetasDiarias((prev) => ({
            ...prev,
            [openDia]: {
              ...prev[openDia],
              [cat.id]: existente.valor,
            },
          }));
        }
      }
    };

    fetchMetasDia();
  }, [openDia, categorias, ano, mes]);

  // salvar meta diária (POST ou PUT)
  const handleSaveAndNext = async () => {
    if (openDia == null) return;

    for (const cat of categorias) {
      const valor = metasDiarias[openDia]?.[cat.id];
      if (valor == null) continue;

      const metaMes = await fetch(
        `/api/metas?ano=${ano}&mes=${mes}&categoriaId=${cat.id}`
      )
        .then((res) => res.json())
        .then((data: MetaMes[]) => data[0]);

      if (!metaMes) continue;

      const existente = metaMes.metasDia.find((d) => d.dia === openDia);

      if (existente) {
        await fetch(`/api/metas/dias/${existente.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ valor }),
        });
      } else {
        await fetch("/api/metas/dias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            metaMesId: metaMes.id,
            dia: openDia,
            valor,
          }),
        });
      }
    }

    // avança pro próximo dia
    const currentIndex = formatted.indexOf(openDia);
    const nextDia = formatted[currentIndex + 1] ?? null;
    setOpenDia(nextDia);

    // recarrega metas para atualizar "distribuído"
    const res = await fetch(`/api/metas?ano=${ano}&mes=${mes}`);
    const data: MetaMes[] = await res.json();
    const metasMap: { [key: number]: { valor: number; distribuido: number } } =
      {};
    data.forEach((meta) => {
      const distribuido = meta.metasDia.reduce((acc, d) => acc + d.valor, 0);
      metasMap[meta.categoriaId] = {
        valor: meta.valor,
        distribuido,
      };
    });
    setMetasDefinidas(metasMap);
  };

  return (
    <section className="px-40 flex flex-col items-center gap-10 justify-center">
      <h1 className="text-4xl font-semibold">Metas</h1>

      <div className="flex items-center bg-black text-white px-3 py-2 rounded-lg gap-3 w-fit">
        <p>Mês</p>
        <span className="w-[2px] h-6 bg-gray-600"></span>
        <DateSelector mode={mode} value={date} onChange={setDate} />
      </div>

      {/* metas mensais */}
      <div className="flex gap-10 flex-wrap items-center justify-center">
        {categorias.map((cat) => (
          <div
            key={cat.id}
            className="py-4 border rounded flex-col gap-2 w-max px-10"
          >
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-semibold">{cat.nome}</h2>
              <input
                type="number"
                className="w-20 bg-gray-200 px-2"
                placeholder="Meta"
                value={metas[cat.id] || ""}
                onChange={(e) => handleChangeMeta(cat.id, e.target.value)}
              />
              <button
                className="bg-black text-white px-2 py-1 rounded w-max"
                onClick={() => handleSaveMetaMensal(cat.id)}
              >
                <Save size={16} />
              </button>
            </div>
            <div className="flex gap-5">
              <small>definido: {metasDefinidas[cat.id]?.valor ?? "-"}</small>
              <small>
                distribuído: {metasDefinidas[cat.id]?.distribuido ?? 0}
              </small>
            </div>
          </div>
        ))}
      </div>

      {/* lista de dias */}
      <div className="flex flex-wrap gap-2 items-center justify-center">
        {formatted.map((dia) => (
          <button
            key={dia}
            className="px-3 py-2 border rounded hover:bg-gray-200"
            onClick={() => setOpenDia(dia)}
          >
            Dia {dia}
          </button>
        ))}
      </div>

      {/* MODAL */}
      {openDia != null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[400px] flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Metas do dia {openDia}</h2>

            {categorias.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2">
                <span className="flex-1">{cat.nome}</span>
                <input
                  type="number"
                  value={metasDiarias[openDia]?.[cat.id] || ""}
                  onChange={(e) =>
                    handleChangeMetaDia(openDia, cat.id, e.target.value)
                  }
                  className="w-20 bg-gray-200 px-2"
                />
              </div>
            ))}

            <div className="flex justify-end gap-3">
              <button
                className="px-3 py-1 border rounded"
                onClick={() => setOpenDia(null)}
              >
                Fechar
              </button>
              <button
                className="px-3 py-1 bg-black text-white rounded"
                onClick={handleSaveAndNext}
              >
                Salvar & Próximo
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
