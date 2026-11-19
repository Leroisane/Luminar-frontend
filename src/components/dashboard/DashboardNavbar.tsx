import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logoutApi } from "../../api/authService";
import { useAuthStore } from "../../store/useAuthStore";
import { cn } from "../../utils/helpers";
import logoLuminar from "../../assets/logo-luminar.png";
import iconLuminar from "../../assets/icon-luminar.png";
import { Bell, CheckCheck, LogOut, Menu, User, X } from "lucide-react";

const links = [
  { id: "kalender", label: "Kalender", href: "#kalender" },
  { id: "katalog", label: "Katalog", href: "#katalog" },
  { id: "riwayat", label: "Riwayat Peminjaman", href: "#riwayat" },
];

export default function DashboardNavbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [active, setActive] = useState("kalender");
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notifOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      // Tetap hapus sesi lokal meski endpoint logout gagal
    } finally {
      logout();
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-[68px] w-full max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        {/* Brand */}
        <a href="/" className="flex shrink-0 items-center">
          <img
            src={iconLuminar}
            alt="Luminar"
            className="size-8 object-contain sm:hidden"
          />
          <img
            src={logoLuminar}
            alt="Luminar"
            className="hidden h-9 w-auto object-contain sm:block"
          />
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 rounded-xl bg-slate-100 p-1 md:flex">
          {links.map((l) => (
            <a
              key={l.id}
              href={l.href}
              onClick={() => setActive(l.id)}
              className={cn(
                "whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors",
                active === l.id
                  ? "bg-brand text-white"
                  : "text-slate-700 hover:bg-white",
              )}
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-3">
          {/* Notifikasi Mahasiswa */}
          {user && (
            <div className="relative shrink-0" ref={notifRef}>
              <button
                type="button"
                aria-label="Notifikasi"
                onClick={() => setNotifOpen((v) => !v)}
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
                        Notifikasi Peminjaman
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
                          Pengajuan Reservasi Ruangan Diterima
                        </p>
                        <p className="mt-0.5 text-slate-500">
                          Proposal Anda sedang ditinjau oleh Koordinator Sarpras &amp; Laboran.
                        </p>
                      </li>
                      <li className="rounded-lg bg-slate-50 p-2.5">
                        <p className="font-semibold text-slate-800">
                          Informasi Pengambilan Kunci &amp; Fasilitas
                        </p>
                        <p className="mt-0.5 text-slate-500">
                          Tunjukkan bukti reservasi di loket Sarpras Gedung G Lantai 1.
                        </p>
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}

          {user ? (
            <>
              <div className="hidden items-center gap-2.5 sm:flex">
                <span className="max-w-[160px] truncate text-sm font-semibold text-slate-700">
                  {user.name || user.email}
                </span>
                <div
                  aria-label="Profil"
                  className="flex size-10 aspect-square shrink-0 items-center justify-center rounded-full bg-brand text-white"
                >
                  <User className="size-5" />
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 sm:inline-flex cursor-pointer"
              >
                <LogOut className="size-4 shrink-0" />
                Keluar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="hidden shrink-0 whitespace-nowrap rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark sm:block cursor-pointer"
            >
              Masuk / Akun Civitas
            </button>
          )}

          {/* Mobile hamburger button */}
          <button
            type="button"
            aria-label="Buka menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-line md:hidden cursor-pointer"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {open && (
        <div className="border-t border-line bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.id}
                href={l.href}
                onClick={() => {
                  setActive(l.id);
                  setOpen(false);
                }}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold",
                  active === l.id ? "bg-brand text-white" : "text-slate-700",
                )}
              >
                {l.label}
              </a>
            ))}

            {user ? (
              <div className="mt-2 flex items-center justify-between border-t border-line pt-3">
                <span className="truncate text-xs font-semibold text-slate-700">
                  {user.name || user.email}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void handleLogout();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 cursor-pointer"
                >
                  <LogOut className="size-3.5" />
                  Keluar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/login");
                }}
                className="mt-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white sm:hidden cursor-pointer"
              >
                Masuk / Akun Civitas
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
