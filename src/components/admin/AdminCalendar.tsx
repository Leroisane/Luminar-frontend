import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  List,
  LockKeyhole,
  Trash2,
  X,
} from "lucide-react";
import { axiosClient } from "../../api/axiosClient";
import { useCalendarEvents } from "../../hooks/useAdminQueries";
import type { CalendarEvent, EventKind, RoomCategory } from "../../types/admin";
import {
  cn,
  formatLongDate,
  formatMonthYear,
  isSameDay,
  toISODate,
} from "../../utils/helpers";

type View = "month" | "week" | "day" | "timeline";
type Filter = "Semua Ruang & Alat" | RoomCategory;

const MAINTENANCE_STORAGE_KEY = "luminar_maintenance_blocks";

const views: { key: Exclude<View, "timeline">; label: string }[] = [
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

const filterDots: Record<Filter, string | null> = {
  "Semua Ruang & Alat": null,
  "Auditorium": "bg-brand",
  "Lab Komputer": "bg-emerald-500",
  "Ruang Kelas": "bg-teal-500",
  "Studio & Multimedia": "bg-indigo-500",
};

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
  { label: "Blokir / Pemeliharaan", dot: "bg-slate-500" },
];

const chipStyle: Record<EventKind, string> = {
  class: "border-emerald-200 bg-emerald-50 text-emerald-800",
  auditorium: "border-brand/25 bg-brand/10 text-brand",
  studio: "border-indigo-200 bg-indigo-50 text-indigo-700",
  maintenance: "border-slate-300 bg-slate-100 text-slate-700",
};

const chipSolid: Record<EventKind, string> = {
  class: "border-teal-600 bg-teal-600 text-white",
  auditorium: "border-brand bg-brand text-white",
  studio: "border-slate-800 bg-slate-800 text-white",
  maintenance: "border-slate-600 bg-slate-600 text-white",
};

function getStoredMaintenanceBlocks(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(MAINTENANCE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as CalendarEvent[]) : [];
  } catch {
    return [];
  }
}

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
  if (view === "month" || view === "timeline") return formatMonthYear(focus);
  if (view === "day") return formatLongDate(focus);
  const fmt = (d: Date) =>
    d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  return `${fmt(days[0])} – ${fmt(days[6])} ${days[6].getFullYear()}`;
}

