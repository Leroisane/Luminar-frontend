import { useEffect, useRef, useState } from "react";
import logoLuminar from "../../assets/logo-luminar.png";
import iconLuminar from "../../assets/icon-luminar.png";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";

export default function AdminNavbar({ pendingCount }: { pendingCount: number }) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(5);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notifOpen && !profileOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (notifOpen && notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
      if (profileOpen && profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen, profileOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const displayName = user?.name || "Admin Sarpras";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-white/95 backdrop-blur print:hidden">
      <div className="mx-auto flex h-[72px] w-full max-w-[1540px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex shrink-0 items-center">
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
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2.5">
          {/* Notifikasi */}
          <div className="relative shrink-0" ref={notifRef}>
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
                        Sinkronisasi Kalender Ruangan Aktif
                      </p>
                      <p className="mt-0.5 text-slate-500">
                        Cek Kalender Sentral untuk memantau jadwal terisi.
                      </p>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>

          <span className="hidden h-7 w-px shrink-0 bg-line sm:block" />

          {/* Profile Menu & Logout */}
          <div className="relative shrink-0" ref={profileRef}>
            <button
              type="button"
              onClick={() => {
                setProfileOpen((v) => !v);
                setNotifOpen(false);
              }}
              className="flex shrink-0 items-center gap-2.5 rounded-full border border-line py-1 pl-1 pr-3 hover:bg-slate-50 cursor-pointer"
            >
              <span className="flex size-9 aspect-square shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                {initials || "AD"}
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
        </div>
      </div>
    </header>
  );
}
