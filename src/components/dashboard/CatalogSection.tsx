export default function CatalogSection() {
  const items = [
    {
      id: 1,
      name: "Auditorium Algoritma Lt. 2",
      spec: "Kapasitas 250 orang • Sound System",
      status: "Tersedia",
    },
    {
      id: 2,
      name: "Smart Classroom 3.4",
      spec: "Kapasitas 45 orang • Auto-tracking",
      status: "Tersedia",
    },
    {
      id: 3,
      name: "Sony FX3 Cinema Camera Kit",
      spec: "4K 120fps • 2x CFexpress",
      status: "Tersedia (3 Unit)",
    },
    {
      id: 4,
      name: "Epson 7000-Lumen Projector",
      spec: "7000 Lumens • WUXGA",
      status: "Tersedia (2 Unit)",
    },
  ];

  return (
    <section>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Katalog Alat & Ruangan</h2>
          <p className="text-gray-500">
            Jelajahi spesifikasi lengkap fasilitas akademik
          </p>
        </div>
        <div className="hidden md:flex gap-2">
          {["Semua", "Ruang Kuliah", "Laboratorium", "Multimedia"].map(
            (tab, i) => (
              <button
                key={i}
                className={`px-4 py-2 text-sm rounded-full ${i === 0 ? "bg-[#121212] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {tab}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition"
          >
            <div className="h-40 bg-gray-200 relative">
              {/* Gambar aslinya masuk sini */}
              <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>{" "}
                {item.status}
              </span>
            </div>
            <div className="p-5">
              <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
              <p className="text-xs text-gray-500 mb-4 h-8">{item.spec}</p>
              <button className="w-full bg-[#121212] text-white py-2 rounded-lg text-sm hover:bg-gray-800 transition">
                Ajukan Peminjaman
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
