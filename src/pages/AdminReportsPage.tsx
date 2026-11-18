import { useAdminBookingStats, useAdminSummaryReport } from "../hooks/useAdminQueries";
import { exportAdminBookingsExcelApi, exportBookingSummaryExcelApi } from "../api/adminService";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import AlertMessage from "../components/ui/AlertMessage";
import ExportButton from "../components/ui/ExportButton";

export default function AdminReportsPage() {
  const { data: stats, isLoading: statsLoading } = useAdminBookingStats();
  const { data: summary, isLoading: summaryLoading } = useAdminSummaryReport();

  if (statsLoading || summaryLoading) return <LoadingSpinner size="lg" className="mt-20" />;

  const statCards = [
    { label: "Total Peminjaman", value: stats?.total_bookings ?? 0, color: "bg-blue-50 text-blue-700" },
    { label: "Menunggu Review", value: stats?.pending_bookings ?? 0, color: "bg-yellow-50 text-yellow-700" },
    { label: "Disetujui", value: stats?.approved_bookings ?? 0, color: "bg-green-50 text-green-700" },
    { label: "Fasilitas Aktif", value: stats?.active_facilities ?? 0, color: "bg-indigo-50 text-indigo-700" },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Laporan & Rekap</h1>
        <div className="flex gap-3">
          <ExportButton
            onExport={() => exportAdminBookingsExcelApi()}
            label="Export Peminjaman"
          />
          <ExportButton
            onExport={() => exportBookingSummaryExcelApi()}
            label="Export Ringkasan"
          />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className={`rounded-xl p-4 ${card.color}`}>
            <p className="text-sm font-medium opacity-80">{card.label}</p>
            <p className="text-3xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Summary Data */}
      {summary && Object.keys(summary).length > 0 && (
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Ringkasan Detail</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {Object.entries(summary).map(([key, val]) => (
              <div key={key} className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 uppercase">{key.replace(/_/g, " ")}</span>
                <span className="font-semibold text-gray-900">{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!summary || Object.keys(summary).length === 0) && (
        <AlertMessage message="Belum ada data ringkasan tersedia." type="info" />
      )}
    </div>
  );
}
