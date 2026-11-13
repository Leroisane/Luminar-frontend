import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  LockKeyhole,
} from "lucide-react";
import { useCalendarEvents } from "../../hooks/useAdminQueries";
import type { CalendarEvent, EventKind, RoomCategory } from "../../types/admin";
import {
  cn,
  formatLongDate,
  formatMonthYear,
  isSameDay,
  toISODate,
} from "../../utils/helpers";

type View = "month" | "week" | "day";
type Filter = "Semua Ruang & Alat" | RoomCategory;

const views: { key: View; label: string }[] = [
  { key: "month", label: "Bulan" },
  { key: "week", label: "Minggu" },
  { key: "day", label: "Hari" },
];

const filters: Filter[] = [
  "Semua Ruang & Alat",
  "Auditorium",
  "Lab Komputer",
  "Ruang Kelas",
  "Studio & Multimedia",
];

const weekdays = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

const legend = [
  { label: "Ruang Kelas / Lab", dot: "bg-emerald-500" },
  { label: "Auditorium & Seminar", dot: "bg-brand" },
  { label: "Studio & Alat Multimedia", dot: "bg-indigo-500" },
];

const chipStyle: Record<EventKind, string> = {
  class: "border-emerald-200 bg-emerald-50 text-emerald-800",
  auditorium: "border-brand/25 bg-brand/10 text-brand",
  studio: "border-indigo-200 bg-indigo-50 text-indigo-700",
  maintenance: "border-slate-300 bg-slate-100 text-slate-600",
};

// Event pada hari ini tampil solid agar menonjol
const chipSolid: Record<EventKind, string> = {
  class: "border-teal-600 bg-teal-600 text-white",
  auditorium: "border-brand bg-brand text-white",
  studio: "border-slate-800 bg-slate-800 text-white",
  maintenance: "border-slate-600 bg-slate-600 text-white",
};

function buildDays(view: View, focus: Date) {
  if (view === "day")
    return [new Date(focus.getFullYear(), focus.getMonth(), focus.getDate())];

  if (view === "week") {
    const start = new Date(
      focus.getFullYear(),
      focus.getMonth(),
      focus.getDate() - focus.getDay(),
    );
    return Array.from(
      { length: 7 },
      (_, i) =>
        new Date(start.getFullYear(), start.getMonth(), start.getDate() + i),
    );
  }

  const first = new Date(focus.getFullYear(), focus.getMonth(), 1);
  const last = new Date(focus.getFullYear(), focus.getMonth() + 1, 0);
  const total = Math.ceil((first.getDay() + last.getDate()) / 7) * 7;
  return Array.from(
    { length: total },
    (_, i) =>
      new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay() + i),
  );
}

function rangeLabel(view: View, focus: Date, days: Date[]) {
  if (view === "month") return formatMonthYear(focus);
  if (view === "day") return formatLongDate(focus);
  const fmt = (d: Date) =>
    d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  return `${fmt(days[0])} - ${fmt(days[6])} ${days[6].getFullYear()}`;
}

