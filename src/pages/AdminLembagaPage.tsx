import { useState } from "react";
import { useAdminMasterLembaga } from "../hooks/useAdminQueries";
import { useCreateLembaga, useUpdateLembaga, useDeleteLembaga } from "../hooks/useMutations";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import AlertMessage from "../components/ui/AlertMessage";
import PaginationBar from "../components/ui/PaginationBar";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import type { Lembaga } from "../types/api";
import type { LembagaPayload } from "../api/adminService";

const emptyForm: LembagaPayload = { name: "", is_active: true };

export default function AdminLembagaPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAdminMasterLembaga(page, 20);

  const createMutation = useCreateLembaga();
  const updateMutation = useUpdateLembaga();
  const deleteMutation = useDeleteLembaga();

  const [form, setForm] = useState<LembagaPayload>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Lembaga | null>(null);
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

  if (isLoading) return <LoadingSpinner size="lg" className="mt-20" />;
  if (error) return <AlertMessage message="Gagal memuat data lembaga." />;

  const items = data?.items ?? [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Master Lembaga</h1>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
        >
          + Tambah Lembaga
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-5 mb-6 flex flex-col gap-4 max-w-md">
          <h2 className="font-semibold text-gray-800">{editId ? "Edit Lembaga" : "Tambah Lembaga Baru"}</h2>
          <AlertMessage message={mutError} />
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Nama Lembaga</span>
            <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} />
            Aktif
          </label>
          <div className="flex gap-3 justify-end">
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
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((lb) => (
              <tr key={lb.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{lb.name}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${lb.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {lb.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => { setEditId(lb.id); setForm({ name: lb.name, is_active: lb.is_active }); setShowForm(true); }}
                      className="text-xs text-indigo-600 hover:underline"
                    >Edit</button>
                    <button onClick={() => setDeleteTarget(lb)} className="text-xs text-red-600 hover:underline">Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PaginationBar page={page} perPage={20} total={data?.total ?? 0} onPageChange={setPage} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Lembaga?"
        message={`Lembaga "${deleteTarget?.name}" akan dihapus permanen.`}
        confirmLabel="Ya, Hapus"
        danger
        isLoading={deleteMutation.isPending}
        onConfirm={() => void deleteMutation.mutateAsync(deleteTarget!.id).finally(() => setDeleteTarget(null))}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
