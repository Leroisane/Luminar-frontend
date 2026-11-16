import { useMemo, useState, type FormEvent } from "react";
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  DoorOpen,
  Gavel,
  Terminal,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import { useSlots } from "../../hooks/useDashboardQueries";
import { useAuthStore } from "../../store/useAuthStore";
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
  const user = useAuthStore((state) => state.user);
  const [building, setBuilding] = useState<BuildingKey>("G");
  const [viewMonth, setViewMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  );
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [activityName, setActivityName] = useState("");
  const [picPhone, setPicPhone] = useState("");
  const [slotSuccessMsg, setSlotSuccessMsg] = useState<string | null>(null);

  const buildingIndex = buildings.findIndex((b) => b.key === building);
  const activeBuilding = buildings[buildingIndex];

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

  const handleConfirmSlotBooking = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !activityName.trim()) return;

    const ticketId = `REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const dateISO = toISODate(selectedDate);
    const nowText = new Date().toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const newTicket = {
      ticketId,
      status: "Menunggu Verifikasi",
      submittedAt: `${nowText} WIB`,
      activity: activityName.trim(),
      resources: `${selectedSlot.name} • ${activeBuilding.fullName}`,
      schedule: `${dateISO} • ${selectedSlot.time}`,
      steps: [
        {
          id: 1,
          title: "Pengajuan Diterima",
          state: "done",
          timestamp: nowText,
          note: `Diajukan oleh ${user?.name || "Mahasiswa FILKOM"}`,
        },
        {
          id: 2,
          title: "Verifikasi Admin Sarpras",
          state: "current",
          note: "Menunggu persetujuan Koordinator Sarpras",
        },
        {
          id: 3,
          title: "Penerbitan QR-Key & Surat Izin",
          state: "pending",
          description: "Otomatis terbit setelah disetujui",
        },
        {
          id: 4,
          title: "Check-in & Penggunaan Ruang",
          state: "pending",
          description: "Scan QR-Key di loket Gedung G Lt. 1",
        },
      ],
    };

    localStorage.setItem("luminar_latest_booking", JSON.stringify(newTicket));
    setSelectedSlot(null);
    setActivityName("");
    setPicPhone("");
    setSlotSuccessMsg(
      `Pengajuan slot ${selectedSlot.name} (${ticketId}) tercatat! Muat ulang atau cek bagian Riwayat Peminjaman di bawah.`,
    );
    document.getElementById("riwayat")?.scrollIntoView({ behavior: "smooth" });
  };

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

      {slotSuccessMsg && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-brand">
          <span>{slotSuccessMsg}</span>
          <button
            type="button"
            onClick={() => setSlotSuccessMsg(null)}
            className="text-brand/70 hover:text-brand cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

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
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                aria-label="Bulan sebelumnya"
                onClick={() => shiftMonth(-1)}
                className="flex size-8 items-center justify-center rounded-lg border border-line hover:bg-slate-50 cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Bulan berikutnya"
                onClick={() => shiftMonth(1)}
                className="flex size-8 items-center justify-center rounded-lg border border-line hover:bg-slate-50 cursor-pointer"
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
                type="button"
                role="tab"
                aria-selected={building === b.key}
                onClick={() => setBuilding(b.key)}
                className={cn(
                  "whitespace-nowrap rounded-lg py-1.5 text-xs font-semibold transition-colors sm:text-sm cursor-pointer",
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
                  type="button"
                  onClick={() => {
                    onSelectDate(d);
                    if (!inMonth)
                      setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                  }}
                  aria-pressed={selected}
                  className="group flex flex-col items-center gap-1 py-1 cursor-pointer"
                >
                  <span
                    className={cn(
                      "flex size-9 aspect-square items-center justify-center rounded-xl text-sm font-semibold transition-colors",
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
            <span className="whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
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
              <SlotRow
                key={slot.id}
                slot={slot}
                onSelect={() => setSelectedSlot(slot)}
              />
            ))}
          </ul>
        </div>
      </div>

      {/* Modal Pengajuan Cepat dari Slot Jadwal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleConfirmSlotBooking}
            className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between border-b border-line pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="flex size-10 aspect-square shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-brand">
                  <CalendarCheck className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Reservasi Slot Terpilih
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedSlot.name} • {selectedSlot.time}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSlot(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                <p>
                  <strong>Lokasi:</strong> {activeBuilding.fullName}
                </p>
                <p className="mt-0.5">
                  <strong>Tanggal:</strong> {formatLongDate(selectedDate)}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Nama Kegiatan / Organisasi *
                </label>
                <input
                  required
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                  placeholder="Contoh: Rapat Kerja BEM FILKOM / Study Jam GDGoC"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Nomor WhatsApp Penanggung Jawab *
                </label>
                <input
                  required
                  value={picPhone}
                  onChange={(e) => setPicPhone(e.target.value)}
                  placeholder="0812xxxxxxxx"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedSlot(null)}
                className="rounded-xl border border-line px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-dark cursor-pointer"
              >
                Kirim Pengajuan Slot
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

function SlotRow({ slot, onSelect }: { slot: TimeSlot; onSelect: () => void }) {
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
            "flex size-11 aspect-square shrink-0 items-center justify-center rounded-xl",
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
              <Clock className="size-3.5 shrink-0" /> {slot.time}
            </span>
            <span aria-hidden>•</span>
            <span>{slot.meta}</span>
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 self-end sm:self-auto">
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
          type="button"
          disabled={reserved}
          onClick={onSelect}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-lg border px-3.5 py-1.5 text-sm font-semibold transition-colors",
            reserved
              ? "cursor-not-allowed border-line bg-slate-100 text-slate-400"
              : "border-brand/40 text-brand hover:bg-brand hover:text-white cursor-pointer",
          )}
        >
          {reserved ? "Penuh" : "Pilih Slot"}
        </button>
      </div>
    </li>
  );
}
