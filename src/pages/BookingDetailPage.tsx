import { useParams, useNavigate } from "react-router-dom";
import { useBookingDetail } from "../hooks/useDashboardQueries";
import { useCancelBooking, useResubmitBooking } from "../hooks/useMutations";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import AlertMessage from "../components/ui/AlertMessage";
import StatusBadge from "../components/ui/StatusBadge";
import { useState } from "react";
import ConfirmDialog from "../components/ui/ConfirmDialog";

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: booking, isLoading, error } = useBookingDetail(id);
  const cancelMutation = useCancelBooking();
  const resubmitMutation = useResubmitBooking();
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (isLoading) return <LoadingSpinner size="lg" className="mt-20" />;
  if (error) return <AlertMessage message="Gagal memuat detail booking." />;
  if (!booking) return <AlertMessage message="Booking tidak ditemukan." />;

  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-2xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-sm text-indigo-600 hover:underline"
      >
        ← Kembali
      </button>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">
            {booking.ticket_code}
          </h1>
          <StatusBadge status={booking.status} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <p className="text-gray-400 text-xs uppercase mb-1">Ruangan</p>
            <p>{booking.room?.name ?? "-"}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase mb-1">Tanggal</p>
            <p>{booking.date}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase mb-1">Waktu</p>
            <p>{booking.start_time} – {booking.end_time}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase mb-1">Lembaga</p>
            <p>{booking.lembaga?.name ?? "-"}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-400 text-xs uppercase mb-1">Tujuan Kegiatan</p>
            <p>{booking.purpose}</p>
          </div>
          {booking.agenda && (
            <div className="col-span-2">
              <p className="text-gray-400 text-xs uppercase mb-1">Agenda</p>
              <p>{booking.agenda}</p>
            </div>
          )}
          {booking.revision_note && (
            <div className="col-span-2">
              <AlertMessage
                message={`Catatan revisi: ${booking.revision_note}`}
                type="warning"
              />
            </div>
          )}
          {booking.rejection_reason && (
            <div className="col-span-2">
              <AlertMessage
                message={`Alasan penolakan: ${booking.rejection_reason}`}
                type="error"
              />
            </div>
          )}
        </div>

        {booking.document_url && (
          <a
            href={booking.document_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm text-indigo-600 hover:underline"
          >
            📄 Lihat Dokumen Pengajuan
          </a>
        )}
        {booking.final_letter_url && (
          <a
            href={booking.final_letter_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm text-green-600 hover:underline"
          >
            📄 Unduh Surat Izin
          </a>
        )}

        {/* Aksi */}
        <div className="mt-6 flex gap-3">
          {booking.status === "perlu_revisi" && (
            <button
              onClick={() =>
                void resubmitMutation.mutateAsync(booking.id).then(() =>
                  navigate("/"),
                )
              }
              disabled={resubmitMutation.isPending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {resubmitMutation.isPending ? "Memproses..." : "Ajukan Ulang"}
            </button>
          )}
          {["pending", "review", "perlu_revisi"].includes(booking.status) && (
            <button
              onClick={() => setConfirmCancel(true)}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50"
            >
              Batalkan
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title="Batalkan Booking?"
        message="Booking yang dibatalkan tidak dapat dipulihkan."
        confirmLabel="Ya, Batalkan"
        danger
        isLoading={cancelMutation.isPending}
        onConfirm={() =>
          void cancelMutation
            .mutateAsync(booking.id)
            .then(() => navigate("/"))
            .finally(() => setConfirmCancel(false))
        }
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
}
