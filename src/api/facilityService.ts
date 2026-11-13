import type { BuildingKey, Facility, MyBooking, TimeSlot } from "../types";

/**
 * MOCK SERVICE.
 * Nanti ganti isi fungsi dengan axiosClient, contoh:
 *   const { data } = await axiosClient.get<Facility[]>("/facilities");
 *   return data;
 */

const wait = <T>(data: T, ms = 250) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(data), ms));

const facilities: Facility[] = [
  {
    id: "f1",
    name: "Auditorium Algoritma Lt. 2",
    image: "/images/auditorium.jpg",
    location: "Gedung G FILKOM",
    specs:
      "Kapasitas 250 orang • Sound System Dual Sub • Dual Laser Projector • AC Central",
    category: "Ruang Kuliah",
    requirement: { label: "Status Pengajuan", value: "Instan Online" },
  },
  {
    id: "f2",
    name: "Smart Classroom 3.4 (Hybrid)",
    image: "/images/smart-classroom.jpg",
    location: "Gedung F FILKOM",
    specs:
      "Kapasitas 45 orang • Auto-tracking Camera • Mic Ceiling Array • Pod Meja",
    category: "Ruang Kuliah",
    requirement: { label: "Status Pengajuan", value: "Instan Online" },
  },
  {
    id: "f3",
    name: "Sony FX3 Cinema Camera Kit",
    image: "/images/sony-fx3.jpg",
    location: "Lab Multimedia Gd. G",
    specs:
      "4K 120fps • 2x CFexpress Type A 160GB • Rode Wireless Pro 2-ch • Hardcase",
    category: "Peralatan Multimedia",
    units: 3,
    requirement: { label: "Verifikasi Lab", value: "KTM Aktif" },
  },
  {
    id: "f4",
    name: "Epson 7000-Lumen Projector",
    image: "/images/epson-projector.jpg",
    location: "Ruang Sarpras FILKOM",
    specs:
      "7,000 Lumens • WUXGA 4K Enhancement • motorized lens • Screen 200 inch",
    category: "Peralatan Multimedia",
    units: 2,
    requirement: { label: "Verifikasi Lab", value: "KTM Aktif" },
  },
];

const slots: TimeSlot[] = [
  {
    id: "s1",
    name: "Auditorium FILKOM Gd. G Lt. 2",
    time: "08.00 - 11.30 WIB",
    meta: "Kapasitas: 180 Kursi",
    icon: "auditorium",
    status: "available",
  },
  {
    id: "s2",
    name: "Lab Rekayasa Perangkat Lunak Gd. F",
    time: "13.00 - 16.00 WIB",
    meta: "40 Workstations Core i7",
    icon: "lab",
    status: "available",
  },
  {
    id: "s3",
    name: "Sony Alpha A7 IV Kit + Wireless Mic",
    time: "09.00 - 17.00 WIB",
    meta: "Multimedia FILKOM",
    icon: "camera",
    status: "units",
    units: 2,
  },
  {
    id: "s4",
    name: "Ruang Sidang Utama Gd. A Lt. 1",
    time: "10.00 - 12.00 WIB",
    meta: "Kapasitas: 35 Orang",
    icon: "gavel",
    status: "reserved",
    reservedBy: "BEM",
  },
];

const myBooking: MyBooking = {
  ticketId: "#FK-2025-0891",
  status: "Sedang Diproses",
  submittedAt: "24 Nov 2025",
  activity: "Workshop UI/UX Design Club FILKOM",
  resources: "Smart Classroom 3.4 & 1x Mic Wireless",
  schedule: "Kamis, 27 Nov 2025 (09:00 - 13:00 WIB)",
  steps: [
    {
      id: 1,
      title: "Pengajuan Masuk",
      timestamp: "24 Nov, 10:15 WIB",
      note: "Dokumen lengkap terunggah",
      state: "done",
    },
    {
      id: 2,
      title: "Disetujui Kemahasiswaan",
      timestamp: "24 Nov, 14:30 WIB",
      note: "Disetujui BEM AF / Wadek III",
      state: "done",
    },
    {
      id: 3,
      title: "Verifikasi Sarpras & Kunci",
      timestamp: "",
      note: "Sedang Ditinjau",
      description: "Pengecekan kesiapan alat oleh tim teknis",
      state: "current",
    },
    {
      id: 4,
      title: "QR Pass Terbit",
      timestamp: "Menunggu Verifikasi",
      note: "",
      description: "Digunakan untuk tap masuk ruangan",
      state: "pending",
    },
  ],
};

export const facilityService = {
  getFacilities: () => wait(facilities),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getSlots: (_date: string, _building: BuildingKey) => wait(slots),
  getMyBooking: () => wait(myBooking),
};
