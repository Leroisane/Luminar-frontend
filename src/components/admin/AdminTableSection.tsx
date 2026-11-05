export interface ApplicationItem {
  id: string;
  applicant: { name: string; idNum: string; role: string; avatarBg: string };
  item: { title: string; subtitle: string };
  date: { dateStr: string; duration: string };
  document: string;
}

export default function AdminTableSection() {
  const requests: ApplicationItem[] = [
    {
      id: "1",
      applicant: {
        name: "Rian Adithya",
        idNum: "NIM 215150201111012",
        role: "BEM FILKOM",
        avatarBg: "bg-blue-100 text-blue-600",
      },
      item: {
        title: "Auditorium Algoritma Lt. 2",
        subtitle: "Kapasitas: 250 Kursi + Sound System",
      },
      date: { dateStr: "18 Nov 2025", duration: "08.00 - 13.00 WIB (5 Jam)" },
      document: "Proposal_AI.pdf",
    },
    {
      id: "2",
      applicant: {
        name: "Dewi Sartika, M.Kom.",
        idNum: "NIP 198709121002",
        role: "Dosen TIF",
        avatarBg: "bg-emerald-100 text-emerald-600",
      },
      item: {
        title: "Lab Rekayasa Perangkat Lunak (F2.1)",
        subtitle: "40 Workstation + Proyektor Laser",
      },
      date: { dateStr: "19 Nov 2025", duration: "13.00 - 15.30 WIB (2.5 Jam)" },
      document: "Nota_Dinas.pdf",
    },
    {
      id: "3",
      applicant: {
        name: "Fahmi Kurniawan",
        idNum: "NIM 225150407111003",
        role: "Lab Multimedia",
        avatarBg: "bg-purple-100 text-purple-600",
      },
      item: {
        title: "Sony A7 IV Kit + Gimbal Ronin RS3",
        subtitle: "ID: EQ-MM-089 (Kamera & Aksesoris)",
      },
      date: { dateStr: "20 Nov 2025", duration: "09.00 - 17.00 WIB (1 Hari)" },
      document: "Form_Peminjaman.pdf",
    },
    {
      id: "4",
      applicant: {
        name: "Maya Septiani",
        idNum: "NIM 215150400111054",
        role: "HMD SI",
        avatarBg: "bg-amber-100 text-amber-600",
      },
      item: {
        title: "Ruang Kolaborasi H1.6 Gedung G",
        subtitle: 'Smart Board 75", Kapasitas 30 Orang',
      },
      date: { dateStr: "21 Nov 2025", duration: "10.00 - 12.00 WIB (2 Jam)" },
      document: "Surat_Izin.pdf",
    },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
      {/* Table Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-[#121212]">
              Permohonan Peminjaman Terbaru
            </h3>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
              8 Baru
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Daftar reservasi masuk yang memerlukan verifikasi dan otorisasi
            persetujuan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select className="border border-gray-300 rounded-lg text-xs px-3 py-2 bg-white text-gray-700">
            <option>Semua Kategori</option>
            <option>Ruang Kuliah</option>
            <option>Lab Komputer</option>
          </select>
          <input
            type="text"
            placeholder="Cari dalam tabel..."
            className="border border-gray-300 rounded-lg text-xs px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
          <button className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg">
            ⚡ Aksi Masal
          </button>
        </div>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider">
              <th className="py-3 px-2">Nama Pengaju</th>
              <th className="py-3 px-2">Ruang / Barang</th>
              <th className="py-3 px-2">Tanggal Pinjam</th>
              <th className="py-3 px-2">Dokumen</th>
              <th className="py-3 px-2 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-gray-50/80 transition">
                <td className="py-4 px-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${req.applicant.avatarBg}`}
                    >
                      {req.applicant.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">
                        {req.applicant.name}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {req.applicant.idNum} • {req.applicant.role}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="py-4 px-2">
                  <div className="font-semibold text-gray-800">
                    {req.item.title}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {req.item.subtitle}
                  </div>
                </td>

                <td className="py-4 px-2">
                  <div className="font-semibold text-gray-800">
                    {req.date.dateStr}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {req.date.duration}
                  </div>
                </td>

                <td className="py-4 px-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md font-mono text-[11px] border border-gray-200 hover:bg-gray-200 cursor-pointer">
                    📄 {req.document}
                  </span>
                </td>

                <td className="py-4 px-2">
                  <div className="flex items-center justify-center gap-2">
                    <button className="px-4 py-1.5 bg-[#2E5B3C] text-white font-semibold rounded-lg hover:bg-emerald-800 transition">
                      ✓ Approve
                    </button>
                    <button className="px-3 py-1.5 border border-gray-300 text-gray-600 font-semibold rounded-lg hover:bg-gray-100 transition">
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}