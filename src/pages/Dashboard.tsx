import ScheduleSection from "../components/dashboard/ScheduleSection";
import CatalogSection from "../components/dashboard/CatalogSection";
import StatusSection from "../components/dashboard/StatusSection";

export default function Dashboard() {
  return (
    // Menggunakan preferensi warna off-white dan dark charcoal kamu
    <div className="min-h-screen bg-[#F8F9FA] text-[#121212] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Dashboard */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold">FILKOM Fasilitas</h1>
          <p className="text-gray-600">Sistem Peminjaman Fasilitas & Alat</p>
        </header>

        {/* 3 Bagian Utama */}
        <ScheduleSection />
        <CatalogSection />
        <StatusSection />
      </div>
    </div>
  );
}
