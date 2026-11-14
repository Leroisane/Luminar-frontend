import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  ListChecks,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type {
  AvatarTone,
  BookingRequest,
  Decision,
  RequestCategory,
} from "../../types/admin";
import { cn } from "../../utils/helpers";

const PAGE_SIZE = 4;

const categories: ("Semua Kategori" | RequestCategory)[] = [
  "Semua Kategori",
  "Auditorium",
  "Laboratorium",
  "Ruang Kelas",
  "Peralatan Multimedia",
];

const avatarTone: Record<AvatarTone, string> = {
  blue: "bg-blue-100 text-blue-700",
  green: "bg-emerald-100 text-emerald-700",
  violet: "bg-violet-100 text-violet-700",
  amber: "bg-amber-100 text-amber-700",
};

interface Props {
  /** hanya permohonan yang masih menunggu */
  requests: BookingRequest[];
  globalSearch: string;
  onDecide: (ids: string[], decision: Decision) => void;
  onUndo: (ids: string[]) => void;
}

interface LastAction {
  ids: string[];
  decision: Decision;
  label: string;
}

export default function AdminTableSection({
  requests,
  globalSearch,
  onDecide,
  onUndo,
}: Props) {
  const [category, setCategory] =
    useState<(typeof categories)[number]>("Semua Kategori");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [last, setLast] = useState<LastAction | null>(null);

  const filtered = useMemo(() => {
    const terms = [query, globalSearch]
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    return requests.filter((r) => {
      if (category !== "Semua Kategori" && r.category !== category)
        return false;
      const haystack =
        `${r.name} ${r.identifier} ${r.org} ${r.room} ${r.roomMeta}`.toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }, [requests, category, query, globalSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );
  const from = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to = from === 0 ? 0 : from + pageRows.length - 1;

  const filterKey = `${category}|${query}|${globalSearch}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);

  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }
  
  const decide = (rows: BookingRequest[], decision: Decision) => {
    if (rows.length === 0) return;
    onDecide(
      rows.map((r) => r.id),
      decision,
    );
    setLast({
      ids: rows.map((r) => r.id),
      decision,
      label: rows.length === 1 ? rows[0].name : `${rows.length} permohonan`,
    });
    setBulkOpen(false);
  };

  return (
    <section className="rounded-2xl border border-line bg-white">
      {/* Header */}
      <div className="flex flex-col gap-4 p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
            Permohonan Peminjaman Terbaru
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
              {requests.length} Baru
            </span>
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Daftar reservasi masuk yang memerlukan verifikasi dan otorisasi
            persetujuan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Kategori:
            <span className="relative">
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as (typeof categories)[number])
                }
                className="appearance-none rounded-xl border border-line bg-white py-2 pl-3 pr-9 text-sm font-medium text-ink outline-none"
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            </span>
          </label>

          <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-line bg-slate-50 px-3 py-2 xl:flex-none">
            <SlidersHorizontal className="size-4 shrink-0 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari dalam tabel..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            <Search className="size-4 shrink-0 text-slate-400" />
          </label>

          <div className="relative">
            <button
              onClick={() => setBulkOpen((v) => !v)}
              disabled={pageRows.length === 0}
              aria-expanded={bulkOpen}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ListChecks className="size-4" /> Aksi Masal
            </button>
            {bulkOpen && (
              <>
                <button
                  aria-label="Tutup menu"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setBulkOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-60 rounded-xl border border-line bg-white p-1.5 shadow-lg">
                  <button
                    onClick={() => decide(pageRows, "approved")}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-brand hover:bg-emerald-50"
                  >
                    Setujui {pageRows.length} di halaman ini
                  </button>
                  <button
                    onClick={() => decide(pageRows, "rejected")}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Tolak {pageRows.length} di halaman ini
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Undo notice */}
      {last && (
        <div
          role="status"
          className="mx-5 mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm text-white sm:mx-6"
        >
          <span>
            <strong>{last.label}</strong>{" "}
            {last.decision === "approved" ? "disetujui" : "ditolak"}.
          </span>
          <button
            onClick={() => {
              onUndo(last.ids);
              setLast(null);
            }}
            className="font-semibold text-emerald-300 hover:underline"
          >
            Batalkan
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border-t border-line">
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="text-xs font-bold uppercase tracking-wide text-slate-600">
              <th className="px-6 py-4 font-bold">Nama Pengaju</th>
              <th className="px-3 py-4 font-bold">Ruang / Barang</th>
              <th className="px-3 py-4 font-bold">Tanggal Pinjam</th>
              <th className="px-3 py-4 font-bold">Dokumen</th>
              <th className="px-6 py-4 text-right font-bold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line border-t border-line">
            {pageRows.map((r) => (
              <tr key={r.id} className="align-middle">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                        avatarTone[r.tone],
                      )}
                    >
                      {r.initials}
                    </span>
                    <div className="leading-tight">
                      <p className="text-[15px] font-bold">{r.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {r.identifier} • {r.org}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4">
                  <p className="text-[15px] font-bold leading-tight text-brand">
                    {r.room}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{r.roomMeta}</p>
                </td>
                <td className="px-3 py-4">
                  <p className="text-[15px] font-bold leading-tight">
                    {r.date}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{r.time}</p>
                </td>
                <td className="px-3 py-4">
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 rounded-lg border border-line bg-slate-50 px-2.5 py-1.5 text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-2 hover:bg-slate-100"
                  >
                    <FileText
                      className={cn(
                        "size-4",
                        r.doc?.kind === "pdf"
                          ? "text-red-500"
                          : "text-blue-500",
                      )}
                    />
                    {r.doc?.name ?? "-"}
                    {r.doc.name}
                  </a>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => decide([r], "approved")}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
                    >
                      <Check className="size-4" /> Approve
                    </button>
                    <button
                      onClick={() => decide([r], "rejected")}
                      className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {pageRows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-14 text-center text-sm text-slate-500"
                >
                  {requests.length === 0
                    ? "Semua permohonan sudah diproses."
                    : "Tidak ada permohonan yang cocok dengan filter atau pencarian."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 border-t border-line px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-slate-600">
          Menampilkan{" "}
          <strong className="font-semibold text-ink">
            {from} - {to}
          </strong>{" "}
          dari{" "}
          <strong className="font-semibold text-ink">{filtered.length}</strong>{" "}
          permohonan aktif
        </p>
        <div className="flex items-center gap-1.5">
          <button
            aria-label="Halaman sebelumnya"
            disabled={safePage === 1}
            onClick={() => setPage(safePage - 1)}
            className="flex size-9 items-center justify-center rounded-lg border border-line disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              aria-current={n === safePage ? "page" : undefined}
              className={cn(
                "flex size-9 items-center justify-center rounded-lg border text-sm font-semibold",
                n === safePage
                  ? "border-brand bg-brand text-white"
                  : "border-line hover:bg-slate-50",
              )}
            >
              {n}
            </button>
          ))}
          <button
            aria-label="Halaman berikutnya"
            disabled={safePage === totalPages}
            onClick={() => setPage(safePage + 1)}
            className="flex size-9 items-center justify-center rounded-lg border border-line disabled:opacity-40"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
