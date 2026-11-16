import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  ListChecks,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type {
  AvatarTone,
  BookingRequest,
  Decision,
  RequestCategory,
} from "../../types/admin";
import type { StatusFilter } from "../../pages/AdminApprovalPage";
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
  requests: BookingRequest[];
  globalSearch: string;
  statusFilter?: StatusFilter;
  decisions?: Record<string, Decision>;
  onDecide: (ids: string[], decision: Decision) => void;
  onUndo: (ids: string[]) => void;
}

interface LastAction {
  ids: string[];
  decision: Decision;
  label: string;
}

function getDocUrl(req: BookingRequest): string {
  const doc = req.doc;
  if (doc && "url" in doc && typeof doc.url === "string" && doc.url.trim()) {
    return doc.url;
  }

  const safe = (str: string) =>
    str.replace(/[^\x20-\x7E]/g, "-").replace(/[()\\]/g, "\\$&");

  const lines = [
    "LEMBAR PENGAJUAN PEMINJAMAN SARPRAS FILKOM UB",
    "------------------------------------------------------------",
    `ID Tiket     : ${safe(req.id)}`,
    `Nama Pengaju : ${safe(req.name || "Mahasiswa")} (${safe(req.identifier || "-")})`,
    `Organisasi   : ${safe(req.org || "-")}`,
    `Fasilitas    : ${safe(req.room || "-")} (${safe(req.roomMeta || "-")})`,
    `Jadwal       : ${safe(req.date)} | ${safe(req.time)}`,
    `Dokumen      : ${safe(req.doc?.name ?? "Proposal_Kegiatan.pdf")}`,
    "------------------------------------------------------------",
    "Status       : Verifikasi Koordinator Sarpras FILKOM UB",
  ];

  const textOps = lines
    .map((line, idx) => `1 0 0 1 50 ${740 - idx * 22} Tm (${line}) Tj`)
    .join("\n");
  const stream = `BT\n/F1 11 Tf\n${textOps}\nET`;

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
    `4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  const blob = new Blob([pdf], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}

export default function AdminTableSection({
  requests,
  globalSearch,
  statusFilter = "pending",
  decisions = {},
  onDecide,
  onUndo,
}: Props) {
  const [category, setCategory] =
    useState<(typeof categories)[number]>("Semua Kategori");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [last, setLast] = useState<LastAction | null>(null);
  const [previewRequest, setPreviewRequest] = useState<BookingRequest | null>(
    null,
  );

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

  const filterKey = `${category}|${query}|${globalSearch}|${statusFilter}`;
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
    setPreviewRequest(null);
  };

  const sectionTitle =
    statusFilter === "approved"
      ? "Permohonan Disetujui"
      : statusFilter === "rejected"
        ? "Permohonan Ditolak"
        : statusFilter === "all"
          ? "Seluruh Riwayat Permohonan"
          : "Permohonan Peminjaman Terbaru";

  const badgeText =
    statusFilter === "pending"
      ? `${requests.length} Baru`
      : `${requests.length} Data`;

  return (
    <section
      id="approval"
      className="scroll-mt-24 rounded-2xl border border-line bg-white"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="flex flex-wrap items-center gap-3 text-xl font-bold tracking-tight sm:text-2xl">
            <span>{sectionTitle}</span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
              {badgeText}
            </span>
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Daftar reservasi masuk yang memerlukan verifikasi dan otorisasi
            persetujuan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="whitespace-nowrap">Kategori:</span>
            <span className="relative">
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as (typeof categories)[number])
                }
                className="appearance-none rounded-xl border border-line bg-white py-2 pl-3 pr-9 text-sm font-medium text-ink outline-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            </span>
          </label>

          <label className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl border border-line bg-slate-50 px-3 py-2 xl:flex-none">
            <SlidersHorizontal className="size-4 shrink-0 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari dalam tabel..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            <Search className="size-4 shrink-0 text-slate-400" />
          </label>

          {statusFilter === "pending" && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setBulkOpen((v) => !v)}
                disabled={pageRows.length === 0}
                aria-expanded={bulkOpen}
                className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                <ListChecks className="size-4 shrink-0" /> Aksi Masal
              </button>
              {bulkOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Tutup menu"
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={() => setBulkOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-60 rounded-xl border border-line bg-white p-1.5 shadow-lg">
                    <button
                      type="button"
                      onClick={() => decide(pageRows, "approved")}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-brand hover:bg-emerald-50 cursor-pointer"
                    >
                      Setujui {pageRows.length} di halaman ini
                    </button>
                    <button
                      type="button"
                      onClick={() => decide(pageRows, "rejected")}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      Tolak {pageRows.length} di halaman ini
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
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
            type="button"
            onClick={() => {
              onUndo(last.ids);
              setLast(null);
            }}
            className="font-semibold text-emerald-300 hover:underline cursor-pointer"
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
            {pageRows.map((r) => {
              const rowDecision = decisions[r.id];
              return (
                <tr key={r.id} className="align-middle hover:bg-slate-50/60">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex size-11 aspect-square shrink-0 items-center justify-center rounded-full text-sm font-bold",
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
                    <p className="mt-0.5 text-xs text-slate-500">
                      {r.roomMeta}
                    </p>
                  </td>
                  <td className="px-3 py-4">
                    <p className="text-[15px] font-bold leading-tight">
                      {r.date}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{r.time}</p>
                  </td>
                  <td className="px-3 py-4">
                    <button
                      type="button"
                      onClick={() => setPreviewRequest(r)}
                      title="Klik untuk pratinjau dokumen pengajuan"
                      className="inline-flex items-center gap-2 rounded-lg border border-line bg-slate-50 px-2.5 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-brand/40 hover:bg-emerald-50/70 hover:text-brand cursor-pointer"
                    >
                      <FileText
                        className={cn(
                          "size-4 shrink-0",
                          r.doc?.kind === "pdf"
                            ? "text-red-500"
                            : "text-blue-500",
                        )}
                      />
                      <span className="max-w-[180px] truncate">
                        {r.doc?.name ?? "Dokumen_Pengajuan.pdf"}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    {rowDecision ? (
                      <div className="flex items-center justify-end gap-2">
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap",
                            rowDecision === "approved"
                              ? "bg-emerald-50 text-brand"
                              : "bg-red-50 text-red-600",
                          )}
                        >
                          {rowDecision === "approved" ? "Disetujui" : "Ditolak"}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUndo([r.id])}
                          className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                        >
                          <RotateCcw className="size-3.5" /> Ubah
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => decide([r], "approved")}
                          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark cursor-pointer"
                        >
                          <Check className="size-4 shrink-0" /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => decide([r], "rejected")}
                          className="shrink-0 whitespace-nowrap rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {pageRows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-14 text-center text-sm text-slate-500"
                >
                  {requests.length === 0
                    ? statusFilter === "pending"
                      ? "Semua permohonan sudah diproses."
                      : "Belum ada permohonan pada kategori status ini."
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
            {from}–{to}
          </strong>{" "}
          dari{" "}
          <strong className="font-semibold text-ink">{filtered.length}</strong>{" "}
          permohonan
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Halaman sebelumnya"
            disabled={safePage === 1}
            onClick={() => setPage(safePage - 1)}
            className="flex size-9 items-center justify-center rounded-lg border border-line disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="size-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPage(n)}
              aria-current={n === safePage ? "page" : undefined}
              className={cn(
                "flex size-9 items-center justify-center rounded-lg border text-sm font-semibold cursor-pointer",
                n === safePage
                  ? "border-brand bg-brand text-white"
                  : "border-line hover:bg-slate-50",
              )}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            aria-label="Halaman berikutnya"
            disabled={safePage === totalPages}
            onClick={() => setPage(safePage + 1)}
            className="flex size-9 items-center justify-center rounded-lg border border-line disabled:opacity-40 cursor-pointer"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Modal Pratinjau Dokumen Proposal */}
      {previewRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div>
                <span className="inline-block rounded-md bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-brand">
                  Pratinjau Dokumen Pendukung
                </span>
                <h3 className="mt-1 text-base font-bold text-slate-900">
                  {previewRequest.doc?.name ?? "Dokumen_Pengajuan.pdf"}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Pengaju:{" "}
                  <strong className="text-slate-700">
                    {previewRequest.name}
                  </strong>{" "}
                  ({previewRequest.org}) •{" "}
                  <strong className="text-brand">{previewRequest.room}</strong>{" "}
                  ({previewRequest.date}, {previewRequest.time})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewRequest(null)}
                aria-label="Tutup pratinjau"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 bg-slate-100 p-4">
              <iframe
                src={getDocUrl(previewRequest)}
                title={previewRequest.doc?.name ?? "Pratinjau Dokumen"}
                className="h-[52vh] w-full rounded-xl border border-line bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-3.5">
              <a
                href={getDocUrl(previewRequest)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
              >
                <ExternalLink className="size-3.5" /> Buka Berkas di Tab Baru
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => decide([previewRequest], "rejected")}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 cursor-pointer"
                >
                  Tolak Pengajuan
                </button>
                <button
                  type="button"
                  onClick={() => decide([previewRequest], "approved")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-dark cursor-pointer"
                >
                  <Check className="size-3.5" /> Setujui Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
