import React from "react";

// Define the valid enum values directly
const TIPOS_VALIDOS = ["MONETARIO", "UNITARIO"] as const;
type TipoCategoria = (typeof TIPOS_VALIDOS)[number];

type CategoryData = {
  nome: string;
  tipo: TipoCategoria; // Now uses the restricted type
};

type CategoryFormProps = {
  initialData?: CategoryData;
  onSubmit: (data: CategoryData) => void;
  isLoading: boolean;
  submitButtonText: string;
};

const CategoryForm: React.FC<CategoryFormProps> = ({
  initialData = { nome: "", tipo: TIPOS_VALIDOS[0] }, // Default to the first valid type
  onSubmit,
  isLoading,
  submitButtonText,
}) => {
  const [data, setData] = React.useState<CategoryData>(initialData);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    // We can cast 'value' to TipoCategoria here because the <select> only allows valid options
    setData((prev) => ({ ...prev, [name]: value as TipoCategoria }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // No need to check for data.tipo since it's now controlled by the select
    if (data.nome) {
      onSubmit(data);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-white shadow rounded-lg mb-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="nome"
            className="block text-sm font-medium text-gray-700"
          >
            Nome
          </label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={data.nome}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Ex: Alimentação"
          />
        </div>
        <div>
          <label
            htmlFor="tipo"
            className="block text-sm font-medium text-gray-700"
          >
            Tipo (Enum)
          </label>
          {/* Change: Replaced input with select */}
          <select
            id="tipo"
            name="tipo"
            value={data.tipo}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            {TIPOS_VALIDOS.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className={`mt-4 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
          isLoading
            ? "bg-indigo-400 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        }`}
      >
        {isLoading ? "Processando..." : submitButtonText}
      </button>
    </form>
  );
};

export default CategoryForm;
