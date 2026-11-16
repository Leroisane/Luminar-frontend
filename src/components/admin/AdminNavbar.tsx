import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Building2,
  CheckCheck,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Landmark,
  LogOut,
  Menu,
  Printer,
  Search,
  X,
} from "lucide-react";
import { adminService } from "../../api/adminService";
import { useAuthStore } from "../../store/useAuthStore";
import { cn } from "../../utils/helpers";

interface Props {
  pendingCount: number;
  search: string;
  onSearch: (v: string) => void;
}

const links = [
  { id: "dashboard", label: "Dashboard" },
  { id: "approval", label: "Approval Masuk" },
  { id: "katalog", label: "Katalog Ruang & Alat" },
  { id: "kalender", label: "Kalender Sentral" },
  { id: "draft", label: "Draft Surat" },
  { id: "ekspor", label: "Ekspor Laporan" },
] as const;

type LinkId = (typeof links)[number]["id"];

const CATALOG_OVERVIEW = [
  {
    name: "Auditorium Algoritma (G2)",
    category: "Auditorium",
    status: "Tersedia",
    pic: "Sarpras Gedung G",
  },
  {
    name: "Lab Komputer Jaringan (G1.4)",
    category: "Laboratorium",
    status: "Tersedia",
    pic: "Laboran Jarkom",
  },
  {
    name: "Lab Pemrograman Dasar (G1.2)",
    category: "Laboratorium",
    status: "Terjadwal",
    pic: "Laboran RPL",
  },
  {
    name: "Ruang Kelas F3.1 – F3.4",
    category: "Ruang Kelas",
    status: "Tersedia",
    pic: "Akademik Gedung F",
  },
  {
    name: "Studio Multimedia & Podcast",
    category: "Studio & Multimedia",
    status: "Tersedia",
    pic: "Unit Humas & Media",
  },
];

