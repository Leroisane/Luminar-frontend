import type { DayStatus } from "../types";

export const cn = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");

export const toISODate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const fromISODate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const formatLongDate = (d: Date) =>
  d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export const formatMonthYear = (d: Date) =>
  d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

/** Semester ganjil: Agustus - Januari, genap: Februari - Juli */
export const getSemesterLabel = (d: Date) => {
  const m = d.getMonth() + 1;
  return m >= 8 || m === 1 ? "Semester Ganjil" : "Semester Genap";
};

/**
 * Mock status okupansi harian. Ganti dengan data dari API
 * (mis. GET /availability?month=2026-11&building=G).
 */
export const getMockDayStatus = (d: Date, buildingIndex: number): DayStatus => {
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return "full";
  return (d.getDate() * 7 + buildingIndex) % 5 === 0 ? "partial" : "available";
};
