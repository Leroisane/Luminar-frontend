import { useState, type FormEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Plus,
  Printer,
  Search,
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
  globalSearch?: string;
}

const statusOptions = [
  { value: "all", label: "Semua Status" },
  { value: "diajukan", label: "Diajukan" },
  { value: "direview", label: "Sedang Direview" },
  { value: "perlu_revisi", label: "Perlu Revisi" },
  { value: "menunggu_ttd", label: "Menunggu TTD" },
  { value: "disetujui", label: "Disetujui" },
  { value: "ditolak", label: "Ditolak" },
  { value: "dibatalkan", label: "Dibatalkan" },
];

export interface StatusActionOption {
  value:
    | "review"
    | "request_revision"
    | "approve"
    | "upload_final_letter"
    | "reject"
    | "cancel";
  label: string;
  description: string;
  requiresNote?: boolean;
}

export function getAllowedActionsForStatus(
  rawStatus?: string,
): StatusActionOption[] {
  const s = (rawStatus ?? "").toLowerCase();

  switch (s) {
    case "diajukan":
    case "pending":
      return [
        {
          value: "review",
          label: "Mulai Review (Ulas Permohonan)",
          description: "Mengubah status menjadi 'Sedang Direview'.",
        },
        {
          value: "request_revision",
          label: "Minta Revisi",
          description:
            "Meminta pemohon memperbaiki berkas/data (wajib catatan min 5 karakter).",
          requiresNote: true,
        },
        {
          value: "reject",
          label: "Tolak Pengajuan",
          description:
            "Menolak permohonan peminjaman ruangan (wajib alasan penolakan min 5 karakter).",
          requiresNote: true,
        },
        {
          value: "cancel",
          label: "Batalkan Peminjaman",
          description: "Membatalkan peminjaman ruangan ini.",
        },
      ];

    case "direview":
    case "review":
      return [
        {
          value: "approve",
          label: "Setujui Permohonan (Lanjut Menunggu TTD)",
          description:
            "Menyetujui permohonan dan melanjutkan ke proses penandatanganan surat resmi.",
        },
        {
          value: "request_revision",
          label: "Minta Revisi",
          description:
            "Meminta pemohon memperbaiki berkas/data (wajib catatan min 5 karakter).",
          requiresNote: true,
        },
        {
          value: "reject",
          label: "Tolak Pengajuan",
          description:
            "Menolak permohonan peminjaman ruangan (wajib alasan penolakan min 5 karakter).",
          requiresNote: true,
        },
        {
          value: "cancel",
          label: "Batalkan Peminjaman",
          description: "Membatalkan peminjaman ruangan ini.",
        },
      ];

    case "menunggu_ttd":
      return [
        {
          value: "upload_final_letter",
          label: "Unggah Link Surat Final (Persetujuan Lengkap)",
          description:
            "Memasukkan link Google Drive surat izin resmi yang telah ditandatangani.",
        },
        {
          value: "reject",
          label: "Tolak Pengajuan",
          description:
            "Menolak permohonan peminjaman ruangan (wajib alasan penolakan min 5 karakter).",
          requiresNote: true,
        },
        {
          value: "cancel",
          label: "Batalkan Peminjaman",
          description: "Membatalkan peminjaman ruangan ini.",
        },
      ];

    case "perlu_revisi":
      return [
        {
          value: "reject",
          label: "Tolak Pengajuan",
          description:
            "Menolak permohonan yang belum kunjung direvisi (wajib alasan min 5 karakter).",
          requiresNote: true,
        },
        {
          value: "cancel",
          label: "Batalkan Peminjaman",
          description: "Membatalkan peminjaman ruangan ini.",
        },
      ];

    case "disetujui":
    case "approved":
      return [
        {
          value: "cancel",
          label: "Batalkan Peminjaman",
          description: "Membatalkan peminjaman yang sebelumnya sudah disetujui.",
        },
      ];

    case "ditolak":
    case "rejected":
    case "dibatalkan":
    case "cancelled":
    default:
      return [];
  }
}

