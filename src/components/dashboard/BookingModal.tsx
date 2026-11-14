import { useState } from "react";
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
} from "lucide-react";
import { axiosClient } from "../../api/axiosClient";
import { useAuthStore } from "../../store/useAuthStore";
import { useFacilities } from "../../hooks/useDashboardQueries";
import type { BookingStep, Facility } from "../../types";
import { toISODate } from "../../utils/helpers";

const bookingSchema = z
  .object({
    facilityId: z.string().optional(),
    facilityName: z
      .string()
      .min(1, "Pilih ruangan atau alat yang ingin dipinjam"),
    category: z.string().min(1, "Pilih kategori fasilitas"),
    activityName: z.string().min(4, "Nama kegiatan minimal 4 karakter"),
    organization: z.string().min(2, "Nama lembaga/kepanitiaan wajib diisi"),
    date: z.string().min(1, "Tanggal peminjaman wajib dipilih"),
    startTime: z.string().min(1, "Jam mulai wajib diisi"),
    endTime: z.string().min(1, "Jam selesai wajib diisi"),
    documentUrl: z
      .string()
      .url("Masukkan tautan Google Drive / PDF yang valid (diawali https://)")
      .or(z.literal("")),
    notes: z.string().optional(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "Jam selesai harus lebih akhir dari jam mulai",
    path: ["endTime"],
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

const FALLBACK_FACILITIES = [
  "Lab Komputer Jaringan (G1.4)",
  "Lab Pemrograman Dasar (G1.2)",
  "Auditorium Algoritma (G2)",
  "Ruang Kelas F3.1",
  "Studio Multimedia FILKOM",
  "Paket Audio System & Wireless Mic",
];

const CATEGORIES = [
  "Ruang Kuliah",
  "Laboratorium",
  "Peralatan Multimedia",
  "Audio System",
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

function buildBookingRecord(
  data: BookingFormValues,
  applicantName: string,
): SubmittedBooking {
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

  return {
    ticketId: `REQ-${now.getFullYear()}-${now.getTime().toString().slice(-4)}`,
    status: "Menunggu Verifikasi Admin",
    submittedAt: `${todayLabel}, ${nowTime} WIB`,
    activity: `${data.activityName} (${data.organization})`,
    resources: `${data.facilityName} • ${data.category}`,
    schedule: `${formatIndoDate(data.date)} • ${data.startTime} – ${data.endTime} WIB`,
    steps: [
      {
        id: 1,
        title: "Pengajuan Terkirim",
        state: "done",
        timestamp: `${todayLabel}, ${nowTime}`,
        note: `Diajukan oleh ${applicantName}`,
      },
      {
        id: 2,
        title: "Verifikasi Berkas & Jadwal",
        state: "current",
        timestamp: "",
        note: "Sedang ditinjau Admin Sarpras",
        description: "Pengecekan ketersediaan ruang & surat izin kegiatan",
      },
      {
        id: 3,
        title: "Persetujuan Kasubbag Umum",
        state: "pending",
        timestamp: "",
        note: "",
        description: "Penerbitan surat izin pemakaian fasilitas",
      },
      {
        id: 4,
        title: "Siap Digunakan (QR Check-in)",
        state: "pending",
        timestamp: "",
        note: "",
        description: "Tunjukkan QR Code ke petugas gedung saat hari-H",
      },
    ],
  };
}

export default function BookingModal({
  isOpen,
  onClose,
  selectedFacility,
  defaultDate,
  onSuccess,
}: BookingModalProps) {
  const user = useAuthStore((state) => state.user);
  const { data: facilities = [] } = useFacilities();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<SubmittedBooking | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      facilityId: selectedFacility?.id ? String(selectedFacility.id) : "",
      facilityName: selectedFacility?.name ?? "",
      category: selectedFacility?.category ?? "Ruang Kuliah",
      activityName: "",
      organization: "",
      date: toISODate(defaultDate),
      startTime: "09:00",
      endTime: "12:00",
      documentUrl: "",
      notes: "",
    },
  });

  if (!isOpen) return null;

  const facilityNames =
    facilities.length > 0 ? facilities.map((f) => f.name) : FALLBACK_FACILITIES;

  const onSubmit = async (data: BookingFormValues) => {
    setSubmitError(null);
    const formattedBooking = buildBookingRecord(
      data,
      user?.name || "Mahasiswa",
    );

    try {
      await axiosClient.post("/api/v1/bookings", data);
      localStorage.setItem(
        "luminar_latest_booking",
        JSON.stringify(formattedBooking),
      );
      setCreatedTicket(formattedBooking);
    } catch (err: unknown) {
      if (import.meta.env.DEV) {
        localStorage.setItem(
          "luminar_latest_booking",
          JSON.stringify(formattedBooking),
        );
        setCreatedTicket(formattedBooking);
        return;
      }

      const apiErr = err as { response?: { data?: { message?: string } } };
      setSubmitError(
        apiErr?.response?.data?.message ||
          "Gagal mengirim pengajuan peminjaman. Coba beberapa saat lagi.",
      );
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
              Ajukan Peminjaman Fasilitas
            </h3>
            <p className="text-xs text-slate-500">
              Lengkapi detail jadwal dan dokumen pendukung kegiatan akademik
            </p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            aria-label="Tutup modal"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
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
              className="mt-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
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

            {/* Fasilitas & Kategori */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Building2 className="size-3.5 text-brand" />
                  Ruangan / Alat
                </label>
                <select
                  {...register("facilityName")}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                >
                  <option value="">-- Pilih Fasilitas --</option>
                  {selectedFacility &&
                    !facilityNames.includes(selectedFacility.name) && (
                      <option value={selectedFacility.name}>
                        {selectedFacility.name}
                      </option>
                    )}
                  {facilityNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                {errors.facilityName && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.facilityName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Kategori Sarpras
                </label>
                <select
                  {...register("category")}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Nama Kegiatan & Organisasi */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Nama Kegiatan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Study Jam Web Dev"
                  {...register("activityName")}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                {errors.activityName && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.activityName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Organisasi / Kepanitiaan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: BEM FILKOM / GDGoC"
                  {...register("organization")}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                {errors.organization && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.organization.message}
                  </p>
                )}
              </div>
            </div>

            {/* Tanggal & Jam */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Calendar className="size-3.5 text-brand" />
                  Tanggal
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
                  Jam Mulai
                </label>
                <input
                  type="time"
                  {...register("startTime")}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                {errors.startTime && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.startTime.message}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Clock className="size-3.5 text-brand" />
                  Jam Selesai
                </label>
                <input
                  type="time"
                  {...register("endTime")}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                {errors.endTime && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.endTime.message}
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
                {...register("documentUrl")}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              {errors.documentUrl && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.documentUrl.message}
                </p>
              )}
            </div>

            {/* Catatan Tambahan */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Kebutuhan Tambahan (Opsional)
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Butuh akses AC dan 2 mikrofon wireless"
                {...register("notes")}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 border-t border-line pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
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
