import type { BookingStatus } from "../../types/api";

interface StatusBadgeProps {
  status: BookingStatus | string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // Backend Go status constants
  diajukan: { label: "Menunggu", className: "bg-blue-100 text-blue-700" },
  direview: { label: "Direview", className: "bg-amber-100 text-amber-700" },
  perlu_revisi: { label: "Perlu Revisi", className: "bg-orange-100 text-orange-700" },
  menunggu_ttd: { label: "Menunggu TTD", className: "bg-purple-100 text-purple-700" },
  disetujui: { label: "Disetujui", className: "bg-emerald-100 text-emerald-700" },
  ditolak: { label: "Ditolak", className: "bg-red-100 text-red-700" },
  dibatalkan: { label: "Dibatalkan", className: "bg-gray-100 text-gray-500" },
  serah_terima: { label: "Serah Terima", className: "bg-indigo-100 text-indigo-700" },
  dikembalikan: { label: "Dikembalikan", className: "bg-teal-100 text-teal-700" },
  // Legacy aliases
  pending: { label: "Menunggu", className: "bg-blue-100 text-blue-700" },
  review: { label: "Direview", className: "bg-amber-100 text-amber-700" },
  approved: { label: "Disetujui", className: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Ditolak", className: "bg-red-100 text-red-700" },
  cancelled: { label: "Dibatalkan", className: "bg-gray-100 text-gray-500" },
  hand_over: { label: "Serah Terima", className: "bg-indigo-100 text-indigo-700" },
  return: { label: "Dikembalikan", className: "bg-teal-100 text-teal-700" },
};

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const cfg = statusConfig[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className} ${className}`}
    >
      {cfg.label}
    </span>
  );
}
