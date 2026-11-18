import { useState, type FormEvent } from "react";
import { AlertCircle, Edit3, FileText, X, XCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import StatusBadge from "./StatusBadge";
import {
  useMyBookingsList,
  type BackendBookingItem,
} from "../../hooks/useDashboardQueries";
import {
  cancelBookingApi,
  resubmitBookingApi,
  updateRevisionBookingApi,
} from "../../api/facilityService";
import { getApiErrorMessage } from "../../api/axiosClient";
import type { SubmittedBooking } from "./BookingModal";
import { cn } from "../../utils/helpers";

interface StatusSectionProps {
  latestBooking: SubmittedBooking | null;
  onClearLatestBooking: () => void;
}

const statusTabs = [
  { key: "all", label: "Semua" },
  { key: "pending", label: "Menunggu" },
  { key: "perlu_revisi", label: "Perlu Revisi" },
  { key: "approved", label: "Disetujui" },
  { key: "rejected", label: "Ditolak" },
];

export default function StatusSection({
  onClearLatestBooking,
}: StatusSectionProps) {
  const queryClient = useQueryClient();
  const [statusTab, setStatusTab] = useState("all");
  const { data: bookings = [], isLoading } = useMyBookingsList(statusTab);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal Revisi
  const [revisionTarget, setRevisionTarget] =
    useState<BackendBookingItem | null>(null);
  const [revAgenda, setRevAgenda] = useState("");
  const [revDocUrl, setRevDocUrl] = useState("");
  const [isSubmittingRev, setIsSubmittingRev] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 4000);
  };

  const handleCancel = async (item: BackendBookingItem) => {
    if (!window.confirm(`Batalkan pengajuan ${item.ticketId}?`)) return;
    setErrorMsg(null);
    try {
      await cancelBookingApi(item.id);
      onClearLatestBooking();
      await queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      showToast(`Pengajuan ${item.ticketId} berhasil dibatalkan.`);
    } catch (err: unknown) {
      setErrorMsg(getApiErrorMessage(err));
    }
  };

  const handleResubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!revisionTarget || isSubmittingRev) return;
    setIsSubmittingRev(true);
    setErrorMsg(null);
    try {
      await updateRevisionBookingApi(revisionTarget.id, {
        agenda: revAgenda.trim() || revisionTarget.agenda,
        activity_name: revAgenda.trim() || revisionTarget.activity,
        document_url: revDocUrl.trim() || revisionTarget.documentUrl,
      });
      await resubmitBookingApi(revisionTarget.id);
      await queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      setRevisionTarget(null);
      showToast("Revisi berhasil disimpan dan diajukan ulang.");
    } catch (err: unknown) {
      setErrorMsg(getApiErrorMessage(err));
    } finally {
      setIsSubmittingRev(false);
    }
  };

  return (
    <section
      id="riwayat"
      className="mx-auto w-full max-w-[1400px] px-4 pb-20 pt-16 sm:px-6 lg:px-10"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Peminjaman Saya
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Atur peminjaman ruangan untuk kegiatan Anda, pantau revisi, dan
            unduh surat izin resmi
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusTab(tab.key)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer",
                statusTab === tab.key
                  ? "bg-brand text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {toastMsg && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-brand">
          {toastMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">
          {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div className="mt-6 h-56 animate-pulse rounded-3xl bg-slate-100" />
      ) : bookings.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-line bg-white p-14 text-center">
          <p className="text-sm font-semibold text-slate-600">
            Belum ada peminjaman ruangan.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Gunakan jadwal atau katalog di atas untuk mengajukan peminjaman
            baru.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {bookings.map((b) => {
            const raw = b.rawStatus.toLowerCase();
            const isApproved =
              raw.includes("approve") || raw.includes("setuju");
            const isRevision = raw.includes("revisi");
            const isPending = raw === "pending" || raw === "submitted";

            return (
              <article
                key={String(b.id)}
                className="rounded-2xl border border-line bg-white p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-700">
                      {b.ticketId}
                    </span>
                    <StatusBadge
                      tone={isApproved ? "green" : "amber"}
                      dot={false}
                    >
                      {b.status}
                    </StatusBadge>
                    <span className="text-xs text-slate-500">
                      {b.lembagaName}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-brand">
                    {b.schedule}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-[11px] font-medium text-slate-500">
                      Ruangan / Fasilitas
                    </p>
                    <p className="text-sm font-bold text-ink">{b.resources}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-500">
                      Agenda Kegiatan
                    </p>
                    <p className="text-sm font-bold text-ink">{b.activity}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-500">
                      Program Kerja
                    </p>
                    <p className="text-sm font-semibold text-slate-700">
                      {b.programKerja || "-"}
                    </p>
                  </div>
                </div>

                {b.revisionNote && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900">
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                    <div>
                      <p className="font-bold">Catatan Revisi dari Admin:</p>
                      <p>{b.revisionNote}</p>
                    </div>
                  </div>
                )}

                {b.rejectionReason && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-900">
                    <XCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
                    <div>
                      <p className="font-bold">Alasan Penolakan:</p>
                      <p>{b.rejectionReason}</p>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2.5 pt-2">
                  {b.finalLetterUrl && (
                    <a
                      href={b.finalLetterUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-dark"
                    >
                      <FileText className="size-3.5" /> Download Surat Final
                    </a>
                  )}

                  {isRevision && (
                    <button
                      type="button"
                      onClick={() => {
                        setRevisionTarget(b);
                        setRevAgenda(b.agenda ?? b.activity);
                        setRevDocUrl(b.documentUrl ?? "");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-700 cursor-pointer"
                    >
                      <Edit3 className="size-3.5" /> Perbaiki &amp; Ajukan Ulang
                    </button>
                  )}

                  {isPending && (
                    <button
                      type="button"
                      onClick={() => void handleCancel(b)}
                      className="ml-auto text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                    >
                      Batalkan Pengajuan
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal Revisi */}
      {revisionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={(e) => void handleResubmit(e)}
            className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink">
                Revisi Pengajuan ({revisionTarget.ticketId})
              </h3>
              <button
                type="button"
                onClick={() => setRevisionTarget(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  Agenda Kegiatan *
                </label>
                <input
                  required
                  value={revAgenda}
                  onChange={(e) => setRevAgenda(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  Link Berkas Revisi (Google Drive)
                </label>
                <input
                  type="url"
                  value={revDocUrl}
                  onChange={(e) => setRevDocUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRevisionTarget(null)}
                className="rounded-xl border border-line px-4 py-2 text-xs font-semibold text-slate-600 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmittingRev}
                className="rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingRev ? "Mengirim..." : "Simpan & Ajukan Ulang"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
