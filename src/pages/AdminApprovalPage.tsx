import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  FileSpreadsheet,
  QrCode,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminNavbar from "../components/admin/AdminNavbar";
import AdminStatsCards from "../components/admin/AdminStatsCards";
import AdminCalendar from "../components/admin/AdminCalendar";
import AdminTableSection from "../components/admin/AdminTableSection";
import { adminService } from "../api/adminService";
import { useAdminRequests } from "../hooks/useAdminQueries";
import type { Decision } from "../types/admin";
import { cn } from "../utils/helpers";

const APPROVED_TODAY_BASE = 14;

export type StatusFilter = "pending" | "approved" | "rejected" | "all";

const statusFilterOptions: { value: StatusFilter; label: string }[] = [
  { value: "pending", label: "Menunggu Verifikasi" },
  { value: "approved", label: "Sudah Disetujui" },
  { value: "rejected", label: "Ditolak" },
  { value: "all", label: "Semua Pengajuan" },
];

export default function AdminApprovalPage() {
  const queryClient = useQueryClient();
  const { data: requests = [], isFetching } = useAdminRequests();
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [globalSearch, setGlobalSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [sopModalOpen, setSopModalOpen] = useState(false);
  const [pageToast, setPageToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setPageToast(msg);
    window.setTimeout(() => setPageToast(null), 3500);
  };

  const pending = useMemo(
    () => requests.filter((r) => !decisions[r.id]),
    [requests, decisions],
  );

  const visibleRequests = useMemo(() => {
    if (statusFilter === "pending") {
      return requests.filter((r) => !decisions[r.id]);
    }
    if (statusFilter === "approved") {
      return requests.filter((r) => decisions[r.id] === "approved");
    }
    if (statusFilter === "rejected") {
      return requests.filter((r) => decisions[r.id] === "rejected");
    }
    return requests;
  }, [requests, decisions, statusFilter]);

  const approvedInSession = Object.values(decisions).filter(
    (d) => d === "approved",
  ).length;

  const handleDecide = (ids: string[], decision: Decision) => {
    setDecisions((prev) => ({
      ...prev,
      ...Object.fromEntries(ids.map((id) => [id, decision])),
    }));

    ids.forEach((id) => {
      if (decision === "approved") {
        void adminService.approveRequest(id);
      } else {
        void adminService.rejectRequest(id);
      }
    });
  };

  const handleUndo = (ids: string[]) =>
    setDecisions((prev) => {
      const next = { ...prev };
      ids.forEach((id) => delete next[id]);
      return next;
    });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin"] });
    showToast("Data permohonan dan kalender berhasil diperbarui.");
  };

  const handleExportRekap = () => {
    const headers = [
      "ID Tiket",
      "Nama Pengaju",
      "NIM / Identitas",
      "Organisasi / Kegiatan",
      "Fasilitas",
      "Tanggal",
      "Waktu",
      "Status Keputusan",
    ];

    const rows = requests.map((r) => {
      const currentDecision = decisions[r.id];
      const statusLabel =
        currentDecision === "approved"
          ? "Disetujui"
          : currentDecision === "rejected"
            ? "Ditolak"
            : "Menunggu Verifikasi";

      return [
        r.id,
        r.name,
        r.identifier,
        r.org,
        r.room,
        r.date,
        r.time,
        statusLabel,
      ]
        .map((cell) => `"${String(cell ?? "-").replace(/"/g, '""')}"`)
        .join(",");
    });

    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Rekap_Monitoring_FILKOM_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    showToast(`Rekap (${requests.length} data) berhasil diekspor ke CSV.`);
  };

  const activeFilterLabel =
    statusFilterOptions.find((o) => o.value === statusFilter)?.label ??
    "Filter Status";

  return (
    <div className="flex min-h-screen w-full flex-col bg-canvas">
      <AdminNavbar
        pendingCount={pending.length}
        search={globalSearch}
        onSearch={setGlobalSearch}
      />

      <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 pb-14 pt-6 sm:px-6 lg:px-10">
        {/* Page header */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500"
        >
          <span>Sarpras Portal</span>
          <ChevronRight className="size-3.5 shrink-0" />
          <span>Approval</span>
          <ChevronRight className="size-3.5 shrink-0" />
          <span className="font-semibold text-brand">Monitoring Reservasi</span>
        </nav>

        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Approval Masuk &amp; Monitoring Peminjaman
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Kelola verifikasi persetujuan ruangan laboratorium, auditorium,
              dan peralatan multimedia FILKOM UB
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw
                className={cn("size-4 shrink-0", isFetching && "animate-spin")}
              />
              Perbarui
            </button>

            {/* Dropdown Filter Status */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setFilterDropdownOpen((v) => !v)}
                aria-expanded={filterDropdownOpen}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer",
                  statusFilter !== "pending"
                    ? "border-brand bg-emerald-50/70 text-brand"
                    : "border-line bg-white text-slate-700 hover:bg-slate-50",
                )}
              >
                <SlidersHorizontal className="size-4 shrink-0" />
                <span>
                  {statusFilter === "pending"
                    ? "Filter Status"
                    : activeFilterLabel}
                </span>
                <ChevronDown className="size-4 shrink-0 text-slate-400" />
              </button>

              {filterDropdownOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Tutup filter status"
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={() => setFilterDropdownOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-line bg-white p-1.5 shadow-xl">
                    {statusFilterOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setStatusFilter(opt.value);
                          setFilterDropdownOpen(false);
                          document
                            .getElementById("approval")
                            ?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition-colors cursor-pointer",
                          statusFilter === opt.value
                            ? "bg-emerald-50 text-brand"
                            : "text-slate-700 hover:bg-slate-50",
                        )}
                      >
                        <span>{opt.label}</span>
                        {statusFilter === opt.value && (
                          <Check className="size-3.5 text-brand" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={handleExportRekap}
              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark cursor-pointer"
            >
              <Download className="size-4 shrink-0" /> Ekspor Rekap
            </button>
          </div>
        </div>

        {/* Toast Notifikasi Aksi */}
        {pageToast && (
          <div
            role="status"
            className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-brand"
          >
            <span className="inline-flex items-center gap-2">
              <FileSpreadsheet className="size-4 shrink-0" /> {pageToast}
            </span>
            <button
              type="button"
              onClick={() => setPageToast(null)}
              className="text-brand/70 hover:text-brand cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-6">
          <AdminStatsCards
            pending={pending.length}
            approvedToday={APPROVED_TODAY_BASE + approvedInSession}
          />
          <AdminCalendar />
          <AdminTableSection
            requests={visibleRequests}
            globalSearch={globalSearch}
            statusFilter={statusFilter}
            decisions={decisions}
            onDecide={handleDecide}
            onUndo={handleUndo}
          />

          {/* Protocol banner */}
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-4">
              <span className="flex size-11 aspect-square shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-brand">
                <QrCode className="size-5" />
              </span>
              <div>
                <p className="font-bold">
                  Protokol QR-Key &amp; Keamanan Sarpras
                </p>
                <p className="text-sm text-slate-600">
                  Tiap verifikasi persetujuan secara otomatis mengirim instruksi
                  kunci digital ke WhatsApp/email peminjam dan petugas gedung.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSopModalOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-bold text-brand hover:underline cursor-pointer"
            >
              SOP Operasional Sarpras <ArrowRight className="size-4 shrink-0" />
            </button>
          </div>
        </div>
      </main>

      {/* Modal SOP Operasional Sarpras */}
      {sopModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-line bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-line pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="flex size-10 aspect-square shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-brand">
                  <ShieldCheck className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    SOP Operasional &amp; Protokol QR-Key Sarpras
                  </h3>
                  <p className="text-xs text-slate-500">
                    Standar Verifikasi Peminjaman Fasilitas FILKOM UB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSopModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <ol className="mt-4 space-y-3 text-xs leading-relaxed text-slate-700">
              <li className="rounded-xl bg-slate-50 p-3.5">
                <p className="font-bold text-slate-900">
                  1. Kelengkapan Dokumen Pendukung
                </p>
                <p className="mt-1">
                  Pengajuan kegiatan kemahasiswaan wajib melampirkan proposal
                  atau surat pengantar resmi yang ditandatangani ketua pelaksana
                  dan pembina lembaga.
                </p>
              </li>
              <li className="rounded-xl bg-slate-50 p-3.5">
                <p className="font-bold text-slate-900">
                  2. Batas Waktu Verifikasi (H-2 Kegiatan)
                </p>
                <p className="mt-1">
                  Koordinator Sarpras &amp; Laboran memproses permohonan
                  maksimal 1×24 jam pada hari kerja (Senin–Jumat, 08.00–16.00
                  WIB).
                </p>
              </li>
              <li className="rounded-xl bg-slate-50 p-3.5">
                <p className="font-bold text-slate-900">
                  3. Aktivasi QR-Key &amp; Serah Terima Aset
                </p>
                <p className="mt-1">
                  Setelah berstatus <strong>Disetujui</strong>, peminjam wajib
                  menunjukkan Bukti Pengajuan (PDF) / QR-Key kepada petugas
                  Gedung G Lt. 1 maksimal 15 menit sebelum jadwal dimulai.
                </p>
              </li>
            </ol>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSopModalOpen(false)}
                className="rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-dark cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
