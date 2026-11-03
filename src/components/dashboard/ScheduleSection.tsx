export default function ScheduleSection() {
  const slots = [
    {
      id: 1,
      name: "Auditorium FILKOM Gd. G Lt. 2",
      time: "08.00 - 11.30 WIB",
      status: "Tersedia",
      color: "text-green-600 bg-green-50 border-green-200",
    },
    {
      id: 2,
      name: "Lab Rekayasa Perangkat Lunak Gd. F",
      time: "13.00 - 16.00 WIB",
      status: "Tersedia",
      color: "text-green-600 bg-green-50 border-green-200",
    },
    {
      id: 3,
      name: "Sony Alpha A7 IV Kit + Wireless Mic",
      time: "09.00 - 17.00 WIB",
      status: "Tersedia 2 Unit",
      color: "text-green-600 bg-green-50 border-green-200",
    },
    {
      id: 4,
      name: "Ruang Sidang Utama Gd. A Lt. 1",
      time: "10.00 - 12.00 WIB",
      status: "Dipesan - BEM",
      color: "text-orange-600 bg-orange-50 border-orange-200",
    },
  ];

  return (
    <section>
      <h2 className="text-2xl font-bold mb-2">Cek Jadwal & Ketersediaan</h2>
      <p className="text-gray-500 mb-6">
        Pantau okupansi ruangan dan alat secara real-time
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placeholder Kalender */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-center min-h-[300px]">
          <p className="text-gray-400">
            Komponen Kalender (react-day-picker) ditaruh di sini
          </p>
        </div>

        {/* Daftar Slot */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="font-semibold mb-4">Slot Waktu Tersedia</h3>
          <div className="space-y-4">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition"
              >
                <div>
                  <h4 className="font-medium text-[#121212]">{slot.name}</h4>
                  <p className="text-sm text-gray-500">{slot.time}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-3 py-1 rounded-full border ${slot.color}`}
                  >
                    {slot.status}
                  </span>
                  <button className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">
                    Pilih Slot
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
