import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  DoorOpen,
  Gavel,
  Terminal,
  Video,
  type LucideIcon,
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import { useSlots } from "../../hooks/useDashboardQueries";
import type { BuildingKey, DayStatus, SlotIcon, TimeSlot } from "../../types";
import {
  cn,
  formatLongDate,
  formatMonthYear,
  getMockDayStatus,
  getSemesterLabel,
  isSameDay,
  toISODate,
} from "../../utils/helpers";

interface Props {
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
}

const buildings: { key: BuildingKey; label: string; fullName: string }[] = [
  { key: "G", label: "Gedung G", fullName: "Gedung G FILKOM" },
  { key: "F", label: "Gedung F", fullName: "Gedung F FILKOM" },
  { key: "Kreatif", label: "Gd. Kreatif", fullName: "Gedung Kreatif FILKOM" },
];

const weekdays = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const dotColor: Record<DayStatus, string> = {
  available: "bg-emerald-500",
  partial: "bg-amber-500",
  full: "bg-slate-300",
};

const slotIcons: Record<SlotIcon, LucideIcon> = {
  auditorium: DoorOpen,
  lab: Terminal,
  camera: Video,
  gavel: Gavel,
};

const legend = [
  { label: "Tersedia", color: "bg-emerald-500" },
  { label: "Terisi Sebagian", color: "bg-amber-500" },
  { label: "Penuh/Libur", color: "bg-slate-300" },
];

export default function ScheduleSection({ selectedDate, onSelectDate }: Props) {
  const [building, setBuilding] = useState<BuildingKey>("G");
  const [viewMonth, setViewMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  );

  const buildingIndex = buildings.findIndex((b) => b.key === building);
  const activeBuilding = buildings[buildingIndex];

  // Grid kalender: selalu mulai dari hari Minggu, termasuk hari bulan lain
  const days = useMemo(() => {
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const last = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    const total = Math.ceil((first.getDay() + last.getDate()) / 7) * 7;
    return Array.from({ length: total }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [viewMonth]);

  const shiftMonth = (delta: number) =>
    setViewMonth(
      new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1),
    );

  const { data: slots = [], isLoading } = useSlots(
    toISODate(selectedDate),
    building,
  );

  return (
    <section
      id="kalender"
      className="mx-auto w-full max-w-[1400px] px-4 pt-16 sm:px-6 lg:px-10"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Cek Jadwal &amp; Ketersediaan
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Pantau okupansi ruangan dan alat secara real-time sebelum melakukan
            pengajuan
          </p>
        </div>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-600">
          {legend.map((l) => (
            <li key={l.label} className="flex items-center gap-1.5">
              <span className={cn("size-2.5 rounded-full", l.color)} />
              {l.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Calendar card */}
        <div className="rounded-3xl border border-line bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-bold capitalize">
                {formatMonthYear(viewMonth)}
              </h3>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                {getSemesterLabel(viewMonth)}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                aria-label="Bulan sebelumnya"
                onClick={() => shiftMonth(-1)}
                className="flex size-8 items-center justify-center rounded-lg border border-line hover:bg-slate-50"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                aria-label="Bulan berikutnya"
                onClick={() => shiftMonth(1)}
                className="flex size-8 items-center justify-center rounded-lg border border-line hover:bg-slate-50"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          {/* Building tabs */}
          <div
            role="tablist"
            className="mt-4 grid grid-cols-3 rounded-xl bg-slate-100 p-1"
          >
            {buildings.map((b) => (
              <button
                key={b.key}
                role="tab"
                aria-selected={building === b.key}
                onClick={() => setBuilding(b.key)}
                className={cn(
                  "rounded-lg py-1.5 text-sm font-semibold transition-colors",
                  building === b.key
                    ? "bg-white text-ink shadow-sm"
                    : "text-slate-500 hover:text-ink",
                )}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="mt-5 grid grid-cols-7 gap-y-1.5 text-center">
            {weekdays.map((w, i) => (
              <span
                key={w}
                className={cn(
                  "pb-2 text-xs font-semibold",
                  i === 0 ? "text-red-500" : "text-slate-600",
                )}
              >
                {w}
              </span>
            ))}

            {days.map((d) => {
              const inMonth = d.getMonth() === viewMonth.getMonth();
              const selected = isSameDay(d, selectedDate);
              const status = getMockDayStatus(d, buildingIndex);
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => {
                    onSelectDate(d);
                    if (!inMonth)
                      setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                  }}
                  aria-pressed={selected}
                  className="group flex flex-col items-center gap-1 py-1"
                >
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-xl text-sm font-semibold transition-colors",
                      selected
                        ? "bg-brand text-white"
                        : inMonth
                          ? d.getDay() === 0
                            ? "text-red-500 group-hover:bg-slate-100"
                            : "text-ink group-hover:bg-slate-100"
                          : "text-slate-300",
                    )}
                  >
                    {d.getDate()}
                  </span>
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      selected && inMonth ? "bg-accent" : dotColor[status],
                      !inMonth && "opacity-40",
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Slots card */}
        <div className="rounded-3xl border border-line bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
            <div>
              <h3 className="text-xl font-bold">Slot Waktu Tersedia</h3>
              <p className="mt-0.5 text-sm text-slate-600">
                {formatLongDate(selectedDate)} • {activeBuilding.fullName}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {slots.length} Pilihan Terkini
            </span>
          </div>

          <ul className="mt-4 flex flex-col gap-3">
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <li
                  key={i}
                  className="h-[72px] animate-pulse rounded-2xl bg-slate-100"
                />
              ))}
            {!isLoading && slots.length === 0 && (
              <li className="rounded-2xl border border-dashed border-line py-10 text-center text-sm text-slate-500">
                Belum ada slot pada tanggal ini. Coba pilih tanggal lain.
              </li>
            )}
            {slots.map((slot) => (
              <SlotRow key={slot.id} slot={slot} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function SlotRow({ slot }: { slot: TimeSlot }) {
  const Icon = slotIcons[slot.icon];
  const reserved = slot.status === "reserved";

  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-line p-4 sm:flex-row sm:items-center sm:justify-between",
        reserved ? "bg-slate-50" : "bg-white",
      )}
    >
      <div
        className={cn(
          "flex min-w-0 items-center gap-4",
          reserved && "opacity-70",
        )}
      >
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            reserved
              ? "bg-amber-50 text-amber-700"
              : "bg-emerald-50 text-emerald-700",
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-bold leading-snug">{slot.name}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs font-medium text-slate-600">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" /> {slot.time}
            </span>
            <span aria-hidden>•</span>
            <span>{slot.meta}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto">
        {slot.status === "available" && (
          <StatusBadge tone="green">Tersedia</StatusBadge>
        )}
        {slot.status === "units" && (
          <StatusBadge tone="green">Tersedia {slot.units} Unit</StatusBadge>
        )}
        {reserved && (
          <StatusBadge tone="amber">Dipesan - {slot.reservedBy}</StatusBadge>
        )}

        <button
          disabled={reserved}
          className={cn(
            "rounded-lg border px-3.5 py-1.5 text-sm font-semibold transition-colors",
            reserved
              ? "cursor-not-allowed border-line bg-slate-100 text-slate-400"
              : "border-brand/40 text-brand hover:bg-brand hover:text-white",
          )}
        >
          {reserved ? "Penuh" : "Pilih Slot"}
        </button>
      </div>
    </li>
  );
}
