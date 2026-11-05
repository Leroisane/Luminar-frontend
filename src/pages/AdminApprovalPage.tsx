import AdminStatsCards from "../components/admin/AdminStatsCards";
import AdminCalendar from "../components/admin/AdminCalendar";
import AdminTableSection from "../components/admin/AdminTableSection";

export default function AdminApprovalPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#121212] p-4 md:p-8 space-y-6 font-sans">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-gray-400 font-medium mb-1">
            Sarpras Portal &gt; Approval &gt;{" "}
            <span className="text-gray-700">Monitoring Reservasi</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#121212]">
            Approval Masuk & Monitoring Peminjaman
          </h1>
          <p className="text-xs text-gray-500">
            Kelola verifikasi persetujuan ruangan laboratorium, auditorium, dan
            peralatan multimedia FILKOM UB
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-2 bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-lg hover:bg-gray-50">
            🔄 Perbarui
          </button>
          <button className="px-3 py-2 bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-lg hover:bg-gray-50">
            🎛️ Filter Status
          </button>
          <button className="px-4 py-2 bg-[#2E5B3C] text-white text-xs font-semibold rounded-lg hover:bg-emerald-800 transition">
            📥 Ekspor Rekap
          </button>
        </div>
      </div>

      {/* 1. Stat Cards */}
      <AdminStatsCards />

      {/* 2. Kalender Sentral */}
      <AdminCalendar />

      {/* 3. Tabel Permohonan Terbaru */}
      <AdminTableSection />
    </div>
  );
}
