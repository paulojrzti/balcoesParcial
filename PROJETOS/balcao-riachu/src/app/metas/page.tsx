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
  // ==== HELPERS (topo do componente) ====
  const formatBRL = (value: number | null | undefined) => {
    if (value == null || isNaN(value)) return "";
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const parseBRLInput = (input: string) => {
    // pega só dígitos e divide por 100 pra centavos
    const onlyDigits = input.replace(/\D/g, "");
    return Number(onlyDigits || "0") / 100;
  };

  const maskBRL = (raw: string) => {
    const cents = Number(raw.replace(/\D/g, "") || "0");
    return formatBRL(cents / 100);
  };

  const formatForDisplay = (
    value: string | number | null | undefined,
    tipo: "MONETARIO" | "UNITARIO"
  ) => {
    if (value == null || value === "") return "";
    const s = String(value);
    if (tipo === "MONETARIO") {
      // se já veio formatado, mantém; senão aplica máscara
      return /R\$|,|\./.test(s) ? s : maskBRL(s);
    }
    // UNITARIO: apenas dígitos
    return s.replace(/\D/g, "");
  };

  // ==== ESTADOS ====
  const [mode] = useState<"month" | "day">("month");
  const [date, setDate] = useState<Date | null>(new Date());
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  // metas mensais (input controlado como string p/ permitir máscara)
  const [metas, setMetas] = useState<{ [key: number]: string }>({});

  // metas mensais já salvas (para mostrar definido/distribuído)
  const [metasDefinidas, setMetasDefinidas] = useState<{
    [key: number]: { valor: number; distribuido: number };
  }>({});

  // metas diárias (sempre number p/ cálculo)
  const [metasDiarias, setMetasDiarias] = useState<{
    [dia: number]: { [categoriaId: number]: number };
  }>({});

  const [formatted, setFormatted] = useState<number[]>([]);
  const [openDia, setOpenDia] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [diasCompletos, setDiasCompletos] = useState<Set<number>>(new Set());

  const ano = date?.getFullYear() ?? 0;
  const mes = date?.getMonth() != null ? date.getMonth() + 1 : 0;

  // ==== CATEGORIAS ====
  const fetchCategorias = async () => {
    try {
      const res = await fetch("/api/categorias");
      const data = await res.json().catch(() => []);
      setCategorias(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao buscar categorias:", err);
      setCategorias([]);
    }
  };
  useEffect(() => {
    fetchCategorias();
  }, []);

  // ==== DIAS DO MÊS ====
  const getDiasDoMes = (d: Date) => {
    const y = d.getFullYear();
    const m = d.getMonth();
    const numDias = new Date(y, m + 1, 0).getDate();
    return Array.from({ length: numDias }, (_, i) => i + 1);
  };
  useEffect(() => {
    if (date) setFormatted(getDiasDoMes(date));
  }, [date]);

  // ==== BUSCA METAS MENSAIS (definido/distribuído) ====
  useEffect(() => {
    const fetchMetas = async () => {
      if (!date) return;
      const y = date.getFullYear();
      const m = date.getMonth() + 1;

      try {
        const res = await fetch(`/api/metas?ano=${y}&mes=${m}`);
        const data: MetaMes[] = await res.json().catch(() => []);

        const metasMap: {
          [key: number]: { valor: number; distribuido: number };
        } = {};
        (Array.isArray(data) ? data : []).forEach((meta) => {
          const distribuido = Array.isArray(meta.metasDia)
            ? meta.metasDia.reduce((acc, d) => acc + d.valor, 0)
            : 0;
          metasMap[meta.categoriaId] = { valor: meta.valor, distribuido };
        });

        setMetasDefinidas(metasMap);
      } catch (err) {
        console.error("Erro ao buscar metas:", err);
      }
    };

    fetchMetas();
  }, [date]);

  // ==== INPUT MENSAL (string para máscara) ====
  const handleChangeMeta = (categoriaId: number, value: string) => {
    setMetas((prev) => ({ ...prev, [categoriaId]: value }));
  };

  const handleSaveMetaMensal = async (categoriaId: number) => {
    const raw = metas[categoriaId];
    if (!raw) return alert("Digite um valor para a meta");

    const cat = categorias.find((c) => c.id === categoriaId);
    let valorNumber: number;

    if (cat?.tipo === "MONETARIO") {
      valorNumber = parseBRLInput(raw);
    } else {
      // unitário: apenas dígitos → number
      valorNumber = Number(raw.replace(/\D/g, "") || "0");
    }

    const payload = { categoriaId, ano, mes, valor: valorNumber };

    try {
      const resCheck = await fetch(
        `/api/metas?ano=${ano}&mes=${mes}&categoriaId=${categoriaId}`
      );
      const dataCheck: MetaMes[] = await resCheck.json().catch(() => []);
      const existente = Array.isArray(dataCheck) ? dataCheck[0] : null;

      let res: Response;
      if (existente) {
        res = await fetch(`/api/metas/${existente.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ valor: valorNumber }),
        });
      } else {
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

  // ==== INPUT DIÁRIO (SEM MÁSCARA NO ESTADO, guarda number) ====
  function handleChangeMetaDia(
    dia: number,
    categoriaId: number,
    valor: number
  ) {
    setMetasDiarias((prev) => ({
      ...prev,
      [dia]: {
        ...(prev[dia] ?? {}),
        [categoriaId]: valor,
      },
    }));
  }

  // ==== AO ABRIR MODAL, CARREGA DIAS EXISTENTES ====
  useEffect(() => {
    const fetchMetasDia = async () => {
      if (openDia == null) return;

      for (const cat of categorias) {
        const res = await fetch(
          `/api/metas?ano=${ano}&mes=${mes}&categoriaId=${cat.id}`
        );
        const metaMes: MetaMes[] = await res.json().catch(() => []);

        if (!Array.isArray(metaMes) || !metaMes[0]) continue;

        const existente = Array.isArray(metaMes[0].metasDia)
          ? metaMes[0].metasDia.find((d) => d.dia === openDia)
          : undefined;

        if (existente) {
          setMetasDiarias((prev) => ({
            ...prev,
            [openDia]: {
              ...(prev[openDia] ?? {}),
              [cat.id]: existente.valor,
            },
          }));
        }
      }
    };

    fetchMetasDia();
  }, [openDia, categorias, ano, mes]);

  // ==== SALVAR DIÁRIA & IR PARA PRÓXIMO ====
  const handleSaveAndNext = async () => {
    if (openDia == null) return;

    setLoading(true);
    try {
      for (const cat of categorias) {
        const valor = metasDiarias[openDia]?.[cat.id];
        if (valor == null) continue;

        const metaMes = await fetch(
          `/api/metas?ano=${ano}&mes=${mes}&categoriaId=${cat.id}`
        )
          .then((res) => res.json().catch(() => []))
          .then((data: MetaMes[]) => (Array.isArray(data) ? data[0] : null));

        if (!metaMes) continue;

        const existente = Array.isArray(metaMes.metasDia)
          ? metaMes.metasDia.find((d) => d.dia === openDia)
          : undefined;

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
      const data: MetaMes[] = await res.json().catch(() => []);
      const metasMap: {
        [key: number]: { valor: number; distribuido: number };
      } = {};
      (Array.isArray(data) ? data : []).forEach((meta) => {
        const distribuido = Array.isArray(meta.metasDia)
          ? meta.metasDia.reduce((acc, d) => acc + d.valor, 0)
          : 0;
        metasMap[meta.categoriaId] = { valor: meta.valor, distribuido };
      });
      setMetasDefinidas(metasMap);
    } finally {
      setLoading(false);
    }
  };

  // ==== CALCULA QUAIS DIAS ESTÃO COMPLETOS (todas categorias com valor) ====
  useEffect(() => {
    const fetchMetas = async () => {
      if (!date) return;
      const y = date.getFullYear();
      const m = date.getMonth() + 1;

      try {
        const res = await fetch(`/api/metas?ano=${y}&mes=${m}`);
        const data: MetaMes[] = await res.json().catch(() => []);

        const metasMap: {
          [key: number]: { valor: number; distribuido: number };
        } = {};
        const diasValidos = new Set<number>();

        (Array.isArray(data) ? data : []).forEach((meta) => {
          const distribuido = Array.isArray(meta.metasDia)
            ? meta.metasDia.reduce((acc, d) => acc + d.valor, 0)
            : 0;
          metasMap[meta.categoriaId] = { valor: meta.valor, distribuido };
        });

        // dia completo = TODAS as categorias têm valor > 0 nesse dia
        formatted.forEach((dia) => {
          const todasCategoriasOK = categorias.every((cat) => {
            const metaCat = data.find((m) => m.categoriaId === cat.id);
            return (
              metaCat?.metasDia?.some((d) => d.dia === dia && d.valor > 0) ??
              false
            );
          });
          if (todasCategoriasOK) diasValidos.add(dia);
        });

        setMetasDefinidas(metasMap);
        setDiasCompletos(diasValidos);
      } catch (err) {
        console.error("Erro ao buscar metas:", err);
      }
    };

    fetchMetas();
  }, [date, categorias, formatted]);

  // ==== RENDER ====
  return (
    <section className="px-20 flex flex-col items-center gap-10 justify-center">
      <h1 className="text-4xl font-semibold">Metas</h1>

      <div className="flex items-center bg-black text-white px-3 py-2 rounded-lg gap-3 w-fit">
        <p>Mês</p>
        <span className="w-[2px] h-6 bg-gray-600"></span>
        <DateSelector mode={mode} value={date} onChange={setDate} />
      </div>

      {/* metas mensais */}
      <div className="flex gap-10 flex-wrap items-stretch justify-center">
        {categorias.map((cat) => {
          const definido = metasDefinidas[cat.id]?.valor ?? null;
          const distribuido = metasDefinidas[cat.id]?.distribuido ?? null;

          const formatar = (valor: number | null) => {
            if (valor == null) return "-";
            return cat.tipo === "MONETARIO"
              ? new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(valor)
              : valor;
          };

          return (
            <div
              key={cat.id}
              className="flex flex-col justify-between bg-[rgba(212,212,212,0)] backdrop-blur-[4px] 
              border border-white/10
              shadow-[0_6px_16px_rgba(0,0,0,0.25),-6px_12px_20px_rgba(255,255,255,0.2)_inset,3px_3px_20px_rgba(58,58,58,0.08)_inset] 
               transition-all duration-500 hover:scale-[1.03] hover:shadow-[0_10px_28px_rgba(0,0,0,0.35)] rounded-lg p-6 w-64 h-40"
            >
              {/* header */}
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-lg font-semibold flex-1">{cat.nome}</h2>

                {/* INPUT MENSAL (com máscara por tipo) */}
                <input
                  type="text"
                  className="w-22 bg-gray-200 px-2 text-left p-1 rounded-lg"
                  placeholder={cat.tipo === "MONETARIO" ? "R$ 0,00" : "Meta"}
                  value={formatForDisplay(metas[cat.id] ?? "", cat.tipo)}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (cat.tipo === "MONETARIO") {
                      const masked = maskBRL(raw);
                      handleChangeMeta(cat.id, masked);
                    } else {
                      const onlyDigits = raw.replace(/\D/g, "");
                      handleChangeMeta(cat.id, onlyDigits);
                    }
                  }}
                />

                <button
                  className="bg-black text-white px-2 py-1 rounded w-max"
                  onClick={() => handleSaveMetaMensal(cat.id)}
                >
                  <Save size={16} />
                </button>
              </div>

              {/* footer */}
              <div className="flex justify-between text-sm text-gray-700">
                <small className="text-sm">
                  <span className="font-bold">definido:</span>{" "}
                  {formatar(definido)}
                </small>
                <small className="text-sm">
                  <span className="font-bold">distribuído:</span>{" "}
                  {formatar(distribuido)}
                </small>
              </div>
            </div>
          );
        })}
      </div>

      {/* lista de dias */}
      <div className="flex flex-wrap gap-2 items-center justify-center">
        {formatted.map((dia) => {
          const completo = diasCompletos.has(dia);
          return (
            <button
              key={dia}
              className={`px-3 py-2 flex items-center gap-2 bg-[rgba(212,212,212,0)] backdrop-blur-[4px] 
              border border-white/10
              shadow-[0_6px_16px_rgba(0,0,0,0.25),-6px_12px_20px_rgba(255,255,255,0.2)_inset,3px_3px_20px_rgba(58,58,58,0.08)_inset] 
               transition-all duration-500 hover:scale-[1.03] hover:shadow-[0_10px_28px_rgba(0,0,0,0.35)] rounded-lg ${
                 completo ? "bg-green-100 border-green-400" : ""
               }`}
              onClick={() => setOpenDia(dia)}
            >
              Dia {dia}
              {completo && <span className="text-green-600 font-bold">✓</span>}
            </button>
          );
        })}
      </div>

      {/* MODAL */}
      {openDia != null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[400px] flex flex-col gap-4 relative">
            <h2 className="text-xl font-semibold">Metas do dia {openDia}</h2>

            {categorias.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2">
                <span className="flex-1 font-semibold">{cat.nome}</span>

                {/* INPUT DIÁRIO (mostra máscara BRL, estado em number) */}
                <input
                  type="text"
                  value={(() => {
                    const raw = metasDiarias[openDia]?.[cat.id];
                    if (raw == null) return "";
                    return cat.tipo === "MONETARIO"
                      ? formatBRL(raw)
                      : String(raw);
                  })()}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (cat.tipo === "MONETARIO") {
                      const numeric = parseBRLInput(raw); // number (reais)
                      handleChangeMetaDia(openDia, cat.id, numeric);
                    } else {
                      const onlyDigits = raw.replace(/\D/g, "");
                      const numeric = Number(onlyDigits || "0");
                      handleChangeMetaDia(openDia, cat.id, numeric);
                    }
                  }}
                  className="w-28 bg-gray-200 px-2 p-1 rounded-lg text-right"
                  placeholder={cat.tipo === "MONETARIO" ? "R$ 0,00" : "0"}
                />
              </div>
            ))}

            <div className="flex justify-center mt-6 gap-3">
              <button
                className="px-3 py-1 border rounded"
                onClick={() => setOpenDia(null)}
              >
                Fechar
              </button>
              <button
                className="px-3 py-1 bg-black text-white rounded"
                onClick={handleSaveAndNext}
                disabled={loading}
              >
                {loading ? "Salvando..." : "Salvar & Próximo"}
              </button>
            </div>

            {/* overlay de loading */}
            {loading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
