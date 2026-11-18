import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  Download,
  FileSpreadsheet,
  History,
  Layers,
  Package,
  Plus,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X,
  ChevronRight,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import AdminNavbar from "../components/admin/AdminNavbar";
import AdminStatsCards from "../components/admin/AdminStatsCards";
import AdminCalendar from "../components/admin/AdminCalendar";
import AdminTableSection from "../components/admin/AdminTableSection";
import {
  exportAdminBookingsExcelApi,
  createAdminRoomApi,
  deleteAdminRoomApi,
  createAdminLembagaApi,
  deleteAdminLembagaApi,
  createAdminItemApi,
  deleteAdminItemApi,
} from "../api/adminService";
import { getApiErrorMessage } from "../api/axiosClient";
import {
  useAdminAuditLogs,
  useAdminBookingStats,
  useAdminMasterItems,
  useAdminMasterLembaga,
  useAdminMasterRooms,
  useAdminSummaryReport,
} from "../hooks/useAdminQueries";
import { cn } from "../utils/helpers";

type AdminTab =
  | "bookings"
  | "rooms"
  | "items"
  | "lembaga"
  | "audit-logs"
  | "reports";

const adminTabs: {
  key: AdminTab;
  label: string;
  icon: typeof ClipboardList;
}[] = [
  { key: "bookings", label: "Peminjaman Ruangan", icon: ClipboardList },
  { key: "rooms", label: "Kelola Ruangan", icon: Building2 },
  { key: "items", label: "Kelola Barang", icon: Package },
  { key: "lembaga", label: "Kelola Lembaga", icon: Layers },
  { key: "audit-logs", label: "Audit Log", icon: History },
  { key: "reports", label: "Laporan Ringkasan", icon: FileSpreadsheet },
];