const OPERATIONAL_TIME_SLOTS = [
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
];

function getStatusBadgeStyle(raw: string): { label: string; cls: string } {
  const s = (raw ?? "").toLowerCase();
  if (s === "disetujui" || s.includes("approve") || s.includes("setuju"))
    return { label: "Disetujui", cls: "bg-emerald-50 text-brand" };
  if (s === "perlu_revisi" || s.includes("revisi"))
    return { label: "Perlu Revisi", cls: "bg-amber-50 text-amber-700" };
  if (s === "menunggu_ttd" || s.includes("ttd") || s.includes("sign"))
    return { label: "Menunggu TTD", cls: "bg-orange-50 text-orange-700" };
  if (s === "ditolak" || s.includes("reject") || s.includes("tolak"))
    return { label: "Ditolak", cls: "bg-red-50 text-red-600" };
  if (s === "dibatalkan" || s.includes("cancel") || s.includes("batal"))
    return { label: "Dibatalkan", cls: "bg-slate-100 text-slate-500" };
  if (s === "direview" || s.includes("review"))
    return { label: "Sedang Direview", cls: "bg-sky-50 text-sky-700" };
  return { label: "Diajukan", cls: "bg-blue-50 text-blue-700" };
}

const initialManualForm = {
  applicant_name: "",
  contact: "",
  nim: "",
  prodi: "",
  lembaga_id: "",
  program_kerja: "",
  agenda: "",
  room_id: "",
  date: new Date().toISOString().split("T")[0],
  participants: "1",
  start_time: "08:00",
  end_time: "12:00",
  purpose: "Kegiatan",
  document_url: "",
};

