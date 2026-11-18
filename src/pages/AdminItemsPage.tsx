import { useState } from "react";
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

const emptyForm: ItemPayload = {
  name: "",
  category: "",     // required by backend
  description: "",
  stock_total: 1,
  status: "tersedia",
};

export default function AdminItemsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAdminMasterItems(page, 15);

  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem();
  const deleteMutation = useDeleteItem();
  const statusMutation = usePatchItemStatus();

  const [form, setForm] = useState<ItemPayload>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [mutError, setMutError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMutError(null);
    try {
      if (editId) {
        await updateMutation.mutateAsync({ id: editId, payload: form });
      } else {
        await createMutation.mutateAsync(form);
      }
      setShowForm(false);
      setForm(emptyForm);
      setEditId(null);
    } catch (err) {
      setMutError(getApiErrorMessage(err));
    }
  };

  const openEdit = (item: Item) => {
    setEditId(item.id);
    setForm({
      name: item.name,
      category: item.category ?? "",
      description: item.description ?? "",
      stock_total: item.stock_total ?? 1,
      status: (item.status as ItemPayload["status"]) ?? "tersedia",
    });
    setShowForm(true);
  };

  if (isLoading) return <LoadingSpinner size="lg" className="mt-20" />;
  if (error) return <AlertMessage message="Gagal memuat data barang. (Endpoint /admin/items belum tersedia di backend.)" />;

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Master Barang</h1>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
        >
          + Tambah Barang
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow p-5 mb-6 grid grid-cols-2 gap-4"
        >
          <h2 className="col-span-2 font-semibold text-gray-800">
            {editId ? "Edit Barang" : "Tambah Barang Baru"}
          </h2>
          {mutError && <AlertMessage message={mutError} className="col-span-2" />}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Nama Barang</span>
            <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Kategori</span>
            <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="cth: Elektronik" required />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Stok Total</span>
            <input type="number" min={0} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.stock_total} onChange={(e) => setForm((p) => ({ ...p, stock_total: Number(e.target.value) }))} required />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Status</span>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as ItemPayload["status"] }))}>
              <option value="tersedia">Tersedia</option>
              <option value="rusak">Rusak</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </label>
          <label className="col-span-2 flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Deskripsi</span>
            <textarea className="border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </label>
          <div className="col-span-2 flex gap-3 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Batal</button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
              {createMutation.isPending || updateMutation.isPending ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Nama</th>
              <th className="px-4 py-3 text-left">Kategori</th>
              <th className="px-4 py-3 text-center">Stok</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Belum ada data barang.</td></tr>
            )}
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                <td className="px-4 py-3 text-gray-600">{item.category ?? "-"}</td>
                <td className="px-4 py-3 text-center text-gray-600">{item.stock_total ?? 0}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 text-right flex gap-2 justify-end">
                  <button onClick={() => openEdit(item)} className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">Edit</button>
                  <button
                    onClick={() => {
                      const next = item.status === "tersedia" ? "nonaktif" : "tersedia";
                      statusMutation.mutate({ id: item.id, status: next });
                    }}
                    className="px-3 py-1 text-xs bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100"
                  >
                    {item.status === "tersedia" ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                  <button onClick={() => setDeleteTarget(item)} className="px-3 py-1 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100">Hapus</button>
                </td>
              </tr>
            ))}
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

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Barang"
        message={`Yakin ingin menghapus barang "${deleteTarget?.name}"?`}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteMutation.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
