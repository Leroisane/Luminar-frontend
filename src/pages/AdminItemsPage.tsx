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

const emptyForm: ItemPayload = {
  name: "",
  category: "",
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
      setMutError(String(err));
    }
  };

  const openEdit = (item: Item) => {
    setEditId(item.id);
    setForm({
      name: item.name,
      category: item.category ?? "",
      description: item.description ?? "",
      stock_total: item.stock_total,
      status: item.status,
    });
    setShowForm(true);
  };

  if (isLoading) return <LoadingSpinner size="lg" className="mt-20" />;
  if (error) return <AlertMessage message="Gagal memuat data barang." />;

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
          <AlertMessage message={mutError} />
          {(["name", "category", "description"] as const).map((field) => (
            <label key={field} className="col-span-2 flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-600 capitalize">{field}</span>
              <input
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={form[field] ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                required={field === "name"}
              />
            </label>
          ))}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Stok Total</span>
            <input
              type="number"
              min={0}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.stock_total}
              onChange={(e) => setForm((p) => ({ ...p, stock_total: Number(e.target.value) }))}
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Status</span>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  status: e.target.value as ItemPayload["status"],
                }))
              }
            >
              <option value="tersedia">Tersedia</option>
              <option value="rusak">Rusak</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
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
              <th className="px-4 py-3 text-center">Tersedia</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                <td className="px-4 py-3 text-gray-600">{item.category ?? "-"}</td>
                <td className="px-4 py-3 text-center">{item.stock_total}</td>
                <td className="px-4 py-3 text-center">{item.stock_available}</td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(item)} className="text-xs text-indigo-600 hover:underline">Edit</button>
                    <button
                      onClick={() =>
                        void statusMutation.mutateAsync({
                          id: item.id,
                          status: item.status === "tersedia" ? "nonaktif" : "tersedia",
                        })
                      }
                      className="text-xs text-yellow-600 hover:underline"
                    >
                      {item.status === "tersedia" ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                    <button onClick={() => setDeleteTarget(item)} className="text-xs text-red-600 hover:underline">Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PaginationBar page={page} perPage={15} total={total} onPageChange={setPage} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Barang?"
        message={`Barang "${deleteTarget?.name}" akan dihapus permanen.`}
        confirmLabel="Ya, Hapus"
        danger
        isLoading={deleteMutation.isPending}
        onConfirm={() =>
          void deleteMutation
            .mutateAsync(deleteTarget!.id)
            .finally(() => setDeleteTarget(null))
        }
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
