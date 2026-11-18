import { useState } from "react";
import { useAdminMasterRooms } from "../hooks/useAdminQueries";
import {
  useCreateRoom,
  useUpdateRoom,
  useDeleteRoom,
  usePatchRoomStatus,
} from "../hooks/useMutations";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import AlertMessage from "../components/ui/AlertMessage";
import PaginationBar from "../components/ui/PaginationBar";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import StatusBadge from "../components/ui/StatusBadge";
import type { Room } from "../types/api";
import type { RoomPayload } from "../api/adminService";

const emptyForm: RoomPayload = {
  name: "",
  building: "",
  capacity: 1,
  description: "",
  status: "tersedia",
};

export default function AdminRoomsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAdminMasterRooms(page, 15);

  const createMutation = useCreateRoom();
  const updateMutation = useUpdateRoom();
  const deleteMutation = useDeleteRoom();
  const statusMutation = usePatchRoomStatus();

  const [form, setForm] = useState<RoomPayload>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
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

  const openEdit = (room: Room) => {
    setEditId(room.id);
    setForm({
      name: room.name,
      building: room.building,
      capacity: room.capacity,
      description: room.description ?? "",
      status: room.status,
    });
    setShowForm(true);
  };

  if (isLoading) return <LoadingSpinner size="lg" className="mt-20" />;
  if (error) return <AlertMessage message="Gagal memuat data ruangan." />;

  const rooms = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Master Ruangan</h1>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
        >
          + Tambah Ruangan
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow p-5 mb-6 grid grid-cols-2 gap-4"
        >
          <h2 className="col-span-2 font-semibold text-gray-800">
            {editId ? "Edit Ruangan" : "Tambah Ruangan Baru"}
          </h2>
          <AlertMessage message={mutError} />
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Nama Ruangan</span>
            <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Gedung</span>
            <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.building} onChange={(e) => setForm((p) => ({ ...p, building: e.target.value }))} required />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Kapasitas</span>
            <input type="number" min={1} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: Number(e.target.value) }))} required />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Status</span>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as RoomPayload["status"] }))}>
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
              <th className="px-4 py-3 text-left">Gedung</th>
              <th className="px-4 py-3 text-center">Kapasitas</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rooms.map((room) => (
              <tr key={room.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{room.name}</td>
                <td className="px-4 py-3 text-gray-600">{room.building}</td>
                <td className="px-4 py-3 text-center">{room.capacity}</td>
                <td className="px-4 py-3"><StatusBadge status={room.status} /></td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(room)} className="text-xs text-indigo-600 hover:underline">Edit</button>
                    <button
                      onClick={() =>
                        void statusMutation.mutateAsync({
                          id: room.id,
                          status: room.status === "tersedia" ? "nonaktif" : "tersedia",
                        })
                      }
                      className="text-xs text-yellow-600 hover:underline"
                    >
                      {room.status === "tersedia" ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                    <button onClick={() => setDeleteTarget(room)} className="text-xs text-red-600 hover:underline">Hapus</button>
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
        title="Hapus Ruangan?"
        message={`Ruangan "${deleteTarget?.name}" akan dihapus permanen.`}
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
