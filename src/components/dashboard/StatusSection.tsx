import { useState } from "react";
import { Check, FileText, Headset, QrCode, ShieldCheck } from "lucide-react";
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

export default function StatusSection({
  latestBooking,
  onClearLatestBooking,
}: StatusSectionProps) {
  const { data: apiBooking, isLoading } = useMyBooking();
  const [isCancelled, setIsCancelled] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

  const activeBooking = latestBooking ?? apiBooking;

  const showToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 4000);
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
              <ShieldCheck className="size-4" /> Verifikasi Satu Pintu
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
          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-6">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark cursor-pointer"
            >
              <FileText className="size-4" /> Unduh Bukti Pengajuan (PDF)
            </button>
            <button
              type="button"
              onClick={() =>
                showToast(
                  "Kontak PIC Sarpras FILKOM UB: Gedung G Lt. 1 (sarpras.filkom@ub.ac.id)",
                )
              }
              className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 cursor-pointer"
            >
              <Headset className="size-4" /> Hubungi PIC Ruangan
            </button>
            <button
              type="button"
              onClick={handleCancelBooking}
              className="ml-auto text-sm font-semibold text-red-600 hover:underline cursor-pointer"
            >
              Batal Reservasi
            </button>
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
      {/* Marker + connector */}
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

      {/* Copy */}
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
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-white">
        <Check className="size-4" strokeWidth={3} />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-brand bg-white">
        <span className="size-3 rounded-full bg-brand" />
      </span>
    );
  }
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
      <QrCode className="size-4" />
    </span>
  );
}
