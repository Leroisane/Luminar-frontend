import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  X,
  Calendar,
  Clock,
  FileText,
  Building2,
  CheckCircle2,
  Users,
  Phone,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { createBookingApi } from "../../api/facilityService";
import { getApiErrorMessage } from "../../api/axiosClient";
import { useAuthStore } from "../../store/useAuthStore";
import {
  useLembagaOptions,
  useRoomsList,
} from "../../hooks/useDashboardQueries";
import type { BookingStep, Facility } from "../../types";
import { toISODate } from "../../utils/helpers";

const bookingSchema = z
  .object({
    room_id: z.string().min(1, "Pilih ruangan yang ingin dipinjam"),
    lembaga_id: z.string().min(1, "Pilih lembaga / organisasi pengaju"),
    program_kerja: z.string().min(3, "Nama program kerja wajib diisi"),
    agenda: z.string().min(4, "Agenda kegiatan minimal 4 karakter"),
    date: z.string().min(1, "Tanggal peminjaman wajib dipilih"),
    start_time: z.string().min(1, "Jam mulai wajib diisi"),
    end_time: z.string().min(1, "Jam selesai wajib diisi"),
    participants: z.string().min(1, "Jumlah peserta wajib diisi"),
    purpose: z.string().min(1, "Keperluan wajib dipilih"),
    pic_phone: z.string().min(8, "Nomor WhatsApp penanggung jawab wajib diisi"),
    document_url: z
      .string()
      .url("Masukkan tautan Google Drive / PDF yang valid (diawali https://)")
      .or(z.literal("")),
  })
  .refine((data) => data.end_time > data.start_time, {
    message: "Jam selesai harus lebih akhir dari jam mulai",
    path: ["end_time"],
  });

export type BookingFormValues = z.infer<typeof bookingSchema>;

export interface SubmittedBooking {
  ticketId: string;
  status: string;
  submittedAt: string;
  activity: string;
  resources: string;
  schedule: string;
  steps: BookingStep[];
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFacility: Facility | null;
  defaultDate: Date;
  onSuccess: (newBooking: SubmittedBooking) => void;
}

const PURPOSES = [
  "Kegiatan",
  "Rapat Koordinasi",
  "Latihan / Gladi",
  "Seminar / Workshop",
  "Lainnya",
];

