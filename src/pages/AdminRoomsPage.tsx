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
import { getApiErrorMessage } from "../api/axiosClient";

const emptyForm: RoomPayload = {
  name: "",
  location: "",       // backend field is "location"
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
      setMutError(getApiErrorMessage(err));
    }
  };

  const openEdit = (room: Room) => {
    setEditId(room.id);
    setForm({
      name: room.name,
      location: room.location ?? "",   // backend field
      capacity: room.capacity,
      description: room.description ?? "",
      status: (room.status as RoomPayload["status"]) ?? "tersedia",
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
          {mutError && <AlertMessage message={mutError} className="col-span-2" />}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Nama Ruangan</span>
            <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Lokasi / Gedung</span>
            <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} placeholder="cth: Gedung GKM Lantai 3" required />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Kapasitas</span>
            <input type="number" min={1} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: Number(e.target.value) }))} required />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">Status</span>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as RoomPayload["status"] }))}>
              <option value="tersedia">Tersedia</option>
              <option value="renovasi">Renovasi</option>
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
              <th className="px-4 py-3 text-left">Lokasi</th>
              <th className="px-4 py-3 text-center">Kapasitas</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rooms.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Belum ada data ruangan.</td></tr>
            )}
            {rooms.map((room) => (
              <tr key={room.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{room.name}</td>
                <td className="px-4 py-3 text-gray-600">{room.location ?? "-"}</td>
                <td className="px-4 py-3 text-center text-gray-600">{room.capacity}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={room.status} />
                </td>
                <td className="px-4 py-3 text-right flex gap-2 justify-end">
                  <button onClick={() => openEdit(room)} className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">Edit</button>
                  <button
                    onClick={() => {
                      const next = room.status === "tersedia" ? "nonaktif" : "tersedia";
                      statusMutation.mutate({ id: room.id, status: next });
                    }}
                    className="px-3 py-1 text-xs bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100"
                  >
                    {room.status === "tersedia" ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                  <button onClick={() => setDeleteTarget(room)} className="px-3 py-1 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100">Hapus</button>
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
        title="Hapus Ruangan"
        message={`Yakin ingin menghapus ruangan "${deleteTarget?.name}"?`}
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
