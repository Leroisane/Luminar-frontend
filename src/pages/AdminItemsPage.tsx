import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Box,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  X,
  Layers,
} from "lucide-react";
import { useAdminMasterItems } from "../hooks/useAdminQueries";
import {
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  usePatchItemStatus,
} from "../hooks/useMutations";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import AlertMessage from "../components/ui/AlertMessage";
import PaginationBar from "../components/ui/PaginationBar";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import StatusBadge from "../components/ui/StatusBadge";
import type { Item } from "../types/api";
import type { ItemPayload } from "../api/adminService";
import { getApiErrorMessage } from "../api/axiosClient";
import { cn } from "../utils/helpers";

const CATEGORIES = [
  "Audio & Sound",
  "Visual & Multimedia",
  "Kabel & Aksesori",
  "Elektronik",
  "Perabotan",
  "Alat Musik",
  "Lainnya",
];

const emptyForm: ItemPayload = {
  name: "",
  category: "Audio & Sound",
  description: "",
  stock_total: 1,
  status: "tersedia",
};

export default function AdminItemsPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data, isLoading, isFetching, error, refetch } = useAdminMasterItems({
    page,
    perPage: 15,
    q: searchQuery,
    status: statusFilter,
  });

  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem();
  const deleteMutation = useDeleteItem();
  const statusMutation = usePatchItemStatus();

  const [form, setForm] = useState<ItemPayload>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [mutError, setMutError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMutError(null);
    try {
      if (editId) {
        await updateMutation.mutateAsync({ id: editId, payload: form });
        showToast("Data barang berhasil diperbarui.");
      } else {
        await createMutation.mutateAsync(form);
        showToast("Barang inventaris baru berhasil ditambahkan.");
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditId(null);
    } catch (err) {
      setMutError(getApiErrorMessage(err));
    }
  };

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setMutError(null);
    setShowModal(true);
  };

  const openEdit = (item: Item) => {
    setEditId(item.id);
    setForm({
      name: item.name,
      category: item.category ?? "Audio & Sound",
      description: item.description ?? "",
      stock_total: item.stock_total ?? 1,
      status: (item.status as ItemPayload["status"]) ?? "tersedia",
    });
    setMutError(null);
    setShowModal(true);
  };

  const handleToggleStatus = async (item: Item) => {
    const nextStatus = item.status === "tersedia" ? "nonaktif" : "tersedia";
    try {
      await statusMutation.mutateAsync({ id: item.id, status: nextStatus });
      showToast(`Status "${item.name}" diubah ke ${nextStatus}.`);
    } catch (err) {
      showToast(getApiErrorMessage(err));
    }
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  // Simple stats calculation based on current view or total
  const totalAvailable = items.filter((it) => it.status === "tersedia").length;
  const totalDamaged = items.filter((it) => it.status === "rusak").length;
  const totalInactive = items.filter((it) => it.status === "nonaktif").length;

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="size-4" />
              Kembali ke Dashboard Admin
            </Link>
            <span className="hidden text-slate-300 sm:inline">/</span>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <Box className="size-4" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                Master Kelola Barang &amp; Inventaris
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              title="Perbarui data"
            >
              <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} />
              Refresh
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-dark transition-all cursor-pointer"
            >
              <Plus className="size-4" />
              Tambah Barang Baru
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-brand flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600" />
              {toastMessage}
            </span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-line bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Terdaftar</span>
              <span className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Layers className="size-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-ink">{total}</p>
            <p className="text-[11px] text-slate-400">Total inventaris barang</p>
          </div>

          <div className="rounded-2xl border border-line bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600">Siap Dipinjam</span>
              <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="size-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-600">{totalAvailable}</p>
            <p className="text-[11px] text-slate-400">Status tersedia saat ini</p>
          </div>

          <div className="rounded-2xl border border-line bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-600">Rusak / Perbaikan</span>
              <span className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <AlertTriangle className="size-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-amber-600">{totalDamaged}</p>
            <p className="text-[11px] text-slate-400">Dalam perbaikan fisik</p>
          </div>

          <div className="rounded-2xl border border-line bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Nonaktif</span>
              <span className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <XCircle className="size-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-600">{totalInactive}</p>
            <p className="text-[11px] text-slate-400">Ditangguhkan / disimpan</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama barang, kategori..."
              className="w-full rounded-xl border border-line bg-slate-50/70 py-2 pl-10 pr-4 text-xs outline-none focus:border-brand focus:bg-white transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-semibold text-slate-500">Status:</span>
            {[
              { id: "all", label: "Semua" },
              { id: "tersedia", label: "Tersedia" },
              { id: "rusak", label: "Rusak" },
              { id: "nonaktif", label: "Nonaktif" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                  statusFilter === tab.id
                    ? "bg-brand text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table Section */}
        {isLoading ? (
          <LoadingSpinner size="lg" className="my-20" />
        ) : error ? (
          <AlertMessage message="Gagal memuat data barang inventaris. Silakan periksa koneksi atau coba lagi." />
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-line bg-slate-50/80 font-bold text-slate-600">
                  <tr>
                    <th className="px-4 py-3.5">Nama Barang</th>
                    <th className="px-4 py-3.5">Kategori</th>
                    <th className="px-4 py-3.5 text-center">Stok Total</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Deskripsi / Spesifikasi</th>
                    <th className="px-4 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Box className="mx-auto size-8 text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600">Tidak ada barang yang ditemukan.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Coba ubah kata kunci pencarian atau tambahkan barang baru.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-bold text-ink">
                          {item.name}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                            {item.category || "Umum"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-700">
                          {item.stock_total ?? item.stock ?? 0} unit
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                          {item.description || "-"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 font-semibold text-blue-700 hover:bg-blue-100 cursor-pointer transition-colors"
                              title="Edit rincian barang"
                            >
                              <Pencil className="size-3.5" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleToggleStatus(item)}
                              className={cn(
                                "rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer",
                                item.status === "tersedia"
                                  ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                              )}
                              title="Ubah status ketersediaan"
                            >
                              {item.status === "tersedia" ? "Nonaktifkan" : "Aktifkan"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(item)}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 font-semibold text-red-600 hover:bg-red-100 cursor-pointer transition-colors"
                              title="Hapus barang dari master"
                            >
                              <Trash2 className="size-3.5" />
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <PaginationBar
              page={page}
              total={total}
              perPage={15}
              onPageChange={setPage}
              className="mt-4"
            />
          </div>
        )}

        {/* Modal Tambah / Edit Barang */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-fadeIn">
            <div className="w-full max-w-lg rounded-3xl border border-line bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Box className="size-4" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-ink">
                      {editId ? "Edit Barang Inventaris" : "Tambah Barang Inventaris Baru"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {editId
                        ? "Perbarui informasi dan ketersediaan stok barang"
                        : "Daftarkan alat atau barang baru ke inventaris kampus"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              {mutError && (
                <div className="mt-4">
                  <AlertMessage message={mutError} />
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Barang <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    placeholder="Contoh: Sound System Portable Behringer"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-brand"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kategori <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-brand"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Stok Total <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={form.stock_total}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          stock_total: Number(e.target.value) || 0,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Ketersediaan
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        status: e.target.value as ItemPayload["status"],
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-brand"
                  >
                    <option value="tersedia">Tersedia</option>
                    <option value="rusak">Rusak</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deskripsi / Kelengkapan / Lokasi Penyimpanan
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Termasuk 2 mic wireless, kabel power, disimpan di Lemari Sarpras Lt 1"
                    value={form.description}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, description: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-brand"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="rounded-xl bg-brand px-5 py-2 text-xs font-semibold text-white hover:bg-brand-dark transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "Menyimpan..."
                      : editId
                      ? "Simpan Perubahan"
                      : "Tambah Barang"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={!!deleteTarget}
          title="Hapus Barang Inventaris"
          message={`Yakin ingin menghapus barang "${deleteTarget?.name}" dari daftar inventaris? Tindakan ini tidak dapat dibatalkan jika barang pernah dipinjam.`}
          confirmLabel={deleteMutation.isPending ? "Menghapus..." : "Hapus Barang"}
          cancelLabel="Batal"
          onConfirm={async () => {
            if (deleteTarget) {
              try {
                await deleteMutation.mutateAsync(deleteTarget.id);
                showToast(`Barang "${deleteTarget.name}" berhasil dihapus.`);
                setDeleteTarget(null);
              } catch (err) {
                showToast(getApiErrorMessage(err));
              }
            }
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </div>
  );
}
