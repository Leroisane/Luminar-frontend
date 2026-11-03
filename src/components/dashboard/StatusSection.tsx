export default function StatusSection() {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-2">Status Peminjaman Anda</h2>
      <p className="text-gray-500 mb-6">
        Pantau proses verifikasi permohonan secara transparan
      </p>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        {/* Header Status */}
        <div className="flex justify-between border-b pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
              #FK-2025-0001
            </span>
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded text-sm">
              Sedang Diproses
            </span>
          </div>
          <span className="text-sm text-gray-500">Diajukan: 24 Nov 2025</span>
        </div>

        {/* Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 text-sm">
          <div>
            <p className="text-gray-400 mb-1">Kegiatan Organisasi</p>
            <p className="font-medium">Workshop UI/UX Design Club FILKOM</p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Ruang & Inventaris</p>
            <p className="font-medium">Smart Classroom 3.4 & 1x Mic Wireless</p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Jadwal Penggunaan</p>
            <p className="font-medium">
              Kamis, 27 Nov 2025 (09:00 - 13:00 WIB)
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div className="relative flex justify-between items-center mb-6">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2/3 h-1 bg-green-500 -z-10"></div>

          <div className="flex flex-col items-center bg-white px-2">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
              ✓
            </div>
            <p className="text-xs font-semibold mt-2">1. Pengajuan Masuk</p>
          </div>
          <div className="flex flex-col items-center bg-white px-2">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
              ✓
            </div>
            <p className="text-xs font-semibold mt-2">
              2. Disetujui Kemahasiswaan
            </p>
          </div>
          <div className="flex flex-col items-center bg-white px-2">
            <div className="w-8 h-8 rounded-full border-4 border-green-500 bg-white flex items-center justify-center"></div>
            <p className="text-xs font-semibold mt-2 text-orange-600">
              3. Verifikasi Sarpras
            </p>
          </div>
          <div className="flex flex-col items-center bg-white px-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"></div>
            <p className="text-xs text-gray-400 mt-2">4. QR Pass Terbit</p>
          </div>
        </div>
      </div>
    </section>
  );
}
