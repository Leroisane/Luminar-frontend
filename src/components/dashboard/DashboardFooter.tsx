const links = [
  "Panduan Peminjaman",
  "Kontak Helpdesk FILKOM",
  "Kebijakan Layanan",
];

export default function DashboardFooter() {
  return (
    <footer className="w-full border-t border-line bg-white">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
          <div className="max-w-md">
            <p className="flex flex-wrap items-center gap-2">
              <span className="text-xl font-bold text-brand">
                FILKOM Universitas Brawijaya
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                Unggul (A) BAN-PT
              </span>
            </p>
            <p className="mt-1.5 text-sm text-slate-600">
              Sistem Peminjaman Fasilitas Laboratorium, Studio Riset, dan
              Perlengkapan Akademik Fakultas Ilmu Komputer.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-600">
            {links.map((l) => (
              <a key={l} href="#" className="hover:text-brand">
                {l}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-1 border-t border-line py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium">
            © {new Date().getFullYear()} Fakultas Ilmu Komputer Universitas
            Brawijaya. Seluruh Hak Cipta Dilindungi.
          </p>
          <p>Jl. Veteran No. 8, Malang 65145, Jawa Timur</p>
        </div>
      </div>
    </footer>
  );
}
