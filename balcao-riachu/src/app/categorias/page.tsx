"use client";

import { useEffect, useState } from "react";

type Categoria = {
  id: number;
  nome: string;
  tipo: "MONETARIO" | "UNITARIO";
};

export default function Categorias() {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<"MONETARIO" | "UNITARIO">("MONETARIO");
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const fetchCategorias = async () => {
    const res = await fetch("/api/categorias");
    const data = await res.json();
    setCategorias(data);
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/categorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, tipo }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      alert("Erro: " + error);
      return;
    }
    setNome("");
    setTipo("MONETARIO");
    fetchCategorias();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/categorias/${id}`, { method: "DELETE" });
    fetchCategorias();
  };

  const handleEdit = async (id: number) => {
    const novoNome = prompt("Novo nome:");
    const novoTipo = prompt("Novo tipo (MONETARIO ou UNITARIO):") as
      | "MONETARIO"
      | "UNITARIO";

    if (!novoNome || !novoTipo) return;

    await fetch(`/api/categorias/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: novoNome, tipo: novoTipo }),
    });
    fetchCategorias();
  };

  return (
    <section className="flex flex-col items-center justify-start w-full min-h-screen p-10">
      <h1 className="text-4xl font-bold mb-8">Categorias</h1>

      {/* Formulário */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-4 sm:gap-5 mb-10 w-full max-w-xl"
      >
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome da categoria"
          className="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as "MONETARIO" | "UNITARIO")}
          className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="MONETARIO">Monetário</option>
          <option value="UNITARIO">Unitário</option>
        </select>
        <button
          type="submit"
          className="bg-blue-600 text-white font-semibold rounded-lg px-6 py-3 hover:bg-blue-700 transition"
        >
          Salvar
        </button>
      </form>

      {/* Lista de categorias */}
      <div className="w-full max-w-xl">
        <h3 className="text-2xl font-semibold mb-4">Categorias cadastradas</h3>
        <ul className="flex flex-col gap-3">
          {categorias.map((c) => (
            <li
              key={c.id}
              className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition"
            >
              <div>
                <span className="font-medium">{c.nome}</span>{" "}
                <span className="text-gray-500">
                  ({c.tipo === "MONETARIO" ? "Monetário" : "Unitário"})
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(c.id)}
                  className="px-3 py-1 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 transition"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  Deletar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
