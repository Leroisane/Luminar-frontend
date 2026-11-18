import { useState, type FormEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Plus,
  Search,
  Upload,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  createManualBookingApi,
  exportAdminBookingsExcelApi,
  getLetterDraftApi,
  updateBookingStatusApi,
  uploadFinalLetterApi,
} from "../../api/adminService";
import { getApiErrorMessage } from "../../api/axiosClient";
import {
  useAdminBookingsPaginated,
  useAdminMasterLembaga,
  useAdminMasterRooms,
  type ExtendedAdminBooking,
} from "../../hooks/useAdminQueries";
import { cn } from "../../utils/helpers";

interface Props {
  globalSearch: string;
}

const statusOptions = [
  { value: "all", label: "Semua Status" },
  { value: "pending", label: "Menunggu Review" },
  { value: "review", label: "Sedang Direview" },
  { value: "perlu_revisi", label: "Perlu Revisi" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
  { value: "cancelled", label: "Dibatalkan" },
];

function getStatusBadgeStyle(raw: string): { label: string; cls: string } {
  const s = raw.toLowerCase();
  if (s.includes("approve") || s.includes("setuju"))
    return { label: "Disetujui", cls: "bg-emerald-50 text-brand" };
  if (s.includes("revisi"))
    return { label: "Perlu Revisi", cls: "bg-amber-50 text-amber-700" };
  if (s.includes("ttd") || s.includes("sign"))
    return { label: "Menunggu TTD", cls: "bg-orange-50 text-orange-700" };
  if (s.includes("reject") || s.includes("tolak"))
    return { label: "Ditolak", cls: "bg-red-50 text-red-600" };
  if (s.includes("cancel") || s.includes("batal"))
    return { label: "Dibatalkan", cls: "bg-slate-100 text-slate-500" };
  if (s.includes("review"))
    return { label: "Review", cls: "bg-sky-50 text-sky-700" };
  return { label: "Menunggu", cls: "bg-blue-50 text-blue-700" };
}

export default function AdminTableSection({ globalSearch }: Props) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const perPage = 20;
  const [statusFilter, setStatusFilter] = useState("all");
  const [localSearch, setLocalSearch] = useState("");
  const combinedSearch = `${globalSearch} ${localSearch}`.trim();

  const { data, isLoading } = useAdminBookingsPaginated({
    page,
    per_page: perPage,
    status: statusFilter,
    q: combinedSearch,
  });

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  // Modal Detail Peminjaman
  const [selectedReq, setSelectedReq] = useState<ExtendedAdminBooking | null>(
    null,
  );
  const [nextAction, setNextAction] = useState("");
  const [actionNote, setActionNote] = useState("");
  const [finalFile, setFinalFile] = useState<File | null>(null);
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  // Modal Tambah Manual Admin
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    applicant_name: "",
    contact: "",
    lembaga_id: "",
    program_kerja: "",
    agenda: "",
    room_id: "",
    date: "",
    participants: "1",
    start_time: "08:00",
    end_time: "12:00",
    purpose: "Kegiatan",
    document_url: "",
  });
  const [isSavingManual, setIsSavingManual] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: adminRooms } = useAdminMasterRooms(1, 100);
  const { data: adminLembaga } = useAdminMasterLembaga(1, 100);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  };

  const handleSaveStatus = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedReq || !nextAction || isSavingStatus) return;
    setIsSavingStatus(true);
    setErrorMsg(null);

    try {
      if (nextAction === "upload_final_letter") {
        if (!finalFile) {
          throw new Error("Pilih file PDF surat final terlebih dahulu.");
        }
        await uploadFinalLetterApi(selectedReq.backendId, finalFile);
      } else {
        await updateBookingStatusApi(selectedReq.backendId, {
          status: nextAction,
          note: actionNote.trim() || undefined,
          reason: actionNote.trim() || undefined,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      setSelectedReq(null);
      setNextAction("");
      setActionNote("");
      setFinalFile(null);
      showToast("Status pengajuan berhasil diperbarui.");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : getApiErrorMessage(err));
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleOpenDraft = async (id: string | number) => {
    try {
      const blob = await getLetterDraftApi(id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noreferrer");
    } catch (err: unknown) {
      setErrorMsg(getApiErrorMessage(err));
    }
  };

  const handleCreateManual = async (e: FormEvent) => {
    e.preventDefault();
    if (isSavingManual) return;
    setIsSavingManual(true);
    setErrorMsg(null);

    try {
      await createManualBookingApi({
        applicant_name: manualForm.applicant_name.trim(),
        contact: manualForm.contact.trim(),
        lembaga_id: Number(manualForm.lembaga_id) || manualForm.lembaga_id,
        program_kerja: manualForm.program_kerja.trim(),
        agenda: manualForm.agenda.trim(),
        activity_name: manualForm.agenda.trim(),
        room_id: Number(manualForm.room_id) || manualForm.room_id,
        date: manualForm.date,
        participants: Number(manualForm.participants) || 1,
        start_time: manualForm.start_time,
        end_time: manualForm.end_time,
        purpose: manualForm.purpose,
        document_url: manualForm.document_url.trim() || undefined,
      });

      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      setManualModalOpen(false);
      showToast("Reservasi manual admin berhasil disimpan.");
    } catch (err: unknown) {
      setErrorMsg(getApiErrorMessage(err));
    } finally {
      setIsSavingManual(false);
    }
  };

  return (
    <section className="rounded-2xl border border-line bg-white">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <label className="flex min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-line bg-slate-50 px-3.5 py-2 sm:max-w-sm">
            <Search className="size-4 text-slate-400" />
            <input
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari no. reservasi, program kerja, agenda..."
              className="w-full bg-transparent text-xs outline-none"
            />
          </label>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-brand cursor-pointer"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setManualModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-dark cursor-pointer"
          >
            <Plus className="size-4" /> Tambah Peminjaman
          </button>
          <button
            type="button"
            onClick={() =>
              void exportAdminBookingsExcelApi(
                statusFilter !== "all" ? { status: statusFilter } : undefined,
              )
            }
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
          >
            <Download className="size-4" /> Export Excel
          </button>
        </div>
      </div>

      {toast && (
        <div className="mx-5 mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-brand">
          {toast}
        </div>
      )}
      {errorMsg && (
        <div className="mx-5 mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Tabel */}
      <div className="overflow-x-auto border-t border-line">
        <table className="w-full min-w-[920px] text-left text-xs">
          <thead>
            <tr className="bg-slate-50/70 font-bold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3.5">Status</th>
              <th className="px-3 py-3.5">No.</th>
              <th className="px-3 py-3.5">Tanggal</th>
              <th className="px-3 py-3.5">Ruangan</th>
              <th className="px-3 py-3.5">Lembaga</th>
              <th className="px-3 py-3.5">Program Kerja</th>
              <th className="px-4 py-3.5">Agenda</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {isLoading && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400">
                  Memuat data peminjaman...
                </td>
              </tr>
            )}
            {!isLoading &&
              rows.map((r) => {
                const badge = getStatusBadgeStyle(r.rawStatus);
                return (
                  <tr
                    key={r.id}
                    onClick={() => {
                      setSelectedReq(r);
                      setNextAction("");
                      setActionNote("");
                      setFinalFile(null);
                    }}
                    className="cursor-pointer transition hover:bg-emerald-50/40"
                  >
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold",
                          badge.cls,
                        )}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-[11px] font-bold text-indigo-700">
                        {r.ticketCode}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-slate-600">
                      {r.date}
                    </td>
                    <td className="px-3 py-3.5 font-semibold text-ink">
                      {r.room}
                    </td>
                    <td className="px-3 py-3.5 font-semibold text-slate-700">
                      {r.org}
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-3.5 text-slate-700">
                      {r.programKerja}
                    </td>
                    <td className="max-w-[240px] truncate px-4 py-3.5 text-slate-600">
                      {r.agenda}
                    </td>
                  </tr>
                );
              })}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  Tidak ada data peminjaman yang ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-line px-5 py-3.5 text-xs text-slate-600">
        <span>
          Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong> (
          {total} total data)
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-line p-1.5 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg border border-line p-1.5 disabled:opacity-40 cursor-pointer"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Modal Detail Peminjaman & Ubah Status */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                    getStatusBadgeStyle(selectedReq.rawStatus).cls,
                  )}
                >
                  {getStatusBadgeStyle(selectedReq.rawStatus).label}
                </span>
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-[11px] font-bold text-indigo-700">
                  {selectedReq.ticketCode}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <dl className="mt-4 space-y-2.5 text-xs">
              <div>
                <dt className="font-bold text-slate-500">Ruangan</dt>
                <dd className="text-sm font-semibold text-ink">
                  {selectedReq.room}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="font-bold text-slate-500">Tanggal</dt>
                  <dd className="text-ink">{selectedReq.date}</dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-500">Waktu</dt>
                  <dd className="font-mono text-ink">{selectedReq.time}</dd>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="font-bold text-slate-500">Peserta</dt>
                  <dd className="text-ink">
                    {selectedReq.participants ?? "-"} orang
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-500">Keperluan</dt>
                  <dd className="text-ink">{selectedReq.purpose}</dd>
                </div>
              </div>
              <div>
                <dt className="font-bold text-slate-500">Agenda</dt>
                <dd className="text-ink">{selectedReq.agenda}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="font-bold text-slate-500">Program Kerja</dt>
                  <dd className="text-ink">{selectedReq.programKerja}</dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-500">Lembaga</dt>
                  <dd className="font-semibold text-ink">{selectedReq.org}</dd>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="font-bold text-slate-500">Nama Pengaju</dt>
                  <dd className="text-ink">{selectedReq.name}</dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-500">NIM / Identitas</dt>
                  <dd className="font-mono text-ink">
                    {selectedReq.identifier}
                  </dd>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="font-bold text-slate-500">Program Studi</dt>
                  <dd className="text-ink">{selectedReq.programStudy}</dd>
                </div>
                <div>
                  <dt className="font-bold text-slate-500">Contact</dt>
                  <dd className="text-ink">{selectedReq.contact}</dd>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                {selectedReq.documentUrl && (
                  <a
                    href={selectedReq.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
                  >
                    Link Berkas <ExternalLink className="size-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => void handleOpenDraft(selectedReq.backendId)}
                  className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:underline cursor-pointer"
                >
                  <FileText className="size-3.5" /> Draft Surat Resmi
                </button>
                {selectedReq.finalLetterUrl && (
                  <a
                    href={selectedReq.finalLetterUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
                  >
                    Download Surat Final <ExternalLink className="size-3.5" />
                  </a>
                )}
              </div>

              {selectedReq.revisionHistory && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
                  <p className="font-bold">Riwayat Revisi (Dari Admin)</p>
                  <p className="mt-1 whitespace-pre-line">
                    {selectedReq.revisionHistory}
                  </p>
                </div>
              )}

              {selectedReq.rejectionReason && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-900">
                  <p className="font-bold">Alasan Penolakan</p>
                  <p className="mt-1">{selectedReq.rejectionReason}</p>
                </div>
              )}
            </dl>

            {/* Form Ubah Status */}
            <form
              onSubmit={(e) => void handleSaveStatus(e)}
              className="mt-5 border-t border-line pt-4 text-xs"
            >
              <label className="mb-1.5 block font-bold text-slate-700">
                Ubah Status
              </label>
              <select
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand"
              >
                <option value="">-- Pilih Status --</option>
                <option value="review">Review</option>
                <option value="perlu_revisi">Minta Revisi</option>
                <option value="approve">Setujui</option>
                <option value="upload_final_letter">Upload Surat Final</option>
                <option value="hand_over">
                  Serah Terima Kunci (Hand Over)
                </option>
                <option value="return">Selesai / Pengembalian (Return)</option>
                <option value="reject">Tolak</option>
                <option value="cancel">Batalkan</option>
              </select>

              {(nextAction === "perlu_revisi" || nextAction === "reject") && (
                <textarea
                  required
                  rows={3}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder={
                    nextAction === "perlu_revisi"
                      ? "Tuliskan poin revisi yang harus diperbaiki pemohon..."
                      : "Tuliskan alasan penolakan..."
                  }
                  className="mt-2.5 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                />
              )}

              {nextAction === "upload_final_letter" && (
                <label className="mt-2.5 flex items-center justify-center gap-2 rounded-xl border border-dashed border-brand/50 bg-emerald-50/50 p-3 font-semibold text-brand cursor-pointer">
                  <Upload className="size-4" />
                  <span>
                    {finalFile
                      ? finalFile.name
                      : "Pilih File PDF Surat Final Bertanda Tangan"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFinalFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                </label>
              )}

              <div className="mt-4 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Pilih action dan klik simpan
                </span>
                <button
                  type="submit"
                  disabled={!nextAction || isSavingStatus}
                  className="rounded-xl bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark disabled:opacity-40 cursor-pointer"
                >
                  {isSavingStatus ? "Menyimpan..." : "Simpan Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Peminjaman Ruangan (Admin Manual) */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={(e) => void handleCreateManual(e)}
            className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-line bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink">
                Tambah Peminjaman Ruangan (Admin Manual)
              </h3>
              <button
                type="button"
                onClick={() => setManualModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  Nama Pemohon / Dosen / Panitia *
                </label>
                <input
                  required
                  value={manualForm.applicant_name}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      applicant_name: e.target.value,
                    })
                  }
                  placeholder="Contoh: Dr. Eng. Herman / Panitia Workshop..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  Kontak Pemohon / WhatsApp *
                </label>
                <input
                  required
                  value={manualForm.contact}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, contact: e.target.value })
                  }
                  placeholder="Contoh: 081234567890"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  Lembaga *
                </label>
                <select
                  required
                  value={manualForm.lembaga_id}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, lembaga_id: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand"
                >
                  <option value="">Pilih...</option>
                  {(adminLembaga?.items ?? []).map((l, i) => (
                    <option key={String(l.id ?? i)} value={String(l.id ?? "")}>
                      {String(l.name ?? "")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  Program Kerja / Nama Acara *
                </label>
                <input
                  required
                  value={manualForm.program_kerja}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      program_kerja: e.target.value,
                    })
                  }
                  placeholder="Nama kegiatan..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  Agenda *
                </label>
                <input
                  required
                  value={manualForm.agenda}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, agenda: e.target.value })
                  }
                  placeholder="Agenda acara..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  Ruangan *
                </label>
                <select
                  required
                  value={manualForm.room_id}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, room_id: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand"
                >
                  <option value="">Pilih...</option>
                  {(adminRooms?.items ?? []).map((rm, i) => (
                    <option
                      key={String(rm.id ?? i)}
                      value={String(rm.id ?? "")}
                    >
                      {String(rm.name ?? "")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    Tanggal Peminjaman *
                  </label>
                  <input
                    type="date"
                    required
                    value={manualForm.date}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, date: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    Jumlah Peserta
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={manualForm.participants}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        participants: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    Waktu Mulai *
                  </label>
                  <input
                    type="time"
                    required
                    value={manualForm.start_time}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        start_time: e.target.value,
                      })
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
                    value={manualForm.end_time}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, end_time: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  Link Dokumen (Google Drive, Opsional)
                </label>
                <input
                  type="url"
                  value={manualForm.document_url}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      document_url: e.target.value,
                    })
                  }
                  placeholder="https://drive.google.com/..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setManualModalOpen(false)}
                className="rounded-xl border border-line px-4 py-2 text-xs font-semibold text-slate-600 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSavingManual}
                className="rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-50 cursor-pointer"
              >
                {isSavingManual ? "Menyimpan..." : "Simpan Reservasi"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
