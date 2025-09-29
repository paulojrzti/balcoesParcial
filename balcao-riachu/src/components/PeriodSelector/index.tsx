"use client";

import { DateSelector } from "@/components";

type Props = {
  mode: "day" | "month";
  setMode: (mode: "day" | "month") => void;
  date: Date | null;
  setDate: (date: Date | null) => void;
};

export function PeriodSelector({ mode, setMode, date, setDate }: Props) {
  return (
    <div className="flex items-center gap-3 p-2 bg-zinc-900 rounded-xl shadow-md">
      {/* Select estilizado */}
      <div className="relative">
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as "day" | "month")}
          className="appearance-none bg-zinc-800 text-white px-4 py-2 pr-8 rounded-lg 
                     cursor-pointer font-semibold text-sm 
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        >
          <option value="day">DIA</option>
          <option value="month">MÊS</option>
        </select>

        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
          ▼
        </span>
      </div>

      {/* DatePicker já com o modo atual */}
      <DateSelector mode={mode} value={date} onChange={setDate} />
    </div>
  );
}