export default function AdminNavbar({ pendingCount, search, onSearch }: Props) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<LinkId>("approval");
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(5);
  const [profileOpen, setProfileOpen] = useState(false);
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [exportToast, setExportToast] = useState<string | null>(null);

  const [letterNumber, setLetterNumber] = useState("0412/UN10.F15.01/TU/2026");
  const [letterActivity, setLetterActivity] = useState(
    "Study Jam & Workshop Pengembangan Web",
  );
  const [letterOrg, setLetterOrg] = useState("GDGoC Universitas Brawijaya");
  const [letterFacility, setLetterFacility] = useState(
    "Lab Komputer Jaringan (G1.4)",
  );
  const [letterSchedule, setLetterSchedule] = useState(
    "Rabu, 18 November 2026 • 09:00 – 12:00 WIB",
  );

  const handleExportCSV = async () => {
    try {
      const rows = await adminService.getRequests();
      const list = Array.isArray(rows) ? rows : [];
      const headers = [
        "ID Tiket",
        "Nama Pengaju",
        "NIM / Identitas",
        "Organisasi",
        "Fasilitas",
        "Tanggal",
        "Waktu",
        "Status",
      ];

      const csvBody = list.map((r: Record<string, unknown>) => {
        const id = String(r.id ?? "-");
        const name = String(r.name ?? r.applicant ?? r.applicantName ?? "-");
        const identifier = String(r.identifier ?? r.nim ?? "-");
        const org = String(r.org ?? r.organization ?? "-");
        const room = String(r.room ?? r.facility ?? r.facilityName ?? "-");
        const date = String(r.date ?? "-");
        const time = String(r.time ?? "-");
        const status = String(r.status ?? "pending");
        return [id, name, identifier, org, room, date, time, status]
          .map((col) => `"${col.replace(/"/g, '""')}"`)
          .join(",");
      });

      const csvContent = "\uFEFF" + [headers.join(","), ...csvBody].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Rekap_Peminjaman_FILKOM_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      setExportToast("Laporan CSV berhasil diunduh.");
      window.setTimeout(() => setExportToast(null), 3500);
    } catch {
      setExportToast("Gagal mengekspor laporan.");
      window.setTimeout(() => setExportToast(null), 3500);
    }
  };

  const handlePrintLetter = () => {
    document.body.classList.add("printing-letter");
    const cleanup = () => {
      document.body.classList.remove("printing-letter");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
    window.setTimeout(cleanup, 1000);
  };

  const handleNavClick = (id: LinkId) => {
    setOpen(false);
    if (id === "dashboard") {
      setActive("dashboard");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (id === "approval") {
      setActive("approval");
      document
        .getElementById("approval")
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (id === "kalender") {
      setActive("kalender");
      document
        .getElementById("kalender")
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (id === "katalog") {
      setCatalogModalOpen(true);
      return;
    }
    if (id === "draft") {
      setDraftModalOpen(true);
      return;
    }
    if (id === "ekspor") {
      void handleExportCSV();
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const displayName = user?.name || "Pak Bambang S.T.";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-line bg-white/95 backdrop-blur print:hidden">
        <div className="mx-auto flex h-[72px] w-full max-w-[1540px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <button
            type="button"
            onClick={() => handleNavClick("dashboard")}
            className="flex shrink-0 items-center gap-2.5 text-left cursor-pointer"
          >
            <span className="flex size-10 aspect-square shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
              <Landmark className="size-5" />
            </span>
            <span className="leading-tight whitespace-nowrap">
              <span className="block text-base font-bold tracking-tight">
                FILKOM Reserve
              </span>
              <span className="hidden text-[11px] font-medium text-slate-500 sm:block">
                Admin Portal Sarpras &amp; Lab
              </span>
            </span>
          </button>

          {/* Desktop nav — seluruh item 1 baris penuh (whitespace-nowrap) */}
          <nav className="hidden items-center gap-1 xl:flex">
            {links.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => handleNavClick(l.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors cursor-pointer 2xl:px-3.5 2xl:text-sm",
                  l.id === active
                    ? "bg-brand text-white"
                    : "text-slate-700 hover:bg-slate-100",
                )}
              >
                <span>{l.label}</span>
                {l.id === "approval" && (
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                      l.id === active
                        ? "bg-white/25 text-white"
                        : "bg-emerald-100 text-brand",
                    )}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2.5">
            <label className="hidden w-[200px] items-center gap-2 rounded-xl border border-line bg-slate-50 px-3 py-2 lg:flex 2xl:w-[260px]">
              <Search className="size-4 shrink-0 text-slate-400" />
              <input
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Cari pengaju, ruangan..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </label>

            {/* Notifikasi */}
            <div className="relative shrink-0">
              <button
                type="button"
                aria-label="Notifikasi"
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setProfileOpen(false);
                }}
                className="relative flex size-10 shrink-0 items-center justify-center rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <Bell className="size-5 text-slate-600" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1 flex size-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Tutup notifikasi"
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={() => setNotifOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-80 rounded-2xl border border-line bg-white p-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-line pb-2.5">
                      <span className="text-sm font-bold text-slate-900">
                        Notifikasi Sarpras
                      </span>
                      <button
                        type="button"
                        onClick={() => setUnreadCount(0)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline cursor-pointer"
                      >
                        <CheckCheck className="size-3.5" /> Tandai dibaca
                      </button>
                    </div>
                    <ul className="mt-2.5 space-y-2.5 text-xs">
                      <li className="rounded-lg bg-emerald-50/70 p-2.5">
                        <p className="font-semibold text-slate-800">
                          {pendingCount} permohonan peminjaman menunggu
                          verifikasi
                        </p>
                        <p className="mt-0.5 text-slate-500">
                          Periksa kelengkapan proposal sebelum menyetujui.
                        </p>
                      </li>
                      <li className="rounded-lg bg-slate-50 p-2.5">
                        <p className="font-semibold text-slate-800">
                          Pemeliharaan AC Lab G1.4 terjadwal
                        </p>
                        <p className="mt-0.5 text-slate-500">
                          Cek Kalender Sentral untuk menghindari bentrok slot.
                        </p>
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </div>

            <span className="hidden h-7 w-px shrink-0 bg-line sm:block" />

            {/* Profile Menu & Logout — avatar lingkaran sempurna (size-9 shrink-0 aspect-square) */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((v) => !v);
                  setNotifOpen(false);
                }}
                className="flex shrink-0 items-center gap-2.5 rounded-full border border-line py-1 pl-1 pr-3 hover:bg-slate-50 cursor-pointer"
              >
                <span className="flex size-9 aspect-square shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                  {initials || "PB"}
                </span>
                <span className="hidden text-left leading-tight whitespace-nowrap md:block">
                  <span className="block text-xs font-bold text-slate-900">
                    {displayName}
                  </span>
                  <span className="block text-[11px] text-slate-500">
                    Koordinator Sarpras
                  </span>
                </span>
                <ChevronDown className="hidden size-4 shrink-0 text-slate-400 md:block" />
              </button>

              {profileOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Tutup menu profil"
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-line bg-white p-1.5 shadow-xl">
                    <div className="border-b border-line px-3 py-2">
                      <p className="text-xs font-bold text-slate-900">
                        {displayName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {user?.email || "sarpras@ub.ac.id"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <LogOut className="size-4" /> Keluar dari Portal Admin
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              aria-label="Buka menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-line xl:hidden cursor-pointer"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Toast ekspor laporan */}
        {exportToast && (
          <div className="border-t border-emerald-200 bg-emerald-50 px-4 py-2 text-center text-xs font-semibold text-brand">
            <span className="inline-flex items-center gap-1.5">
              <FileSpreadsheet className="size-4" /> {exportToast}
            </span>
          </div>
        )}

        {/* Mobile menu */}
        {open && (
          <div className="border-t border-line bg-white px-4 py-3 xl:hidden">
            <label className="mb-3 flex items-center gap-2 rounded-xl border border-line bg-slate-50 px-3 py-2 lg:hidden">
              <Search className="size-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Cari pengaju, ruangan, NIM..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </label>
            <nav className="grid gap-1 sm:grid-cols-2">
              {links.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => handleNavClick(l.id)}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold cursor-pointer",
                    l.id === active
                      ? "bg-brand text-white"
                      : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  {l.label}
                  {l.id === "approval" && (
                    <span className="text-xs">{pendingCount}</span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Modal Ringkasan Katalog Ruang & Alat */}
      {catalogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-line bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-brand">
                  <Building2 className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Daftar Inventaris Ruang &amp; Alat FILKOM
                  </h3>
                  <p className="text-xs text-slate-500">
                    Status kesiapan fasilitas yang dikelola Koordinator Sarpras
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCatalogModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4 divide-y divide-line rounded-xl border border-line">
              {CATALOG_OVERVIEW.map((item) => (
                <div
                  key={item.name}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-bold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.category} • PIC: {item.pic}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      item.status === "Tersedia"
                        ? "bg-emerald-50 text-brand"
                        : "bg-amber-50 text-amber-700",
                    )}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setCatalogModalOpen(false)}
                className="rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-dark cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Generator Draft Surat Izin */}
      {draftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm print:static print:block print:bg-white print:p-0">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-white p-6 shadow-xl print:max-h-none print:max-w-none print:overflow-visible print:rounded-none print:border-none print:p-0 print:shadow-none">
            <div className="flex items-start justify-between border-b border-line pb-3 print:hidden">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-brand">
                  <FileText className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Draft Surat Izin Pemakaian Fasilitas
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sesuaikan detail surat sebelum dicetak atau disimpan sebagai
                    PDF
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDraftModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 print:hidden">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Nomor Surat
                </label>
                <input
                  value={letterNumber}
                  onChange={(e) => setLetterNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Organisasi Pemohon
                </label>
                <input
                  value={letterOrg}
                  onChange={(e) => setLetterOrg(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Nama Kegiatan
                </label>
                <input
                  value={letterActivity}
                  onChange={(e) => setLetterActivity(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Ruangan / Alat Disetujui
                </label>
                <input
                  value={letterFacility}
                  onChange={(e) => setLetterFacility(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Waktu Penggunaan
                </label>
                <input
                  value={letterSchedule}
                  onChange={(e) => setLetterSchedule(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
            </div>

            {/* Pratinjau Surat */}
            <div className="mt-4 rounded-xl border border-line bg-slate-50 p-5 text-xs leading-relaxed text-slate-800 print:mt-0 print:rounded-none print:border-none print:bg-white print:p-0 print:text-sm print:leading-loose">
              <p className="text-center font-bold uppercase tracking-wide text-slate-900">
                Kementerian Pendidikan Tinggi, Sains, dan Teknologi
                <br />
                Fakultas Ilmu Komputer – Universitas Brawijaya
              </p>
              <hr className="my-3 border-slate-300 print:my-4 print:border-slate-800" />
              <p>
                <strong>Nomor:</strong> {letterNumber}
                <br />
                <strong>Hal:</strong> Izin Penggunaan Sarana dan Prasarana
              </p>
              <p className="mt-3 print:mt-5">
                Dengan ini Koordinator Sarana &amp; Prasarana FILKOM UB
                memberikan izin kepada <strong>{letterOrg}</strong> untuk
                menggunakan fasilitas <strong>{letterFacility}</strong> dalam
                rangka kegiatan <strong>{letterActivity}</strong> pada{" "}
                <strong>{letterSchedule}</strong>.
              </p>
              <p className="mt-4 text-right font-semibold print:mt-12">
                Koordinator Sarpras &amp; Lab,
                <br />
                <span className="mt-6 inline-block print:mt-14">
                  {displayName}
                </span>
              </p>
            </div>

            <div className="mt-5 flex justify-end gap-2 print:hidden">
              <button
                type="button"
                onClick={() => setDraftModalOpen(false)}
                className="rounded-xl border border-line px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handlePrintLetter}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-dark cursor-pointer"
              >
                <Printer className="size-3.5" /> Cetak / Simpan PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
