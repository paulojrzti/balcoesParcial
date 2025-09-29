"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type DateSelectorProps = {
  mode: "month" | "day";
  value: Date | null;
  onChange: (date: Date | null) => void;
};

export function DateSelector({ mode, value, onChange }: DateSelectorProps) {
  return (
    <DatePicker
      selected={value}
      onChange={onChange}
      dateFormat={mode === "month" ? "MMMM yyyy" : "dd/MM/yyyy"}
      showMonthYearPicker={mode === "month"}
      className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer px-0 w-28 flex items-center text-sm"
      calendarClassName="dark-calendar"
    />
  );
}
