import { useState } from "react";
import { Bell, ChevronDown, Landmark, Menu, Search, X } from "lucide-react";
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
];

export default function AdminNavbar({ pendingCount, search, onSearch }: Props) {
  const [open, setOpen] = useState(false);
  const active = "approval";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] w-full max-w-[1500px] items-center gap-4 px-4 sm:px-6 lg:px-10">
        {/* Brand */}
        <a href="/admin" className="flex shrink-0 items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
            <Landmark className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-bold tracking-tight">
              FILKOM Reserve
            </span>
            <span className="hidden text-xs font-medium text-slate-500 sm:block">
              Admin Portal Sarpras &amp; Lab
            </span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 xl:flex">
          {links.map((l) => (
            <a
              key={l.id}
              href="#"
              className={cn(
                "flex items-center gap-2 rounded-xl px-3.5 py-2 text-center text-sm font-semibold leading-tight transition-colors",
                l.id === active
                  ? "bg-brand text-white"
                  : "text-slate-700 hover:bg-slate-100",
              )}
            >
              {l.label}
              {l.id === active && (
                <span className="flex size-5 items-center justify-center rounded-full bg-white/25 text-[11px] font-bold">
                  {pendingCount}
                </span>
              )}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <label className="hidden w-[300px] items-center gap-2 rounded-xl border border-line bg-slate-50 px-3 py-2 lg:flex">
            <Search className="size-4 shrink-0 text-slate-400" />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Cari pengaju, ruangan, NIM..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </label>

          <button
            aria-label="Notifikasi"
            className="relative flex size-10 items-center justify-center rounded-xl hover:bg-slate-100"
          >
            <Bell className="size-5 text-slate-600" />
            <span className="absolute right-1.5 top-1 flex size-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
              5
            </span>
          </button>

          <span className="hidden h-8 w-px bg-line sm:block" />

          <button className="flex items-center gap-3 rounded-full border border-line py-1 pl-1 pr-3 hover:bg-slate-50">
            <span className="flex size-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
              PB
            </span>
            <span className="hidden text-left leading-tight md:block">
              <span className="block text-sm font-bold">Pak Bambang S.T.</span>
              <span className="block text-xs text-slate-500">
                Koordinator Sarpras &amp; Lab
              </span>
            </span>
            <ChevronDown className="hidden size-4 text-slate-400 md:block" />
          </button>

          <button
            aria-label="Buka menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex size-10 items-center justify-center rounded-lg border border-line xl:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

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
              <a
                key={l.id}
                href="#"
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold",
                  l.id === active
                    ? "bg-brand text-white"
                    : "text-slate-700 hover:bg-slate-100",
                )}
              >
                {l.label}
                {l.id === active && (
                  <span className="text-xs">{pendingCount}</span>
                )}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
