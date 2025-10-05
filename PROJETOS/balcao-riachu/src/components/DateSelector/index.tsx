"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type DateSelectorProps = {
  mode: "month" | "day";
  value: Date | null | string; // ← aceita string também
  onChange: (date: Date | null) => void;
};

export function DateSelector({ mode, value, onChange }: DateSelectorProps) {
  // 🔧 converte automaticamente string → Date
  const parsedValue =
    typeof value === "string"
      ? new Date(value)
      : value instanceof Date
      ? value
      : null;

  return (
    <DatePicker
      selected={parsedValue}
      onChange={onChange}
      dateFormat={mode === "month" ? "MMMM yyyy" : "dd/MM/yyyy"}
      showMonthYearPicker={mode === "month"}
      className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer px-0 w-28 flex items-center text-sm"
      calendarClassName="dark-calendar"
    />
  );
}
