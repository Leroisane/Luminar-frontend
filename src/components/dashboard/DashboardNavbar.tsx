import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, LogOut, Menu, User, X } from "lucide-react";
import { logoutApi } from "../../api/authService";
import { useAuthStore } from "../../store/useAuthStore";
import { cn } from "../../utils/helpers";

const links = [
  { id: "katalog", label: "Katalog", href: "#katalog" },
  { id: "kalender", label: "Kalender", href: "#kalender" },
  { id: "riwayat", label: "Riwayat Peminjaman", href: "#riwayat" },
];

export default function DashboardNavbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [active, setActive] = useState("katalog");
  const [open, setOpen] = useState(false);

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
        <a href="/" className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-brand text-white">
            <GraduationCap className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-bold tracking-tight">
              FILKOM UB
            </span>
            <span className="hidden text-xs font-medium text-slate-600 sm:block">
              Academic Facilities &amp; Equipment
            </span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 rounded-xl bg-slate-100 p-1 md:flex">
          {links.map((l) => (
            <a
              key={l.id}
              href={l.href}
              onClick={() => setActive(l.id)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors",
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
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden items-center gap-2.5 sm:flex">
                <span className="max-w-[160px] truncate text-sm font-semibold text-slate-700">
                  {user.name || user.email}
                </span>
                <div
                  aria-label="Profil"
                  className="flex size-10 items-center justify-center rounded-full bg-brand text-white"
                >
                  <User className="size-5" />
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="hidden items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 sm:inline-flex cursor-pointer"
              >
                <LogOut className="size-4" />
                Keluar
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="hidden rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark sm:block cursor-pointer"
            >
              Masuk / Akun Civitas
            </button>
          )}

          {/* Mobile hamburger button */}
          <button
            aria-label="Buka menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex size-10 items-center justify-center rounded-lg border border-line md:hidden"
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
                  onClick={() => {
                    setOpen(false);
                    handleLogout();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                >
                  <LogOut className="size-3.5" />
                  Keluar
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/login");
                }}
                className="mt-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white sm:hidden"
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