export default function AdminTableSection({ globalSearch = "" }: Props) {
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
  const [finalLetterUrl, setFinalLetterUrl] = useState("");
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  // Modal Tambah Manual Admin
  const [manualModalOpen, setManualModalOpen] = useState(false);

  // Modal Draft Surat
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [letterNumber, setLetterNumber] = useState("0412/UN10.F15.01/TU/2026");
  const [letterActivity, setLetterActivity] = useState("");
  const [letterOrg, setLetterOrg] = useState("");
  const [letterFacility, setLetterFacility] = useState("");
  const [letterSchedule, setLetterSchedule] = useState("");

  const handleOpenDraftModal = (req: ExtendedAdminBooking) => {
    setLetterNumber(`0412/UN10.F15.01/TU/${new Date().getFullYear()}`);
    setLetterOrg(req.org || "Organisasi Mahasiswa FILKOM UB");
    setLetterActivity(req.purpose || req.agenda || "Kegiatan Kemahasiswaan");
    setLetterFacility(req.room || "Fasilitas Sarpras FILKOM");
    setLetterSchedule(`${req.date} • ${req.time} WIB`);
    setDraftModalOpen(true);
  };

  const handlePrintLetter = () => {
    document.body.classList.add("printing-letter");
    const cleanup = () => {
      document.body.classList.remove("printing-letter");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
    window.setTimeout(cleanup, 1000);
  };
  const [manualForm, setManualForm] = useState(initialManualForm);
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
        const url = finalLetterUrl.trim();
        if (
          !url ||
          (!url.startsWith("http://") && !url.startsWith("https://"))
        ) {
          throw new Error(
            "Link surat final wajib diisi dengan URL valid (http:// atau https://).",
          );
        }
        await uploadFinalLetterApi(selectedReq.backendId, url);
      } else {
        const note = actionNote.trim();
        if (
          (nextAction === "request_revision" || nextAction === "reject") &&
          note.length < 5
        ) {
          throw new Error(
            "Catatan wajib diisi minimal 5 karakter untuk aksi revisi dan penolakan.",
          );
        }
        await updateBookingStatusApi(selectedReq.backendId, {
          action:
            nextAction as import("../../api/adminService").UpdateBookingStatusPayload["action"],
          note: note || undefined,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      setSelectedReq(null);
      setNextAction("");
      setActionNote("");
      setFinalLetterUrl("");
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
      const applicantName = manualForm.applicant_name.trim();
      const contact = manualForm.contact.trim();
      const programKerja = manualForm.program_kerja.trim();
      const agenda = manualForm.agenda.trim();
      const docUrl = manualForm.document_url.trim();

      if (applicantName.length < 3) {
        throw new Error("Nama pemohon wajib diisi minimal 3 karakter.");
      }
      if (contact.length < 5) {
        throw new Error("Kontak pemohon wajib diisi minimal 5 karakter.");
      }
      if (!manualForm.lembaga_id) {
        throw new Error("Pilih lembaga terlebih dahulu.");
      }
      if (!manualForm.room_id) {
        throw new Error("Pilih ruangan terlebih dahulu.");
      }
      if (programKerja.length < 3) {
        throw new Error("Program kerja wajib diisi minimal 3 karakter.");
      }
      if (agenda.length < 3) {
        throw new Error("Agenda acara wajib diisi minimal 3 karakter.");
      }
      if (manualForm.start_time >= manualForm.end_time) {
        throw new Error("Waktu selesai harus setelah waktu mulai.");
      }
      if (
        docUrl &&
        !docUrl.startsWith("http://") &&
        !docUrl.startsWith("https://")
      ) {
        throw new Error(
          "Link dokumen harus berupa URL valid dengan awalan http:// atau https://",
        );
      }

      await createManualBookingApi({
        requester_name: applicantName,
        requester_contact: contact,
        requester_nim: manualForm.nim.trim() || undefined,
        requester_prodi: manualForm.prodi.trim() || undefined,
        lembaga_id: String(manualForm.lembaga_id),
        program_kerja: programKerja,
        agenda: agenda,
        room_id: String(manualForm.room_id),
        booking_date: manualForm.date,
        start_time: manualForm.start_time,
        end_time: manualForm.end_time,
        participants: Number(manualForm.participants) || 1,
        purpose: manualForm.purpose.trim() || "Kegiatan",
        document_url: docUrl || undefined,
      });

      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      setManualModalOpen(false);
      setManualForm(initialManualForm);
      showToast("Peminjaman manual admin berhasil disimpan.");
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
                      setFinalLetterUrl("");
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
                  onClick={() => handleOpenDraftModal(selectedReq)}
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
            {(() => {
              const allowedActions = getAllowedActionsForStatus(
                selectedReq.rawStatus,
              );
              const selectedAction = allowedActions.find(
                (a) => a.value === nextAction,
              );

              return (
                <form
                  onSubmit={(e) => void handleSaveStatus(e)}
                  className="mt-5 border-t border-line pt-4 text-xs"
                >
                  <label className="mb-1.5 block font-bold text-slate-700">
                    Ubah Status Peminjaman
                  </label>

                  {allowedActions.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-600">
                      <p className="font-semibold text-slate-700">
                        Status Akhir (Terminal)
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Peminjaman dengan status ini telah selesai diproses dan
                        tidak memiliki aksi transisi lanjutan.
                      </p>
                    </div>
                  ) : (
                    <>
                      <select
                        value={nextAction}
                        onChange={(e) => {
                          setNextAction(e.target.value);
                          setActionNote("");
                          setFinalLetterUrl("");
                        }}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-brand cursor-pointer"
                      >
                        <option value="">-- Pilih Aksi Status --</option>
                        {allowedActions.map((act) => (
                          <option key={act.value} value={act.value}>
                            {act.label}
                          </option>
                        ))}
                      </select>

                      {selectedAction && (
                        <p className="mt-1.5 text-[11px] text-slate-500">
                          ℹ️ {selectedAction.description}
                        </p>
                      )}

                      {(nextAction === "request_revision" ||
                        nextAction === "reject") && (
                        <div className="mt-3">
                          <label className="mb-1 block font-semibold text-slate-700">
                            {nextAction === "request_revision"
                              ? "Poin Revisi untuk Pemohon (Wajib, Minimal 5 Karakter) *"
                              : "Alasan Penolakan (Wajib, Minimal 5 Karakter) *"}
                          </label>
                          <textarea
                            required
                            minLength={5}
                            rows={3}
                            value={actionNote}
                            onChange={(e) => setActionNote(e.target.value)}
                            placeholder={
                              nextAction === "request_revision"
                                ? "Jelaskan poin perbaikan yang harus diperbaiki oleh pemohon..."
                                : "Jelaskan alasan permohonan peminjaman ruangan ini ditolak..."
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                          />
                          <p className="mt-1 text-[11px] text-slate-400">
                            {actionNote.trim().length < 5
                              ? `Kurang ${5 - actionNote.trim().length} karakter lagi (min. 5 karakter)`
                              : `${actionNote.trim().length} karakter`}
                          </p>
                        </div>
                      )}

                      {nextAction === "upload_final_letter" && (
                        <div className="mt-3 space-y-1.5">
                          <label className="block font-semibold text-slate-700">
                            Link Dokumen Surat Final Digital (Google Drive URL) *
                          </label>
                          <input
                            type="url"
                            required
                            value={finalLetterUrl}
                            onChange={(e) => setFinalLetterUrl(e.target.value)}
                            placeholder="https://drive.google.com/file/d/.../view"
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                          />
                          <p className="text-[11px] text-slate-400">
                            Tautan Google Drive atau cloud storage surat resmi
                            yang telah ditandatangani pimpinan. Menyimpan akan
                            mengubah status menjadi Disetujui.
                          </p>
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          Pilih aksi lalu klik simpan
                        </span>
                        <button
                          type="submit"
                          disabled={!nextAction || isSavingStatus}
                          className="rounded-xl bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark disabled:opacity-40 cursor-pointer"
                        >
                          {isSavingStatus ? "Menyimpan..." : "Simpan Status"}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              );
            })()}
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
                  minLength={3}
                  value={manualForm.applicant_name}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      applicant_name: e.target.value,
                    })
                  }
                  placeholder="Contoh: Dr. Eng. Herman / Panitia Seminar..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  Kontak WhatsApp / HP *
                </label>
                <input
                  required
                  minLength={5}
                  value={manualForm.contact}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, contact: e.target.value })
                  }
                  placeholder="Contoh: 081234567890 (min. 5 digit)"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    NIM Pemohon (Opsional)
                  </label>
                  <input
                    value={manualForm.nim}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, nim: e.target.value })
                    }
                    placeholder="Contoh: 215150200111..."
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    Program Studi (Opsional)
                  </label>
                  <input
                    value={manualForm.prodi}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, prodi: e.target.value })
                    }
                    placeholder="Contoh: Teknik Informatika"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  Lembaga Penyelenggara *
                </label>
                <select
                  required
                  value={manualForm.lembaga_id}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, lembaga_id: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand cursor-pointer"
                >
                  <option value="">Pilih Lembaga...</option>
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
                  minLength={3}
                  value={manualForm.program_kerja}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      program_kerja: e.target.value,
                    })
                  }
                  placeholder="Contoh: Workshop Cloud Computing 2026..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  Agenda Detail *
                </label>
                <input
                  required
                  minLength={3}
                  value={manualForm.agenda}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, agenda: e.target.value })
                  }
                  placeholder="Contoh: Pelatihan instalasi dan konfigurasi server..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand cursor-pointer"
                  >
                    <option value="">Pilih Ruangan...</option>
                    {(adminRooms?.items ?? []).map((rm, i) => (
                      <option
                        key={String(rm.id ?? i)}
                        value={String(rm.id ?? "")}
                      >
                        {String(rm.name ?? "")} (Kapasitas: {rm.capacity ?? "-"}
                        )
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    Keperluan
                  </label>
                  <input
                    value={manualForm.purpose}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, purpose: e.target.value })
                    }
                    placeholder="Contoh: Kegiatan Akademik / Pelatihan"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    Tanggal Peminjaman *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={manualForm.date}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, date: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-brand cursor-pointer"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    Jumlah Peserta *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    required
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
                  <select
                    required
                    value={manualForm.start_time}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        start_time: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand cursor-pointer"
                  >
                    {OPERATIONAL_TIME_SLOTS.slice(0, -1).map((t) => (
                      <option key={t} value={t}>
                        {t} WIB
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    Waktu Selesai *
                  </label>
                  <select
                    required
                    value={manualForm.end_time}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, end_time: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand cursor-pointer"
                  >
                    {OPERATIONAL_TIME_SLOTS.slice(1).map((t) => (
                      <option key={t} value={t}>
                        {t} WIB
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  Link Dokumen Pengajuan (Google Drive URL, Opsional)
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
                  placeholder="https://drive.google.com/... (opsional, jika kosong menggunakan placeholder resmi)"
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

      {/* Modal Pembuat Draf Surat Perizinan */}
      {draftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs print:static print:p-0 print:bg-transparent">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-line bg-white p-6 shadow-2xl print:max-h-none print:w-full print:max-w-none print:border-none print:shadow-none print:p-0">
            <div className="flex items-center justify-between border-b border-line pb-4 print:hidden">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-brand">
                  <FileText className="size-4" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Draf Surat Perizinan Resmi
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sesuaikan informasi perizinan dan cetak surat resmi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDraftModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 print:hidden">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Nomor Surat
                </label>
                <input
                  value={letterNumber}
                  onChange={(e) => setLetterNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Organisasi Pemohon
                </label>
                <input
                  value={letterOrg}
                  onChange={(e) => setLetterOrg(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Nama Kegiatan
                </label>
                <input
                  value={letterActivity}
                  onChange={(e) => setLetterActivity(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Ruangan / Fasilitas Disetujui
                </label>
                <input
                  value={letterFacility}
                  onChange={(e) => setLetterFacility(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-brand"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Waktu Penggunaan
                </label>
                <input
                  value={letterSchedule}
                  onChange={(e) => setLetterSchedule(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-brand"
                />
              </div>
            </div>

            {/* Pratinjau Surat Resmi */}
            <div className="mt-4 rounded-xl border border-line bg-slate-50 p-6 text-xs leading-relaxed text-slate-800 print:mt-0 print:rounded-none print:border-none print:bg-white print:p-0 print:text-sm print:leading-loose">
              <p className="text-center font-bold uppercase tracking-wide text-slate-900">
                Kementerian Pendidikan Tinggi, Sains, dan Teknologi
                <br />
                Fakultas Ilmu Komputer – Universitas Brawijaya
              </p>
              <hr className="my-3 border-slate-300 print:my-4 print:border-slate-800" />
              <p>
                <strong>Nomor:</strong> {letterNumber}
                <br />
                <strong>Hal:</strong> Izin Penggunaan Sarana dan Prasarana
              </p>
              <p className="mt-3 print:mt-5">
                Dengan ini Koordinator Sarana &amp; Prasarana FILKOM UB
                memberikan izin kepada <strong>{letterOrg}</strong> untuk
                menggunakan fasilitas <strong>{letterFacility}</strong> dalam
                rangka kegiatan <strong>{letterActivity}</strong> pada{" "}
                <strong>{letterSchedule}</strong>.
              </p>
              <p className="mt-6 text-right font-semibold print:mt-12">
                Koordinator Sarpras &amp; Lab,
                <br />
                <span className="mt-8 inline-block font-bold text-slate-900 print:mt-14">
                  Koordinator Bagian Umum &amp; Sarpras
                </span>
              </p>
            </div>

            <div className="mt-5 flex justify-end gap-2 print:hidden">
              {selectedReq?.backendId && (
                <button
                  type="button"
                  onClick={() => void handleOpenDraft(selectedReq.backendId)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100 cursor-pointer"
                  title="Unduh draf PDF langsung dari server backend"
                >
                  <Download className="size-3.5" /> Unduh Dokumen Asli
                </button>
              )}
              <button
                type="button"
                onClick={() => setDraftModalOpen(false)}
                className="rounded-xl border border-line px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handlePrintLetter}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-dark cursor-pointer"
              >
                <Printer className="size-3.5" /> Cetak / Simpan PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
