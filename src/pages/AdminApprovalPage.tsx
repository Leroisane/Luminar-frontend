import { useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronRight,
  Download,
  QrCode,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminNavbar from "../components/admin/AdminNavbar";
import AdminStatsCards from "../components/admin/AdminStatsCards";
import AdminCalendar from "../components/admin/AdminCalendar";
import AdminTableSection from "../components/admin/AdminTableSection";
import { useAdminRequests } from "../hooks/useAdminQueries";
import type { Decision } from "../types/admin";

/** Jumlah persetujuan hari ini sebelum sesi ini (mock, nanti dari API) */
const APPROVED_TODAY_BASE = 14;

export default function AdminApprovalPage() {
  const queryClient = useQueryClient();
  const { data: requests = [], isFetching } = useAdminRequests();
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [globalSearch, setGlobalSearch] = useState("");

  const pending = useMemo(
    () => requests.filter((r) => !decisions[r.id]),
    [requests, decisions],
  );
  const approvedInSession = Object.values(decisions).filter(
    (d) => d === "approved",
  ).length;

  const handleDecide = (ids: string[], decision: Decision) =>
    // TODO: panggil API approve/reject lalu invalidate query
    setDecisions((prev) => ({
      ...prev,
      ...Object.fromEntries(ids.map((id) => [id, decision])),
    }));

  const handleUndo = (ids: string[]) =>
    setDecisions((prev) => {
      const next = { ...prev };
      ids.forEach((id) => delete next[id]);
      return next;
    });

  const handleRefresh = () =>
    queryClient.invalidateQueries({ queryKey: ["admin"] });

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
          className="flex items-center gap-1.5 text-sm text-slate-500"
        >
          <span>Sarpras Portal</span>
          <ChevronRight className="size-3.5" />
          <span>Approval</span>
          <ChevronRight className="size-3.5" />
          <span className="font-semibold text-brand">Monitoring Reservasi</span>
        </nav>

        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Approval Masuk &amp; Monitoring Peminjaman
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Kelola verifikasi persetujuan ruangan laboratorium, auditorium,
              dan peralatan multimedia FILKOM UB
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
            >
              <RefreshCw
                className={isFetching ? "size-4 animate-spin" : "size-4"}
              />{" "}
              Perbarui
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50">
              <SlidersHorizontal className="size-4" /> Filter Status
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
              <Download className="size-4" /> Ekspor Rekap
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-6">
          <AdminStatsCards
            pending={pending.length}
            approvedToday={APPROVED_TODAY_BASE + approvedInSession}
          />
          <AdminCalendar />
          <AdminTableSection
            requests={pending}
            globalSearch={globalSearch}
            onDecide={handleDecide}
            onUndo={handleUndo}
          />

          {/* Protocol banner */}
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-brand">
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
            <a
              href="#"
              className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-brand hover:underline"
            >
              SOP Operasional Sarpras <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
