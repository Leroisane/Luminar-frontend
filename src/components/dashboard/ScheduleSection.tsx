import { useMemo, useState, type FormEvent } from "react";
import {
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Grid,
  X,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useLembagaOptions,
  useRoomsList,
  useTimeSlotsConfig,
} from "../../hooks/useDashboardQueries";
import {
  createBookingApi,
  getRoomAvailabilityApi,
} from "../../api/facilityService";
import { getApiErrorMessage } from "../../api/axiosClient";
import { useAuthStore } from "../../store/useAuthStore";
import {
  cn,
  formatLongDate,
  formatMonthYear,
  getSemesterLabel,
  isSameDay,
  toISODate,
} from "../../utils/helpers";

interface Props {
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
}

const weekdays = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function generateHourlySlots(dayStart: string, dayEnd: string): string[] {
  const startHour = Number(dayStart.split(":")[0] || 7);
  const endHour = Number(dayEnd.split(":")[0] || 21);
  const result: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    result.push(`${String(h).padStart(2, "0")}:00`);
    result.push(`${String(h).padStart(2, "0")}:30`);
  }
  return result;
}

export default function ScheduleSection({ selectedDate, onSelectDate }: Props) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [viewMode, setViewMode] = useState<"calendar" | "matrix">("calendar");
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>("all");
  const [viewMonth, setViewMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  );

  // Quick slot booking modal
  const [quickSlot, setQuickSlot] = useState<{
    roomId: string;
    roomName: string;
    timeStart: string;
    timeEnd: string;
  } | null>(null);
  const [lembagaId, setLembagaId] = useState("");
  const [programKerja, setProgramKerja] = useState("");
  const [agenda, setAgenda] = useState("");
  const [participants, setParticipants] = useState("25");
  const [picPhone, setPicPhone] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const { data: rooms = [] } = useRoomsList();
  const { data: lembagaOptions = [] } = useLembagaOptions();
  const { data: timeConfig } = useTimeSlotsConfig();

  const dateISO = toISODate(selectedDate);
  const timeConfigObj = timeConfig as Record<string, string> | undefined;
  const timeRows = useMemo(
    () =>
      generateHourlySlots(
        timeConfigObj?.dayStart ?? "07:00",
        timeConfigObj?.dayEnd ?? "20:00",
      ),
    [timeConfigObj],
  );

  const visibleRooms = useMemo(() => {
    if (selectedRoomFilter === "all") return rooms;
    return rooms.filter((r) => r.id === selectedRoomFilter);
  }, [rooms, selectedRoomFilter]);

  // Ambil availability untuk ruangan yang sedang difilter pada tanggal terpilih
  const { data: availabilityMap = {}, isLoading: isLoadingAvail } = useQuery({
    queryKey: [
      "room-availability-matrix",
      dateISO,
      visibleRooms.map((r) => r.id),
    ],
    enabled: visibleRooms.length > 0,
    queryFn: async () => {
      const entries = await Promise.all(
        visibleRooms.slice(0, 12).map(async (room) => {
          try {
            const res = await getRoomAvailabilityApi(room.id, dateISO);
            const data = ((res?.data || res || {}) as unknown) as Record<string, unknown>;
            const booked = Array.isArray(data.booked_slots)
              ? data.booked_slots
              : Array.isArray(data.bookings)
                ? data.bookings
                : [];
            const free = Array.isArray(data.free_slots) ? data.free_slots : [];
            return [room.id, { booked, free }] as const;
          } catch {
            return [room.id, { booked: [], free: [] }] as const;
          }
        }),
      );
      return Object.fromEntries(entries);
    },
  });

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

  // Daftar agenda pada tanggal terpilih dari availabilityMap
  const dayAgendas = useMemo(() => {
    const list: {
      roomName: string;
      time: string;
      title: string;
      org: string;
    }[] = [];
    for (const room of visibleRooms) {
      const info = availabilityMap[room.id];
      if (!info?.booked) continue;
      for (const b of info.booked as Record<string, unknown>[]) {
        list.push({
          roomName: room.name,
          time: `${String(b.start_time ?? "08:00").slice(0, 5)} - ${String(b.end_time ?? "10:00").slice(0, 5)}`,
          title: String(
            b.agenda ??
              b.activity_name ??
              b.program_kerja ??
              "Kegiatan Terjadwal",
          ),
          org: String(b.lembaga_name ?? b.organization ?? "Lembaga FILKOM"),
        });
      }
    }
    return list;
  }, [visibleRooms, availabilityMap]);

  const isSlotBooked = (roomId: string, timeStr: string) => {
    const info = availabilityMap[roomId];
    if (!info?.booked) return false;
    return (info.booked as Record<string, unknown>[]).some((b) => {
      const s = String(b.start_time ?? "").slice(0, 5);
      const e = String(b.end_time ?? "").slice(0, 5);
      return s && e && timeStr >= s && timeStr < e;
    });
  };

  const handleQuickSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!quickSlot || isSubmitting) return;
    setIsSubmitting(true);
    setModalError(null);

    try {
      await createBookingApi({
        room_id: String(quickSlot.roomId),
        lembaga_id: String(lembagaId),
        program_kerja: programKerja.trim(),
        agenda: agenda.trim(),
        booking_date: dateISO,
        start_time: quickSlot.timeStart,
        end_time: quickSlot.timeEnd,
        participants: Number(participants) || 10,
        purpose: "Kegiatan",
        requester_contact: picPhone.trim(),
        document_url: documentUrl.trim() || "https://placeholder.url/doc",
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-bookings"] }),
        queryClient.invalidateQueries({
          queryKey: ["room-availability-matrix"],
        }),
      ]);

      setQuickSlot(null);
      setAgenda("");
      setProgramKerja("");
      setToastMsg("Pengajuan peminjaman berhasil dikirim!");
      document
        .getElementById("riwayat")
        ?.scrollIntoView({ behavior: "smooth" });
    } catch (err: unknown) {
      setModalError(getApiErrorMessage(err));
    } finally {
      window.setTimeout(() => setIsSubmitting(false), 2000);
    }
  };

  return (
    <section
      id="kalender"
      className="mx-auto w-full max-w-[1400px] px-4 pt-16 sm:px-6 lg:px-10"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Jadwal &amp; Ketersediaan Ruangan
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Pantau kalender agenda kegiatan atau matriks slot waktu kosong per
            ruangan
          </p>
        </div>

        {/* Switcher Kalender Kegiatan vs Matriks Slot Waktu */}
        <div className="inline-flex rounded-xl border border-line bg-white p-1 self-start">
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition cursor-pointer",
              viewMode === "calendar"
                ? "bg-brand text-white"
                : "text-slate-600 hover:text-ink",
            )}
          >
            <CalendarDays className="size-4" /> Kalender Kegiatan
          </button>
          <button
            type="button"
            onClick={() => setViewMode("matrix")}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition cursor-pointer",
              viewMode === "matrix"
                ? "bg-brand text-white"
                : "text-slate-600 hover:text-ink",
            )}
          >
            <Grid className="size-4" /> Matriks Slot Waktu
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-brand">
          <span>{toastMsg}</span>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {viewMode === "calendar" ? (
        <div className="mt-6 space-y-6">
          <div className="rounded-3xl border border-line bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setViewMonth(
                      new Date(
                        viewMonth.getFullYear(),
                        viewMonth.getMonth() - 1,
                        1,
                      ),
                    )
                  }
                  className="flex size-8 items-center justify-center rounded-lg border border-line hover:bg-slate-50 cursor-pointer"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <h3 className="min-w-[160px] text-center text-lg font-bold capitalize">
                  {formatMonthYear(viewMonth)}
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setViewMonth(
                      new Date(
                        viewMonth.getFullYear(),
                        viewMonth.getMonth() + 1,
                        1,
                      ),
                    )
                  }
                  className="flex size-8 items-center justify-center rounded-lg border border-line hover:bg-slate-50 cursor-pointer"
                >
                  <ChevronRight className="size-4" />
                </button>
                <span className="ml-2 hidden rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 sm:inline-block">
                  {getSemesterLabel(viewMonth)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">
                  Filter Ruangan:
                </span>
                <select
                  value={selectedRoomFilter}
                  onChange={(e) => setSelectedRoomFilter(e.target.value)}
                  className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-brand cursor-pointer"
                >
                  <option value="all">Semua Ruangan ({rooms.length})</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.building ? `(${r.building})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid Kalender */}
            <div className="mt-4 grid grid-cols-7 border-l border-t border-line">
              {weekdays.map((w, i) => (
                <div
                  key={w}
                  className={cn(
                    "border-b border-r border-line bg-slate-50 py-2 text-center text-xs font-bold",
                    i === 0 ? "text-red-500" : "text-slate-600",
                  )}
                >
                  {w}
                </div>
              ))}
              {days.map((d) => {
                const inMonth = d.getMonth() === viewMonth.getMonth();
                const selected = isSameDay(d, selectedDate);
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    onClick={() => onSelectDate(d)}
                    className={cn(
                      "flex min-h-[72px] flex-col items-start justify-between border-b border-r border-line p-2 text-left transition cursor-pointer",
                      selected
                        ? "bg-emerald-50/80 ring-2 ring-inset ring-brand"
                        : inMonth
                          ? "bg-white hover:bg-slate-50"
                          : "bg-slate-50/40 text-slate-300",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-md text-xs font-bold",
                        selected
                          ? "bg-brand text-white"
                          : inMonth
                            ? "text-ink"
                            : "text-slate-300",
                      )}
                    >
                      {d.getDate()}
                    </span>
                    {selected && (
                      <span className="mt-1 w-full truncate rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                        {isLoadingAvail
                          ? "Memuat..."
                          : `${dayAgendas.length} Agenda`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Panel Agenda Kegiatan pada Tanggal Terpilih */}
          <div className="rounded-3xl border border-line bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
              <h3 className="text-base font-bold text-ink">
                Agenda Kegiatan {formatLongDate(selectedDate)}
              </h3>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-brand">
                {dayAgendas.length} Kegiatan Terjadwal
              </span>
            </div>

            {isLoadingAvail ? (
              <div className="mt-4 h-20 animate-pulse rounded-xl bg-slate-100" />
            ) : dayAgendas.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">
                Tidak ada kegiatan yang dijadwalkan pada tanggal ini.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {dayAgendas.map((ag, idx) => (
                  <li
                    key={idx}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-ink">{ag.title}</p>
                      <p className="text-xs text-slate-500">
                        {ag.org} •{" "}
                        <strong className="text-brand">{ag.roomName}</strong>
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700">
                      <Clock className="size-3.5" /> {ag.time}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        /* Matriks Slot Waktu */
        <div className="mt-6 rounded-3xl border border-line bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-end gap-4 border-b border-line pb-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Tanggal
              </label>
              <input
                type="date"
                value={dateISO}
                onChange={(e) => {
                  if (e.target.value) onSelectDate(new Date(e.target.value));
                }}
                className="rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Ruangan
              </label>
              <select
                value={selectedRoomFilter}
                onChange={(e) => setSelectedRoomFilter(e.target.value)}
                className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-brand cursor-pointer"
              >
                <option value="all">Semua Ruangan</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-center text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700">
                  <th className="border border-line px-3 py-2.5 font-bold">
                    Waktu
                  </th>
                  {visibleRooms.slice(0, 8).map((r) => (
                    <th
                      key={r.id}
                      className="border border-line px-3 py-2.5 font-bold"
                    >
                      {r.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeRows.map((slotTime, rowIdx) => {
                  const nextSlot = timeRows[rowIdx + 1] ?? "21:00";
                  return (
                    <tr key={slotTime}>
                      <td className="border border-line bg-slate-50/70 px-3 py-2 font-mono font-bold text-slate-700">
                        {slotTime}
                      </td>
                      {visibleRooms.slice(0, 8).map((room) => {
                        const booked = isSlotBooked(room.id, slotTime);
                        return (
                          <td
                            key={room.id}
                            className="border border-line px-2 py-1.5"
                          >
                            {booked ? (
                              <span className="inline-block w-full rounded-md bg-amber-100 px-2 py-1 font-semibold text-amber-800">
                                Terisi
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setQuickSlot({
                                    roomId: room.id,
                                    roomName: room.name,
                                    timeStart: slotTime,
                                    timeEnd: nextSlot,
                                  })
                                }
                                className="w-full rounded-md bg-emerald-50 px-2 py-1 font-semibold text-brand transition hover:bg-brand hover:text-white cursor-pointer"
                              >
                                Tersedia
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Pengajuan Cepat dari Matriks Slot */}
      {quickSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={(e) => void handleQuickSubmit(e)}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-brand">
                  <CalendarCheck className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-ink">
                    Ajukan Peminjaman Ruangan
                  </h3>
                  <p className="text-xs text-slate-500">
                    {quickSlot.roomName} • {formatLongDate(selectedDate)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickSlot(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {modalError}
              </div>
            )}

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    Nama Pengaju
                  </label>
                  <input
                    disabled
                    value={user?.name ?? ""}
                    className="w-full rounded-xl border border-line bg-slate-50 px-3 py-2 text-slate-600"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    Kontak (WhatsApp / Line) *
                  </label>
                  <input
                    required
                    value={picPhone}
                    onChange={(e) => setPicPhone(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  Lembaga *
                </label>
                <select
                  required
                  value={lembagaId}
                  onChange={(e) => setLembagaId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand"
                >
                  <option value="">Pilih lembaga...</option>
                  {lembagaOptions.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    Program Kerja *
                  </label>
                  <input
                    required
                    value={programKerja}
                    onChange={(e) => setProgramKerja(e.target.value)}
                    placeholder="Nama program kerja"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    Jumlah Peserta *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={participants}
                    onChange={(e) => setParticipants(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  Agenda Kegiatan *
                </label>
                <input
                  required
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  placeholder="Contoh: Technical Meeting & Gladi Bersih"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    Waktu Mulai *
                  </label>
                  <input
                    type="time"
                    required
                    value={quickSlot.timeStart}
                    onChange={(e) =>
                      setQuickSlot({ ...quickSlot, timeStart: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    Waktu Selesai *
                  </label>
                  <input
                    type="time"
                    required
                    value={quickSlot.timeEnd}
                    onChange={(e) =>
                      setQuickSlot({ ...quickSlot, timeEnd: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  Link Dokumen Pendukung (Google Drive)
                </label>
                <input
                  type="url"
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuickSlot(null)}
                className="rounded-xl border border-line px-4 py-2 text-xs font-semibold text-slate-600 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
