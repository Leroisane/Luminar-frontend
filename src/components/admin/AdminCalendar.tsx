import { useState } from "react";

export default function AdminCalendar() {
  const [activeCategory, setActiveCategory] = useState("Semua Ruang & Alat");

  const categories = [
    "Semua Ruang & Alat",
    "Auditorium",
    "Lab Komputer",
    "Ruang Kelas",
    "Studio & Multimedia",
  ];

  const daysOfWeek = [
    "MINGGU",
    "SENIN",
    "SELASA",
    "RABU",
    "KAMIS",
    "JUMAT",
    "SABTU",
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
      {/* Header Kalender */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#121212] flex items-center gap-2">
            📅 Kalender Sentral – Monitoring Reservasi Terverifikasi
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Pemetaan komprehensif okupansi ruangan kelas, laboratorium,
            auditorium, dan studio multimedia FILKOM
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs font-medium">
            <button className="px-2.5 py-1 text-gray-600 hover:text-black">
              &lt;
            </button>
            <span className="px-2 font-semibold text-gray-800">
              November 2025
            </span>
            <button className="px-2.5 py-1 text-gray-600 hover:text-black">
              &gt;
            </button>
          </div>

          <div className="flex border border-gray-200 rounded-lg p-0.5 text-xs font-medium">
            <button className="px-3 py-1 bg-gray-100 rounded font-bold text-gray-800">
              Bulan
            </button>
            <button className="px-3 py-1 text-gray-500 hover:text-black">
              Minggu
            </button>
            <button className="px-3 py-1 text-gray-500 hover:text-black">
              Hari
            </button>
          </div>

          <button className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition">
            + Tambah Blokir / Pemeliharaan
          </button>
        </div>
      </div>

      {/* Filter Kategori & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-y border-gray-100 py-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-400 uppercase">
            Kategori:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full font-medium transition ${
                activeCategory === cat
                  ? "bg-[#2E5B3C] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>{" "}
            Ruang Kelas / Lab
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>{" "}
            Auditorium & Seminar
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>{" "}
            Studio & Alat Multimedia
          </span>
        </div>
      </div>

      {/* Grid Kalender */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200 text-center py-2 text-xs font-bold text-gray-500">
          {daysOfWeek.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 text-xs divide-x divide-y divide-gray-200 min-h-[320px]">
          {/* Baris 1 Sample Dates */}
          <div className="p-2 bg-gray-50/40 text-gray-400">26</div>
          <div className="p-2 bg-gray-50/40 text-gray-400">27</div>
          <div className="p-2 bg-gray-50/40 text-gray-400">28</div>
          <div className="p-2 bg-gray-50/40 text-gray-400">29</div>
          <div className="p-2 bg-gray-50/40 text-gray-400">30</div>
          <div className="p-2 bg-gray-50/40 text-gray-400">31</div>
          <div className="p-2">
            <div className="flex justify-between font-bold text-gray-700">
              1{" "}
              <span className="text-[10px] text-gray-400 font-normal">Nov</span>
            </div>
            <div className="mt-1 p-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-semibold">
              09:00 Workshop Web Lab F1
            </div>
          </div>

          {/* Baris Hari Ini Highlight (Tgl 18) */}
          <div className="p-2">2</div>
          <div className="p-2">
            <div className="font-bold text-gray-700">3</div>
            <div className="mt-1 p-1 bg-emerald-50 text-emerald-800 rounded text-[10px]">
              08:00 Rapat Jurusan TIF
            </div>
          </div>
          <div className="p-2">4</div>
          <div className="p-2">
            <div className="font-bold text-gray-700">5</div>
            <div className="mt-1 p-1 bg-blue-50 text-blue-800 rounded text-[10px]">
              13:00 Live Podcast FILKOM
            </div>
          </div>
          <div className="p-2">6</div>
          <div className="p-2">
            <div className="font-bold text-gray-700">7</div>
            <div className="mt-1 p-1 bg-emerald-50 text-emerald-800 rounded text-[10px]">
              10:00 Praktikum Pemrograman
            </div>
          </div>
          <div className="p-2">8</div>
        </div>
      </div>
    </div>
  );
}