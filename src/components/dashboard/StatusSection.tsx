import { useState } from "react";
import {
  Building2,
  Check,
  Clock,
  Copy,
  FileText,
  Headset,
  Mail,
  MessageCircle,
  QrCode,
  ShieldCheck,
  X,
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import { useMyBooking } from "../../hooks/useDashboardQueries";
import type { BookingStep, StepState } from "../../types";
import type { SubmittedBooking } from "./BookingModal";
import { cn } from "../../utils/helpers";

const noteColor: Record<StepState, string> = {
  done: "text-emerald-700",
  current: "text-amber-600",
  pending: "text-slate-500",
};

interface StatusSectionProps {
  latestBooking: SubmittedBooking | null;
  onClearLatestBooking: () => void;
}

function wrapPdfText(text: string, maxChars = 68): string[] {
  const clean = text.replace(/[^\x20-\x7E]/g, "-");
  const words = clean.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if ((current + " " + word).trim().length <= maxChars) {
      current = (current + " " + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : ["-"];
}

function downloadBookingProofPdf(booking: {
  ticketId: string;
  status: string;
  submittedAt: string;
  activity: string;
  resources: string;
  schedule: string;
  steps: BookingStep[];
}) {
  const esc = (s: string) =>
    s.replace(/[^\x20-\x7E]/g, "-").replace(/[()\\]/g, "\\$&");

  const rawLines: string[] = [
    "FAKULTAS ILMU KOMPUTER - UNIVERSITAS BRAWIJAYA",
    "BUKTI PENGAJUAN RESERVASI SARANA & PRASARANA (LUMINAR)",
    "====================================================================",
    `Nomor Tiket      : ${booking.ticketId}`,
    `Status Terkini   : ${booking.status}`,
    `Waktu Pengajuan  : ${booking.submittedAt}`,
    "--------------------------------------------------------------------",
    "DETAIL KEGIATAN & FASILITAS:",
    ...wrapPdfText(`Kegiatan         : ${booking.activity}`, 70),
    ...wrapPdfText(`Fasilitas        : ${booking.resources}`, 70),
    ...wrapPdfText(`Jadwal Pakai     : ${booking.schedule}`, 70),
    "--------------------------------------------------------------------",
    "RIWAYAT TAHAPAN VERIFIKASI:",
    ...booking.steps.map(
      (s) =>
        `${s.id}. ${s.title} [${s.state.toUpperCase()}]${s.note ? ` - ${s.note}` : ""}`,
    ),
    "====================================================================",
    "Dokumen ini diterbitkan secara elektronik oleh Sistem Reservasi FILKOM UB.",
    "Tunjukkan bukti ini kepada petugas Sarpras / Laboran saat hari penggunaan.",
  ];

  const ops = rawLines
    .map((line, i) => `1 0 0 1 48 ${742 - i * 19} Tm (${esc(line)}) Tj`)
    .join("\n");

  const stream = `BT\n/F1 10 Tf\n${ops}\nET`;

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
    `4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }
  const xrefPos = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Bukti_Pengajuan_${booking.ticketId}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function StatusSection({
  latestBooking,
  onClearLatestBooking,
}: StatusSectionProps) {
  const { data: apiBooking, isLoading } = useMyBooking();
  const [isCancelled, setIsCancelled] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [isPicModalOpen, setIsPicModalOpen] = useState(false);
  const [copiedContact, setCopiedContact] = useState(false);

  const activeBooking = latestBooking ?? apiBooking;

  const showToast = (msg: string) => {
    setActionToast(msg);
    window.setTimeout(() => setActionToast(null), 4000);
  };

  const handleDownloadPdf = () => {
    if (!activeBooking) return;
    downloadBookingProofPdf(activeBooking);
    showToast(
      `Bukti_Pengajuan_${activeBooking.ticketId}.pdf berhasil diunduh.`,
    );
  };

  const handleCopyEmail = () => {
    void navigator.clipboard?.writeText("sarpras.filkom@ub.ac.id");
    setCopiedContact(true);
    window.setTimeout(() => setCopiedContact(false), 2500);
  };

  const handleCancelBooking = () => {
    if (!window.confirm("Yakin ingin membatalkan pengajuan reservasi ini?")) {
      return;
    }
    localStorage.removeItem("luminar_latest_booking");
    onClearLatestBooking();
    setIsCancelled(true);
    showToast("Pengajuan reservasi berhasil dibatalkan.");
  };

  const picEmailSubject = activeBooking
    ? encodeURIComponent(
        `Konfirmasi Peminjaman [${activeBooking.ticketId}] - ${activeBooking.resources}`,
      )
    : encodeURIComponent("Pertanyaan Peminjaman Sarpras FILKOM UB");

  const picWaText = activeBooking
    ? encodeURIComponent(
        `Halo PIC Sarpras FILKOM UB, saya ingin mengonfirmasi pengajuan peminjaman dengan nomor tiket ${activeBooking.ticketId} (${activeBooking.resources} - ${activeBooking.schedule}). Terima kasih.`,
      )
    : encodeURIComponent(
        "Halo PIC Sarpras FILKOM UB, saya ingin menanyakan ketersediaan ruangan.",
      );

  return (
    <section
      id="riwayat"
      className="mx-auto w-full max-w-[1400px] px-4 pb-20 pt-16 sm:px-6 lg:px-10"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Status Peminjaman Anda
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Pantau proses verifikasi permohonan peminjaman ruangan dan
            perlengkapan secara transparan
          </p>
        </div>

        {actionToast && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-brand">
            {actionToast}
          </div>
        )}
      </div>

      {isLoading && !activeBooking ? (
        <div className="mt-6 h-[420px] animate-pulse rounded-3xl bg-slate-100" />
      ) : !activeBooking || isCancelled ? (
        <div className="mt-6 rounded-3xl border border-dashed border-line bg-white p-12 text-center">
          <p className="text-sm font-semibold text-slate-700">
            Belum ada pengajuan peminjaman aktif.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Pilih fasilitas pada Katalog di atas dan klik &ldquo;Ajukan
            Peminjaman&rdquo; untuk membuat reservasi baru.
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-line bg-white p-5 sm:p-7">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-700">
                {activeBooking.ticketId}
              </span>
              <StatusBadge tone="amber" dot={false} className="px-3 py-1">
                {activeBooking.status}
              </StatusBadge>
              <span className="text-sm text-slate-600">
                Diajukan: {activeBooking.submittedAt}
              </span>
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
              <ShieldCheck className="size-4 shrink-0" /> Verifikasi Satu Pintu
              Kemahasiswaan FILKOM
            </span>
          </div>

          {/* Info panel */}
          <dl className="mt-5 grid gap-4 rounded-xl bg-slate-50 px-5 py-4 md:grid-cols-3">
            <Info label="Kegiatan Organisasi" value={activeBooking.activity} />
            <Info label="Ruang & Inventaris" value={activeBooking.resources} />
            <Info
              label="Jadwal Penggunaan"
              value={activeBooking.schedule}
              accent
            />
          </dl>

          {/* Stepper */}
          <ol className="mt-8 grid gap-0 md:grid-cols-4">
            {activeBooking.steps.map((step, i) => (
              <Step
                key={step.id}
                step={step}
                last={i === activeBooking.steps.length - 1}
                nextState={activeBooking.steps[i + 1]?.state}
              />
            ))}
          </ol>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark cursor-pointer"
            >
              <FileText className="size-4 shrink-0" /> Unduh Bukti Pengajuan
              (PDF)
            </button>
            <button
              type="button"
              onClick={() => setIsPicModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
            >
              <Headset className="size-4 shrink-0" /> Hubungi PIC Ruangan
            </button>
            <button
              type="button"
              onClick={handleCancelBooking}
              className="py-1 text-center text-sm font-semibold text-red-600 hover:underline sm:ml-auto sm:text-right cursor-pointer"
            >
              Batal Reservasi
            </button>
          </div>
        </div>
      )}

      {/* Modal Kontak PIC Ruangan & Layanan Sarpras */}
      {isPicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-line pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="flex size-10 aspect-square shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-brand">
                  <Headset className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Layanan PIC Sarpras &amp; Lab
                  </h3>
                  <p className="text-xs text-slate-500">
                    Koordinasi teknis ruangan, kunci akses, dan perlengkapan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPicModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4 text-xs">
              <div className="flex items-start gap-2.5">
                <Building2 className="mt-0.5 size-4 shrink-0 text-brand" />
                <div>
                  <p className="font-bold text-slate-800">
                    Loket Sarpras &amp; Laboratorium FILKOM UB
                  </p>
                  <p className="text-slate-600">
                    Gedung G Lantai 1, Fakultas Ilmu Komputer UB
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="mt-0.5 size-4 shrink-0 text-brand" />
                <div>
                  <p className="font-bold text-slate-800">Jam Operasional</p>
                  <p className="text-slate-600">
                    Senin – Jumat, pukul 08.00 – 16.00 WIB
                  </p>
                </div>
              </div>
              {activeBooking && (
                <div className="border-t border-slate-200 pt-2.5">
                  <span className="text-slate-500">Referensi Tiket Anda: </span>
                  <span className="font-mono font-bold text-brand">
                    {activeBooking.ticketId}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2">
              <a
                href={`https://wa.me/6281234567890?text=${picWaText}`}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-dark"
              >
                <MessageCircle className="size-4" /> Hubungi via WhatsApp PIC
              </a>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`mailto:sarpras.filkom@ub.ac.id?subject=${picEmailSubject}`}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Mail className="size-3.5" /> Kirim Email
                </a>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
                >
                  <Copy className="size-3.5" />
                  {copiedContact ? "Email Tersalin!" : "Salin Email"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Info({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className={cn("mt-0.5 text-sm font-bold", accent && "text-brand")}>
        {value}
      </dd>
    </div>
  );
}

function Step({
  step,
  last,
  nextState,
}: {
  step: BookingStep;
  last: boolean;
  nextState?: StepState;
}) {
  const lineDone =
    step.state === "done" && nextState !== undefined && nextState !== "pending";

  return (
    <li className="flex gap-4 md:block">
      <div className="flex flex-col items-center md:flex-row">
        <StepMarker state={step.state} />
        {!last && (
          <span
            aria-hidden
            className={cn(
              "my-1 min-h-8 w-0.5 flex-1 md:mx-3 md:my-0 md:h-0.5 md:min-h-0 md:w-auto",
              lineDone ? "bg-brand" : "bg-slate-200",
            )}
          />
        )}
      </div>

      <div className="pb-6 md:mt-3 md:pb-0 md:pr-4">
        <p className="text-sm font-bold">
          {step.id}. {step.title}
        </p>
        {step.timestamp && (
          <p className="mt-0.5 text-xs text-slate-500">{step.timestamp}</p>
        )}
        {step.note && (
          <p
            className={cn(
              "mt-0.5 text-xs font-semibold",
              noteColor[step.state],
            )}
          >
            {step.note}
          </p>
        )}
        {step.description && (
          <p className="mt-0.5 text-xs text-slate-500">{step.description}</p>
        )}
      </div>
    </li>
  );
}

function StepMarker({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <span className="flex size-9 aspect-square shrink-0 items-center justify-center rounded-full bg-brand text-white">
        <Check className="size-4" strokeWidth={3} />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className="flex size-9 aspect-square shrink-0 items-center justify-center rounded-full border-2 border-brand bg-white">
        <span className="size-3 rounded-full bg-brand" />
      </span>
    );
  }
  return (
    <span className="flex size-9 aspect-square shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
      <QrCode className="size-4" />
    </span>
  );
}