export default function AdminApprovalPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>("bookings");
  const [globalSearch, setGlobalSearch] = useState("");
  const [sopModalOpen, setSopModalOpen] = useState(false);
  const [pageToast, setPageToast] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: stats } = useAdminBookingStats();

  // Master Data Queries
  const { data: roomsData, isLoading: loadingRooms } = useAdminMasterRooms(
    1,
    50,
  );
  const { data: itemsData, isLoading: loadingItems } = useAdminMasterItems(
    1,
    50,
  );
  const { data: lembagaData, isLoading: loadingLembaga } =
    useAdminMasterLembaga(1, 100);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditPage, setAuditPage] = useState(1);
  const { data: auditData, isLoading: loadingAudit } = useAdminAuditLogs({
    page: auditPage,
    per_page: 20,
    q: auditSearch.trim() || undefined,
  });
  const { data: summaryReport, isLoading: loadingReport } =
    useAdminSummaryReport();

  // Form Tambah Master Data
  const [newRoom, setNewRoom] = useState({
    name: "",
    building: "",
    capacity: "40",
    description: "",
  });
  const [newItem, setNewItem] = useState({
    name: "",
    stock: "1",
    location: "Loket Sarpras Gd. G Lt. 1",
    description: "",
  });
  const [newLembaga, setNewLembaga] = useState({
    name: "",
    code: "",
    description: "",
  });
  const [isSavingMaster, setIsSavingMaster] = useState(false);

  const showToast = (msg: string) => {
    setPageToast(msg);
    setPageError(null);
    window.setTimeout(() => setPageToast(null), 3500);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["admin"] });
    setIsRefreshing(false);
    showToast("Seluruh data admin berhasil diperbarui.");
  };

  const handleExportRekap = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await exportAdminBookingsExcelApi();
      showToast("File Excel rekap peminjaman berhasil diunduh.");
    } catch (err: unknown) {
      setPageError(getApiErrorMessage(err));
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddRoom = async (e: FormEvent) => {
    e.preventDefault();
    if (isSavingMaster) return;
    setIsSavingMaster(true);
    try {
      await createAdminRoomApi({
        name: newRoom.name.trim(),
        location: newRoom.building.trim(),
        capacity: Number(newRoom.capacity) || 30,
        description: newRoom.description.trim() || undefined,
        status: "tersedia",
      });
      setNewRoom({ name: "", building: "", capacity: "40", description: "" });
      await queryClient.invalidateQueries({ queryKey: ["admin", "rooms"] });
      showToast("Ruangan baru berhasil ditambahkan.");
    } catch (err: unknown) {
      setPageError(getApiErrorMessage(err));
    } finally {
      setIsSavingMaster(false);
    }
  };

  const handleDeleteMaster = async (
    endpoint: "rooms" | "items" | "lembaga",
    id: unknown,
    label: string,
  ) => {
    if (!window.confirm(`Hapus ${label}?`)) return;
    try {
      if (endpoint === "rooms") {
        await deleteAdminRoomApi(String(id));
      } else if (endpoint === "lembaga") {
        await deleteAdminLembagaApi(String(id));
      } else {
        await deleteAdminItemApi(String(id));
      }
      await queryClient.invalidateQueries({ queryKey: ["admin", endpoint] });
      showToast(`${label} berhasil dihapus.`);
    } catch (err: unknown) {
      setPageError(getApiErrorMessage(err));
    }
  };

  const handleAddItem = async (e: FormEvent) => {
    e.preventDefault();
    if (isSavingMaster) return;
    setIsSavingMaster(true);
    try {
      await createAdminItemApi({
        name: newItem.name.trim(),
        category: "Inventaris",
        stock_total: Number(newItem.stock) || 1,
        description: newItem.description.trim() || undefined,
        status: "tersedia",
      });
      setNewItem({
        name: "",
        stock: "1",
        location: "Loket Sarpras Gd. G Lt. 1",
        description: "",
      });
      await queryClient.invalidateQueries({ queryKey: ["admin", "items"] });
      showToast("Barang inventaris berhasil ditambahkan.");
    } catch (err: unknown) {
      setPageError(getApiErrorMessage(err));
    } finally {
      setIsSavingMaster(false);
    }
  };

  const handleAddLembaga = async (e: FormEvent) => {
    e.preventDefault();
    if (isSavingMaster) return;
    setIsSavingMaster(true);
    try {
      await createAdminLembagaApi({
        name: newLembaga.name.trim(),
      });
      setNewLembaga({ name: "", code: "", description: "" });
      await queryClient.invalidateQueries({ queryKey: ["admin", "lembaga"] });
      showToast("Lembaga berhasil ditambahkan.");
    } catch (err: unknown) {
      setPageError(getApiErrorMessage(err));
    } finally {
      setIsSavingMaster(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-canvas">
      <AdminNavbar
        pendingCount={stats?.pending ?? 0}
        search={globalSearch}
        onSearch={setGlobalSearch}
      />

      <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 pb-14 pt-6 sm:px-6 lg:px-10">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500"
        >
          <span>Sarpras Portal</span>
          <ChevronRight className="size-3.5 shrink-0" />
          <span>Admin Panel</span>
          <ChevronRight className="size-3.5 shrink-0" />
          <span className="font-semibold text-brand">
            {adminTabs.find((t) => t.key === activeTab)?.label}
          </span>
        </nav>

        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Admin Panel &amp; Monitoring Peminjaman
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Kelola verifikasi persetujuan ruangan, master sarpras, audit log,
              dan laporan rekapitulasi FILKOM UB
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw
                className={cn(
                  "size-4 shrink-0",
                  isRefreshing && "animate-spin",
                )}
              />
              Perbarui
            </button>

            <button
              type="button"
              disabled={isExporting}
              onClick={() => void handleExportRekap()}
              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50 cursor-pointer"
            >
              <Download className="size-4 shrink-0" />{" "}
              {isExporting ? "Mengekspor..." : "Ekspor Rekap (.xlsx)"}
            </button>
          </div>
        </div>

        {/* Sub-Modul Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-line pb-4">
          {adminTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer",
                  active
                    ? "bg-brand text-white shadow-xs"
                    : "border border-line bg-white text-slate-700 hover:bg-slate-50",
                )}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {pageToast && (
          <div
            role="status"
            className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-brand"
          >
            <span>{pageToast}</span>
            <button
              type="button"
              onClick={() => setPageToast(null)}
              className="text-brand/70 hover:text-brand cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {pageError && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">
            <span>{pageError}</span>
            <button
              type="button"
              onClick={() => setPageError(null)}
              className="cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* TAB 1: PEMINJAMAN RUANGAN */}
        {activeTab === "bookings" && (
          <div className="mt-6 flex flex-col gap-6">
            <AdminStatsCards />
            <AdminCalendar />
            <AdminTableSection globalSearch={globalSearch} />
          </div>
        )}

        {/* TAB 2: KELOLA RUANGAN */}
        {activeTab === "rooms" && (
          <div className="mt-6 space-y-6">
            <form
              onSubmit={(e) => void handleAddRoom(e)}
              className="grid gap-3 rounded-2xl border border-line bg-white p-5 sm:grid-cols-5"
            >
              <input
                required
                placeholder="Nama Ruangan (mis. Ruang GKM 3.1)"
                value={newRoom.name}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, name: e.target.value })
                }
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-brand"
              />
              <input
                required
                placeholder="Gedung / Lokasi (mis. Gedung G Lt. 3)"
                value={newRoom.building}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, building: e.target.value })
                }
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-brand"
              />
              <input
                type="number"
                min={1}
                required
                placeholder="Kapasitas"
                value={newRoom.capacity}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, capacity: e.target.value })
                }
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-brand"
              />
              <input
                placeholder="Keterangan fasilitas"
                value={newRoom.description}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, description: e.target.value })
                }
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-brand"
              />
              <button
                type="submit"
                disabled={isSavingMaster}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-dark cursor-pointer"
              >
                <Plus className="size-4" /> Tambah Ruangan
              </button>
            </form>

            <div className="overflow-x-auto rounded-2xl border border-line bg-white">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line bg-slate-50 font-bold text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Nama Ruangan</th>
                    <th className="px-4 py-3">Gedung / Lokasi</th>
                    <th className="px-4 py-3">Kapasitas</th>
                    <th className="px-4 py-3">Deskripsi</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {loadingRooms ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-slate-400"
                      >
                        Memuat daftar ruangan...
                      </td>
                    </tr>
                  ) : (
                    (roomsData?.items ?? []).map((rm, idx) => (
                      <tr key={String(rm.id ?? idx)}>
                        <td className="px-4 py-3 font-bold text-ink">
                          {String(rm.name ?? "-")}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {String(rm.building ?? rm.location ?? "-")}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {String(rm.capacity ?? "-")} orang
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {String(rm.description ?? "-")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              void handleDeleteMaster(
                                "rooms",
                                rm.id,
                                String(rm.name ?? "ruangan"),
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 font-semibold text-red-600 hover:bg-red-100 cursor-pointer"
                          >
                            <Trash2 className="size-3.5" /> Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: KELOLA BARANG */}
        {activeTab === "items" && (
          <div className="mt-6 space-y-6">
            <form
              onSubmit={(e) => void handleAddItem(e)}
              className="grid gap-3 rounded-2xl border border-line bg-white p-5 sm:grid-cols-5"
            >
              <input
                required
                placeholder="Nama Barang / Alat Band"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-brand"
              />
              <input
                type="number"
                min={1}
                required
                placeholder="Stok Unit"
                value={newItem.stock}
                onChange={(e) =>
                  setNewItem({ ...newItem, stock: e.target.value })
                }
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-brand"
              />
              <input
                placeholder="Lokasi Penyimpanan"
                value={newItem.location}
                onChange={(e) =>
                  setNewItem({ ...newItem, location: e.target.value })
                }
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-brand"
              />
              <input
                placeholder="Spesifikasi / Catatan"
                value={newItem.description}
                onChange={(e) =>
                  setNewItem({ ...newItem, description: e.target.value })
                }
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-brand"
              />
              <button
                type="submit"
                disabled={isSavingMaster}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-dark cursor-pointer"
              >
                <Plus className="size-4" /> Tambah Barang
              </button>
            </form>

            <div className="overflow-x-auto rounded-2xl border border-line bg-white">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line bg-slate-50 font-bold text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Nama Barang</th>
                    <th className="px-4 py-3">Stok</th>
                    <th className="px-4 py-3">Lokasi</th>
                    <th className="px-4 py-3">Deskripsi</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {loadingItems ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-slate-400"
                      >
                        Memuat daftar barang...
                      </td>
                    </tr>
                  ) : (
                    (itemsData?.items ?? []).map((it, idx) => (
                      <tr key={String(it.id ?? idx)}>
                        <td className="px-4 py-3 font-bold text-ink">
                          {String(it.name ?? "-")}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {String(it.stock ?? it.quantity ?? 1)} unit
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {String(it.location ?? "-")}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {String(it.description ?? "-")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              void handleDeleteMaster(
                                "items",
                                it.id,
                                String(it.name ?? "barang"),
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 font-semibold text-red-600 hover:bg-red-100 cursor-pointer"
                          >
                            <Trash2 className="size-3.5" /> Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: KELOLA LEMBAGA */}
        {activeTab === "lembaga" && (
          <div className="mt-6 space-y-6">
            <form
              onSubmit={(e) => void handleAddLembaga(e)}
              className="grid gap-3 rounded-2xl border border-line bg-white p-5 sm:grid-cols-4"
            >
              <input
                required
                placeholder="Nama Lembaga (mis. BEM FILKOM, HMDTIF, RAION)"
                value={newLembaga.name}
                onChange={(e) =>
                  setNewLembaga({ ...newLembaga, name: e.target.value })
                }
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-brand"
              />
              <input
                placeholder="Singkatan / Kode"
                value={newLembaga.code}
                onChange={(e) =>
                  setNewLembaga({ ...newLembaga, code: e.target.value })
                }
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-brand"
              />
              <input
                placeholder="Keterangan"
                value={newLembaga.description}
                onChange={(e) =>
                  setNewLembaga({ ...newLembaga, description: e.target.value })
                }
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-brand"
              />
              <button
                type="submit"
                disabled={isSavingMaster}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-dark cursor-pointer"
              >
                <Plus className="size-4" /> Tambah Lembaga
              </button>
            </form>

            <div className="overflow-x-auto rounded-2xl border border-line bg-white">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line bg-slate-50 font-bold text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Nama Lembaga</th>
                    <th className="px-4 py-3">Kode</th>
                    <th className="px-4 py-3">Deskripsi</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {loadingLembaga ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-8 text-center text-slate-400"
                      >
                        Memuat daftar lembaga...
                      </td>
                    </tr>
                  ) : (
                    (lembagaData?.items ?? []).map((lb, idx) => (
                      <tr key={String(lb.id ?? idx)}>
                        <td className="px-4 py-3 font-bold text-ink">
                          {String(lb.name ?? "-")}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          {String(lb.code ?? "-")}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {String(lb.description ?? "-")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              void handleDeleteMaster(
                                "lembaga",
                                lb.id,
                                String(lb.name ?? "lembaga"),
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 font-semibold text-red-600 hover:bg-red-100 cursor-pointer"
                          >
                            <Trash2 className="size-3.5" /> Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: AUDIT LOG */}
        {activeTab === "audit-logs" && (
          <div className="mt-6 rounded-2xl border border-line bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <input
                value={auditSearch}
                onChange={(e) => {
                  setAuditSearch(e.target.value);
                  setAuditPage(1);
                }}
                placeholder="Cari aksi, user, deskripsi..."
                className="w-full max-w-sm rounded-xl border border-line bg-slate-50 px-3.5 py-2 text-xs outline-none focus:border-brand"
              />
              <span className="text-xs text-slate-500">
                Total {auditData?.total ?? 0} aktivitas tercatat
              </span>
            </div>

            <div className="overflow-x-auto border-t border-line">
              <table className="w-full min-w-[820px] text-left text-xs">
                <thead className="bg-slate-50 font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Waktu</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Aksi</th>
                    <th className="px-4 py-3">Target</th>
                    <th className="px-4 py-3">Deskripsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {loadingAudit ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-slate-400"
                      >
                        Memuat audit log...
                      </td>
                    </tr>
                  ) : (
                    (auditData?.items ?? []).map((log, idx) => {
                      const role = String(log.role ?? "user").toLowerCase();
                      return (
                        <tr key={String(log.id ?? idx)}>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                            {String(log.created_at ?? log.timestamp ?? "-")}
                          </td>
                          <td className="px-4 py-3 font-semibold text-ink">
                            {String(log.user_name ?? log.actor_name ?? "-")}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "rounded-md px-2 py-0.5 text-[11px] font-bold",
                                role === "admin"
                                  ? "bg-red-50 text-red-600"
                                  : "bg-sky-50 text-sky-700",
                              )}
                            >
                              {role}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-[11px] font-bold text-indigo-700">
                              {String(log.action ?? "-")}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-500">
                            {String(log.target ?? log.entity ?? "-")}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {String(log.description ?? "-")}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: LAPORAN RINGKASAN */}
        {activeTab === "reports" && (
          <div className="mt-6 rounded-2xl border border-line bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
              <div>
                <h2 className="text-lg font-bold text-ink">
                  Laporan Ringkasan Peminjaman Ruangan
                </h2>
                <p className="text-xs text-slate-500">
                  Rekapitulasi statistik pemanfaatan fasilitas berdasarkan
                  status &amp; lembaga
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleExportRekap()}
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-dark cursor-pointer"
              >
                <Download className="size-4" /> Unduh Rekap Excel (.xlsx)
              </button>
            </div>

            {loadingReport ? (
              <div className="mt-6 h-40 animate-pulse rounded-xl bg-slate-100" />
            ) : (
              <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-50 p-4 font-mono text-xs text-slate-700">
                {JSON.stringify(summaryReport ?? {}, null, 2)}
              </pre>
            )}
          </div>
        )}

        {/* SOP Banner */}
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-line bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
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
      </main>

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
