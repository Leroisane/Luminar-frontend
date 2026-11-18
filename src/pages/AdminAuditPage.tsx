import { useState } from "react";
import { useAdminAuditLogs } from "../hooks/useAdminQueries";
import { exportAuditLogsExcelApi } from "../api/adminService";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import AlertMessage from "../components/ui/AlertMessage";
import PaginationBar from "../components/ui/PaginationBar";
import ExportButton from "../components/ui/ExportButton";

export default function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, error } = useAdminAuditLogs({ page, per_page: 20, q });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQ(searchInput);
    setPage(1);
  };

  if (isLoading) return <LoadingSpinner size="lg" className="mt-20" />;
  if (error) return <AlertMessage message="Gagal memuat audit log." />;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Log Audit</h1>
        <ExportButton
          onExport={() => exportAuditLogsExcelApi({ q })}
          label="Export Excel"
        />
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Cari user, aksi, target..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
          Cari
        </button>
      </form>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Waktu</th>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Aksi</th>
              <th className="px-4 py-3 text-left">Target</th>
              <th className="px-4 py-3 text-left">Deskripsi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">Tidak ada data.</td>
              </tr>
            )}
            {items.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString("id-ID")}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{log.user_name}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${log.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                    {log.role}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-700">{log.action}</td>
                <td className="px-4 py-3 text-gray-600">{log.target_type}/{log.target_id}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{log.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PaginationBar page={page} perPage={20} total={total} onPageChange={setPage} />
    </div>
  );
}
