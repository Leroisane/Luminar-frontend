export default function AdminStatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Menunggu Persetujuan */}
      <div className="bg-white p-5 rounded-xl border-2 border-amber-400/80 shadow-sm relative">
        <div className="flex justify-between items-start mb-3">
          <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
            Menunggu Persetujuan
          </span>
          <span className="p-2 bg-amber-50 text-amber-600 rounded-lg text-lg">
            📋
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-[#121212]">8</span>
          <span className="text-sm font-medium text-gray-500">Berkas</span>
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>3
          berkas butuh respons cepat &lt; 2 jam
        </div>
      </div>

      {/* 2. Disetujui Hari Ini */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-start mb-3">
          <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
            Disetujui Hari Ini
          </span>
          <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg text-lg">
            ✓
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-[#121212]">14</span>
          <span className="text-sm font-medium text-gray-500">Pengajuan</span>
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
          ↑ +4 berkas dibanding kemarin
        </div>
      </div>

      {/* 3. Item Dikelola */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-start mb-3">
          <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
            Item Dikelola
          </span>
          <span className="p-2 bg-slate-50 text-slate-600 rounded-lg text-lg">
            📦
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-[#121212]">112</span>
          <span className="text-sm font-medium text-gray-500">Unit</span>
        </div>
        <p className="mt-3 text-xs text-gray-500 font-medium">
          38 Ruangan • 74 Perangkat Lab
        </p>
      </div>

      {/* 4. Jadwal Bentrok */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-start mb-3">
          <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
            Jadwal Bentrok
          </span>
          <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg text-lg">
            🛡️
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-[#121212]">0</span>
          <span className="text-sm font-medium text-gray-500">Konflik</span>
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
          ✓ Validasi otomatis aktif
        </div>
      </div>
    </div>
  );
}