function formatIndoDate(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dateObj = new Date(y, (m || 1) - 1, d || 1);
  return dateObj.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BookingModal({
  isOpen,
  onClose,
  selectedFacility,
  defaultDate,
  onSuccess,
}: BookingModalProps) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { data: rooms = [] } = useRoomsList();
  const { data: lembagaOptions = [] } = useLembagaOptions();

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<SubmittedBooking | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      room_id: "",
      lembaga_id: "",
      program_kerja: "",
      agenda: "",
      date: toISODate(defaultDate),
      start_time: "09:00",
      end_time: "12:00",
      participants: "25",
      purpose: "Kegiatan",
      pic_phone: "",
      document_url: "",
    },
  });

  useEffect(() => {
    setValue("date", toISODate(defaultDate));
    if (selectedFacility) {
      const matched = rooms.find(
        (r) =>
          r.id === String(selectedFacility.id) ||
          r.name.toLowerCase() === selectedFacility.name.toLowerCase(),
      );
      if (matched) {
        setValue("room_id", matched.id);
      }
    }
  }, [selectedFacility, defaultDate, rooms, setValue]);

  if (!isOpen) return null;

  const onSubmit = async (data: BookingFormValues) => {
    setSubmitError(null);

    try {
      const res = await createBookingApi({
        room_id: Number(data.room_id) || data.room_id,
        lembaga_id: Number(data.lembaga_id) || data.lembaga_id,
        program_kerja: data.program_kerja.trim(),
        agenda: data.agenda.trim(),
        activity_name: data.agenda.trim(),
        date: data.date,
        start_time: data.start_time,
        end_time: data.end_time,
        participants: Number(data.participants) || 10,
        purpose: data.purpose,
        pic_phone: data.pic_phone.trim(),
        document_url: data.document_url.trim() || undefined,
      });

      const created = (res?.data || res || {}) as Record<string, unknown>;
      const chosenRoom = rooms.find((r) => r.id === data.room_id);
      const chosenLembaga = lembagaOptions.find(
        (l) => l.id === data.lembaga_id,
      );

      const now = new Date();
      const nowTime = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const todayLabel = now.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      const formattedBooking: SubmittedBooking = {
        ticketId: String(
          created.ticket_code ??
            created.booking_code ??
            `REQ-${created.id ?? now.getTime().toString().slice(-4)}`,
        ),
        status: "Menunggu Verifikasi Admin",
        submittedAt: `${todayLabel}, ${nowTime} WIB`,
        activity: `${data.agenda} (${chosenLembaga?.name ?? data.program_kerja})`,
        resources:
          chosenRoom?.name ?? selectedFacility?.name ?? "Ruangan FILKOM",
        schedule: `${formatIndoDate(data.date)} • ${data.start_time} – ${data.end_time} WIB`,
        steps: [
          {
            id: 1,
            title: "Pengajuan Terkirim",
            state: "done",
            timestamp: `${todayLabel}, ${nowTime}`,
            note: `Diajukan oleh ${user?.name || "Mahasiswa"}`,
          },
          {
            id: 2,
            title: "Verifikasi Berkas & Jadwal",
            state: "current",
            timestamp: "",
            note: "Sedang ditinjau Admin Sarpras",
          },
          {
            id: 3,
            title: "Penerbitan Surat Izin Resmi",
            state: "pending",
            timestamp: "",
            note: "",
            description: "Terbit setelah disetujui koordinator",
          },
          {
            id: 4,
            title: "Siap Digunakan",
            state: "pending",
            timestamp: "",
            note: "",
            description: "Konfirmasi ke petugas loket Gedung G Lt. 1",
          },
      ],
      };

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-bookings"] }),
        queryClient.invalidateQueries({
          queryKey: ["room-availability-matrix"],
        }),
      ]);

      setCreatedTicket(formattedBooking);
    } catch (err: unknown) {
      setSubmitError(getApiErrorMessage(err));
    }
  };

  const handleFinish = () => {
    const ticket = createdTicket;
    setCreatedTicket(null);
    setSubmitError(null);
    reset();
    onClose();
    if (ticket) {
      onSuccess(ticket);
    }
  };

  const handleCancel = () => {
    setCreatedTicket(null);
    setSubmitError(null);
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-line bg-white p-6 shadow-xl sm:p-7">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-line pb-4">
          <div>
            <span className="inline-block rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-brand">
              Formulir Reservasi Sarpras
            </span>
            <h3 className="mt-1.5 text-xl font-extrabold text-slate-900">
              Ajukan Peminjaman Ruangan
            </h3>
            <p className="text-xs text-slate-500">
              Lengkapi detail jadwal dan dokumen pendukung kegiatan akademik
            </p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            aria-label="Tutup modal"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {createdTicket ? (
          <div className="space-y-4 py-8 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-brand">
              <CheckCircle2 className="size-8" />
            </div>
            <div className="space-y-1">
              <span className="rounded bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-bold text-slate-700">
                {createdTicket.ticketId}
              </span>
              <h4 className="pt-1 text-lg font-bold text-slate-900">
                Pengajuan Berhasil Dikirim!
              </h4>
              <p className="mx-auto max-w-sm text-xs text-slate-500">
                Permohonan untuk{" "}
                <strong className="text-slate-700">
                  {createdTicket.resources}
                </strong>{" "}
                telah masuk ke antrean verifikasi.
              </p>
            </div>
            <button
              type="button"
              onClick={handleFinish}
              className="mt-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark cursor-pointer"
            >
              Lihat Status Peminjaman
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
            {submitError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {submitError}
              </div>
            )}

            {/* Ruangan & Lembaga */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Building2 className="size-3.5 text-brand" />
                  Ruangan *
                </label>
                <select
                  {...register("room_id")}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                >
                  <option value="">-- Pilih Ruangan --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.building ? `(${r.building})` : ""}
                    </option>
                  ))}
                </select>
                {errors.room_id && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.room_id.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Lembaga / Organisasi *
                </label>
                <select
                  {...register("lembaga_id")}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                >
                  <option value="">-- Pilih Lembaga --</option>
                  {lembagaOptions.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                {errors.lembaga_id && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.lembaga_id.message}
                  </p>
                )}
              </div>
            </div>

            {/* Program Kerja & Agenda */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Program Kerja *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: RAION EXHIBITION 2026"
                  {...register("program_kerja")}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                {errors.program_kerja && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.program_kerja.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Agenda Kegiatan *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Gladi Bersih & Technical Meeting"
                  {...register("agenda")}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                {errors.agenda && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.agenda.message}
                  </p>
                )}
              </div>
            </div>

            {/* Tanggal & Jam */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Calendar className="size-3.5 text-brand" />
                  Tanggal *
                </label>
                <input
                  type="date"
                  {...register("date")}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                {errors.date && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.date.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Clock className="size-3.5 text-brand" />
                  Jam Mulai *
                </label>
                <input
                  type="time"
                  {...register("start_time")}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                {errors.start_time && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.start_time.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Clock className="size-3.5 text-brand" />
                  Jam Selesai *
                </label>
                <input
                  type="time"
                  {...register("end_time")}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                {errors.end_time && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.end_time.message}
                  </p>
                )}
              </div>
            </div>

            {/* Peserta, Keperluan, Kontak */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Users className="size-3.5 text-brand" />
                  Jumlah Peserta *
                </label>
                <input
                  type="number"
                  min={1}
                  {...register("participants")}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                {errors.participants && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.participants.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Keperluan *
                </label>
                <select
                  {...register("purpose")}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                >
                  {PURPOSES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Phone className="size-3.5 text-brand" />
                  No. WhatsApp PIC *
                </label>
                <input
                  type="tel"
                  placeholder="0812xxxxxxxx"
                  {...register("pic_phone")}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                {errors.pic_phone && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.pic_phone.message}
                  </p>
                )}
              </div>
            </div>

            {/* Link Dokumen */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <FileText className="size-3.5 text-brand" />
                Tautan Proposal / Surat Izin (Google Drive PDF)
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/file/d/..."
                {...register("document_url")}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              {errors.document_url && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.document_url.message}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 border-t border-line pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Mengirim..." : "Kirim Pengajuan"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