export default function AdminCalendar() {
  const [view, setView] = useState<View>("month");
  const [focus, setFocus] = useState(() => new Date());
  const [filter, setFilter] = useState<Filter>("Semua Ruang & Alat");
  const [maintenanceBlocks, setMaintenanceBlocks] = useState<CalendarEvent[]>(
    getStoredMaintenanceBlocks,
  );
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );

  // Form state modal blokir jadwal
  const [blockTitle, setBlockTitle] = useState("");
  const [blockCategory, setBlockCategory] = useState<string>("Lab Komputer");
  const [blockDate, setBlockDate] = useState(() => toISODate(new Date()));
  const [blockStartTime, setBlockStartTime] = useState("08:00");
  const [blockEndTime, setBlockEndTime] = useState("17:00");
  const [blockError, setBlockError] = useState<string | null>(null);
  const [isSavingBlock, setIsSavingBlock] = useState(false);

  const today = new Date();
  const days = useMemo(() => buildDays(view, focus), [view, focus]);
  const { data: rawEvents } = useCalendarEvents(
    toISODate(days[0]),
    toISODate(days[days.length - 1]),
  );

  const mergedEvents = useMemo(() => {
    const apiList = Array.isArray(rawEvents) ? rawEvents : [];
    return [...apiList, ...maintenanceBlocks];
  }, [rawEvents, maintenanceBlocks]);

  const filteredEvents = useMemo(() => {
    return mergedEvents.filter(
      (e) =>
        filter === "Semua Ruang & Alat" ||
        e.category === null ||
        e.category === filter,
    );
  }, [mergedEvents, filter]);

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    filteredEvents.forEach((e) =>
      map.set(e.date, [...(map.get(e.date) ?? []), e]),
    );
    return map;
  }, [filteredEvents]);

  const timelineEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      return (a.time ?? "").localeCompare(b.time ?? "");
    });
  }, [filteredEvents]);

  const shift = (dir: 1 | -1) =>
    setFocus((f) => {
      if (view === "month" || view === "timeline")
        return new Date(f.getFullYear(), f.getMonth() + dir, 1);
      if (view === "week")
        return new Date(f.getFullYear(), f.getMonth(), f.getDate() + dir * 7);
      return new Date(f.getFullYear(), f.getMonth(), f.getDate() + dir);
    });

  const handleSaveBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlockError(null);

    if (blockTitle.trim().length < 3) {
      setBlockError("Keterangan pemeliharaan minimal 3 karakter.");
      return;
    }
    if (blockEndTime <= blockStartTime) {
      setBlockError("Jam selesai harus lebih akhir dari jam mulai.");
      return;
    }

    const newBlock: CalendarEvent = {
      id: `MNT-${Date.now().toString().slice(-5)}`,
      title: blockTitle.trim(),
      date: blockDate,
      time: `${blockStartTime}–${blockEndTime}`,
      kind: "maintenance",
      category:
        blockCategory === "Semua Fasilitas"
          ? null
          : (blockCategory as RoomCategory),
    };

    setIsSavingBlock(true);
    try {
      await axiosClient.post("/admin/events/block", newBlock);
    } catch {
      // Lanjutkan penyimpanan lokal saat backend offline
    } finally {
      const updated = [newBlock, ...maintenanceBlocks];
      setMaintenanceBlocks(updated);
      localStorage.setItem(MAINTENANCE_STORAGE_KEY, JSON.stringify(updated));
      setIsSavingBlock(false);
      setBlockTitle("");
      setIsBlockModalOpen(false);
    }
  };

  const handleDeleteBlock = (id: string) => {
    const updated = maintenanceBlocks.filter((item) => item.id !== id);
    setMaintenanceBlocks(updated);
    localStorage.setItem(MAINTENANCE_STORAGE_KEY, JSON.stringify(updated));
    setSelectedEvent(null);
  };

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
                type="button"
                aria-label="Sebelumnya"
                onClick={() => shift(-1)}
                className="px-3 py-2.5 hover:bg-slate-50 cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="min-w-[150px] px-2 text-center text-sm font-bold capitalize">
                {rangeLabel(view, focus, days)}
              </span>
              <button
                type="button"
                aria-label="Berikutnya"
                onClick={() => shift(1)}
                className="px-3 py-2.5 hover:bg-slate-50 cursor-pointer"
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
                  type="button"
                  role="tab"
                  aria-selected={view === v.key}
                  onClick={() => setView(v.key)}
                  className={cn(
                    "rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors cursor-pointer",
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

          <button
            type="button"
            onClick={() => {
              setBlockError(null);
              setIsBlockModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-brand transition-colors hover:bg-emerald-100 cursor-pointer"
          >
            <LockKeyhole className="size-4" /> Tambah Blokir / Pemeliharaan
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 border-y border-line px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="shrink-0 pr-1 text-xs font-semibold tracking-wide text-slate-500">
            KATEGORI:
          </span>
          {filters.map((f) => {
            const dot = filterDots[f];
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                  filter === f
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-slate-50 text-slate-700 hover:bg-slate-100",
                )}
              >
                {dot && (
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      filter === f ? "bg-white" : dot,
                    )}
                  />
                )}
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* Konten: Tampilan Timeline Penuh vs Grid Kalender */}
      {view === "timeline" ? (
        <div className="px-5 py-6 sm:px-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Agenda Kronologis ({timelineEvents.length} Jadwal Terdaftar)
            </h3>
          </div>

          {timelineEvents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line py-12 text-center text-sm text-slate-500">
              Tidak ada agenda peminjaman atau pemeliharaan pada kategori ini.
            </div>
          ) : (
            <div className="space-y-3">
              {timelineEvents.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-line bg-slate-50/60 p-4 transition hover:bg-slate-50 sm:flex-row sm:items-center cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-1 size-3 shrink-0 rounded-full",
                        ev.kind === "maintenance"
                          ? "bg-slate-500"
                          : ev.kind === "auditorium"
                            ? "bg-brand"
                            : ev.kind === "studio"
                              ? "bg-indigo-500"
                              : "bg-emerald-500",
                      )}
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {ev.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Kategori: {ev.category ?? "Semua Fasilitas"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
                    <span className="rounded-md border border-line bg-white px-2.5 py-1">
                      {ev.date}
                    </span>
                    {ev.time && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-brand">
                        <Clock className="size-3.5" /> {ev.time}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
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
                        type="button"
                        onClick={() => setSelectedEvent(e)}
                        title={`${e.time ?? ""} ${e.title}`.trim()}
                        className={cn(
                          "w-full truncate rounded-md border px-2 py-1 text-left text-xs font-semibold transition-opacity hover:opacity-85 cursor-pointer",
                          isToday ? chipSolid[e.kind] : chipStyle[e.kind],
                        )}
                      >
                        {e.time && <span className="mr-1">{e.time}</span>}
                        {e.title}
                      </button>
                    ))}
                    {hidden > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setFocus(d);
                          setView("day");
                        }}
                        className="px-1 text-left text-xs font-semibold text-brand hover:underline cursor-pointer"
                      >
                        +{hidden} lagi
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-col gap-2 border-t border-line px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <li className="font-bold">Keterangan Warna:</li>
          {legend.map((l) => (
            <li
              key={l.label}
              className="flex items-center gap-2 text-slate-600"
            >
              <span className={cn("size-2.5 rounded-full", l.dot)} />
              {l.label}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() =>
            setView((prev) => (prev === "timeline" ? "month" : "timeline"))
          }
          className="inline-flex items-center gap-2 font-semibold text-brand hover:underline cursor-pointer"
        >
          {view === "timeline" ? (
            <>
              <CalendarDays className="size-4" /> Kembali ke Tampilan Kalender
            </>
          ) : (
            <>
              <List className="size-4" /> Lihat Daftar Agenda
            </>
          )}
        </button>
      </div>

      {/* Modal Tambah Blokir / Pemeliharaan */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-line pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Tambah Blokir / Pemeliharaan
                </h3>
                <p className="text-xs text-slate-500">
                  Tandai jadwal perawatan ruang agar tidak bentrok dengan
                  pengajuan baru
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBlockModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBlock} className="mt-4 space-y-4">
              {blockError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                  {blockError}
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Keterangan / Nama Pemeliharaan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Maintenance AC Lab G1.4"
                  value={blockTitle}
                  onChange={(e) => setBlockTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Kategori Fasilitas
                  </label>
                  <select
                    value={blockCategory}
                    onChange={(e) => setBlockCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  >
                    <option value="Lab Komputer">Lab Komputer</option>
                    <option value="Auditorium">Auditorium</option>
                    <option value="Ruang Kelas">Ruang Kelas</option>
                    <option value="Studio & Multimedia">
                      Studio & Multimedia
                    </option>
                    <option value="Semua Fasilitas">Semua Fasilitas</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Tanggal Blokir
                  </label>
                  <input
                    type="date"
                    value={blockDate}
                    onChange={(e) => setBlockDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Jam Mulai
                  </label>
                  <input
                    type="time"
                    value={blockStartTime}
                    onChange={(e) => setBlockStartTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Jam Selesai
                  </label>
                  <input
                    type="time"
                    value={blockEndTime}
                    onChange={(e) => setBlockEndTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => setIsBlockModalOpen(false)}
                  className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingBlock}
                  className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
                >
                  {isSavingBlock ? "Menyimpan..." : "Simpan Blokir"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Jadwal Saat Chip Diklik */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase text-slate-600">
                  {selectedEvent.kind === "maintenance"
                    ? "Blokir Pemeliharaan"
                    : "Reservasi Terjadwal"}
                </span>
                <h4 className="mt-1.5 text-base font-bold text-slate-900">
                  {selectedEvent.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-4" />
              </button>
            </div>

            <dl className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-slate-500">Tanggal</dt>
                <dd className="font-semibold text-slate-800">
                  {selectedEvent.date}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Waktu</dt>
                <dd className="font-semibold text-slate-800">
                  {selectedEvent.time || "Seharian"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Kategori</dt>
                <dd className="font-semibold text-slate-800">
                  {selectedEvent.category ?? "Semua Fasilitas"}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex items-center justify-between gap-2">
              {selectedEvent.id.startsWith("MNT-") ? (
                <button
                  type="button"
                  onClick={() => handleDeleteBlock(selectedEvent.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 cursor-pointer"
                >
                  <Trash2 className="size-3.5" /> Hapus Blokir
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-dark cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
