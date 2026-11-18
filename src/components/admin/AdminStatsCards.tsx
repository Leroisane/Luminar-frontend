import { useAdminBookingStats } from "../../hooks/useAdminQueries";

interface Props {
  pending?: number;
  approvedToday?: number;
}

export default function AdminStatsCards({ pending, approvedToday }: Props) {
  const { data: stats } = useAdminBookingStats();

  const cards = [
    {
      label: "Total Pengajuan",
      value: stats?.total ?? 0,
      accent: "border-t-indigo-500 text-indigo-600",
    },
    {
      label: "Perlu Diulas",
      value: stats?.pending ?? pending ?? 0,
      accent: "border-t-sky-500 text-sky-600",
    },
    {
      label: "Sedang Direview",
      value: stats?.review ?? 0,
      accent: "border-t-amber-500 text-amber-600",
    },
    {
      label: "Menunggu TTD",
      value: stats?.waitingSignature ?? 0,
      accent: "border-t-orange-500 text-orange-600",
    },
    {
      label: "Perlu Revisi",
      value: stats?.needsRevision ?? 0,
      accent: "border-t-slate-700 text-slate-800",
    },
    {
      label: "Disetujui",
      value: stats?.approved ?? approvedToday ?? 0,
      accent: "border-t-emerald-600 text-brand",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`rounded-2xl border border-line border-t-4 ${c.accent} bg-white p-4 text-center shadow-xs`}
        >
          <p className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {c.value}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