export default function AdminCalendar() {
  const [view, setView] = useState<View>("month");
  const [focus, setFocus] = useState(() => new Date());
  const [filter, setFilter] = useState<Filter>("Semua Ruang & Alat");
  const today = new Date();

  const days = useMemo(() => buildDays(view, focus), [view, focus]);
  const { data: events = [] } = useCalendarEvents(
    toISODate(days[0]),
    toISODate(days[days.length - 1]),
  );

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events
      .filter(
        (e) =>
          filter === "Semua Ruang & Alat" ||
          e.category === null ||
          e.category === filter,
      )
      .forEach((e) => map.set(e.date, [...(map.get(e.date) ?? []), e]));
    return map;
  }, [events, filter]);

  const shift = (dir: 1 | -1) =>
    setFocus((f) => {
      if (view === "month")
        return new Date(f.getFullYear(), f.getMonth() + dir, 1);
      if (view === "week")
        return new Date(f.getFullYear(), f.getMonth(), f.getDate() + dir * 7);
      return new Date(f.getFullYear(), f.getMonth(), f.getDate() + dir);
    });

  const maxChips = view === "month" ? 3 : 20;

  return (
    <section id="kalender" className="rounded-2xl border border-line bg-white">
      {/* Header */}
      <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl">
          <h2 className="flex items-center gap-3 text-xl font-bold tracking-tight">
            <CalendarDays className="size-6 shrink-0 text-brand" />
            Kalender Sentral – Monitoring Reservasi Terverifikasi
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Pemetaan komprehensif okupansi ruangan kelas, laboratorium,
            auditorium, dan studio multimedia FILKOM
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:items-start lg:items-end">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border border-line bg-white">
              <button
                aria-label="Sebelumnya"
                onClick={() => shift(-1)}
                className="px-3 py-2.5 hover:bg-slate-50"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="min-w-[150px] px-2 text-center text-sm font-bold capitalize">
                {rangeLabel(view, focus, days)}
              </span>
              <button
                aria-label="Berikutnya"
                onClick={() => shift(1)}
                className="px-3 py-2.5 hover:bg-slate-50"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            <div
              role="tablist"
              className="flex rounded-xl border border-line bg-slate-50 p-1"
            >
              {views.map((v) => (
                <button
                  key={v.key}
                  role="tab"
                  aria-selected={view === v.key}
                  onClick={() => setView(v.key)}
                  className={cn(
                    "rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors",
                    view === v.key
                      ? "bg-white text-ink shadow-sm"
                      : "text-slate-500 hover:text-ink",
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <button className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-brand transition-colors hover:bg-emerald-100">
            <LockKeyhole className="size-4" /> Tambah Blokir / Pemeliharaan
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 border-y border-line px-5 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 xl:pb-0">
          <span className="shrink-0 pr-1 text-xs font-semibold tracking-wide text-slate-500">
            KATEGORI:
          </span>
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
                filter === f
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-slate-50 text-slate-700 hover:bg-slate-100",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-600">
          {legend.map((l) => (
            <li key={l.label} className="flex items-center gap-1.5">
              <span className={cn("size-2.5 rounded-[3px]", l.dot)} />
              {l.label}
            </li>
          ))}
        </ul>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto px-5 py-5 sm:px-6">
        <div className={cn(view !== "day" && "min-w-[820px]")}>
          {view !== "day" && (
            <div className="grid grid-cols-7 border-b border-line">
              {weekdays.map((w) => (
                <span
                  key={w}
                  className="py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-600"
                >
                  {w}
                </span>
              ))}
            </div>
          )}

          <div
            className={cn(
              "grid border-l border-line",
              view === "day" ? "grid-cols-1" : "grid-cols-7",
            )}
          >
            {days.map((d) => {
              const iso = toISODate(d);
              const isToday = isSameDay(d, today);
              const inMonth =
                view !== "month" || d.getMonth() === focus.getMonth();
              const list = byDate.get(iso) ?? [];
              const visible = list.slice(0, maxChips);
              const hidden = list.length - visible.length;

              return (
                <div
                  key={iso}
                  className={cn(
                    "flex flex-col gap-1.5 border-b border-r border-line p-2",
                    view === "month"
                      ? "min-h-[134px]"
                      : view === "week"
                        ? "min-h-[280px]"
                        : "min-h-[200px]",
                    isToday &&
                      "bg-emerald-50/40 outline outline-2 -outline-offset-2 outline-brand",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        isToday
                          ? "flex size-7 items-center justify-center rounded-full bg-brand text-white"
                          : inMonth
                            ? "text-slate-800"
                            : "text-slate-300",
                      )}
                    >
                      {d.getDate()}
                    </span>
                    {isToday ? (
                      <span className="text-[11px] font-bold tracking-wide text-brand">
                        HARI INI
                      </span>
                    ) : (
                      d.getDate() === 1 && (
                        <span className="text-[11px] font-medium text-slate-400">
                          {d.toLocaleDateString("id-ID", { month: "short" })}
                        </span>
                      )
                    )}
                  </div>

                  {visible.map((e) => (
                    <button
                      key={e.id}
                      title={`${e.time ?? ""} ${e.title}`.trim()}
                      className={cn(
                        "w-full truncate rounded-md border px-2 py-1 text-left text-xs font-semibold transition-opacity hover:opacity-80",
                        isToday ? chipSolid[e.kind] : chipStyle[e.kind],
                      )}
                    >
                      {e.time && <span className="mr-1">{e.time}</span>}
                      {e.title}
                    </button>
                  ))}
                  {hidden > 0 && (
                    <span className="px-1 text-xs font-semibold text-slate-500">
                      +{hidden} lagi
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2 border-t border-line px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <li className="font-bold">Keterangan Warna:</li>
          {legend.map((l) => (
            <li
              key={l.label}
              className="flex items-center gap-2 text-slate-600"
            >
              <span className={cn("size-3 rounded-[4px]", l.dot)} />
              {l.label}
            </li>
          ))}
        </ul>
        <button className="inline-flex items-center gap-2 font-semibold text-brand hover:underline">
          <Eye className="size-4" /> Buka Tampilan Timeline Penuh
        </button>
      </div>
    </section>
  );
}
