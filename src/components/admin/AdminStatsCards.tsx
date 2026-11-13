import type { ReactNode } from "react";
import {
  ArrowUp,
  BadgeCheck,
  CircleCheck,
  ClipboardList,
  SquareCheckBig,
  type LucideIcon,
} from "lucide-react";

interface Props {
  pending: number;
  approvedToday: number;
}

interface Card {
  label: string;
  value: number;
  unit: string;
  icon: LucideIcon;
  iconBox: string;
  bar: string;
  footer: ReactNode;
}

export default function AdminStatsCards({ pending, approvedToday }: Props) {
  const cards: Card[] = [
    {
      label: "Menunggu Persetujuan",
      value: pending,
      unit: "Berkas",
      icon: ClipboardList,
      iconBox: "bg-amber-100 text-amber-700",
      bar: "bg-amber-400",
      footer: (
        <span className="inline-flex items-center gap-2 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
          <span className="size-1.5 rounded-full bg-amber-500" />3 berkas butuh
          respons cepat &lt; 2 jam
        </span>
      ),
    },
    {
      label: "Disetujui Hari Ini",
      value: approvedToday,
      unit: "Pengajuan",
      icon: CircleCheck,
      iconBox: "bg-emerald-100 text-emerald-700",
      bar: "bg-brand",
      footer: (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
          <ArrowUp className="size-3.5" /> +4 berkas dibanding kemarin
        </span>
      ),
    },
    {
      label: "Item Dikelola",
      value: 112,
      unit: "Unit",
      icon: SquareCheckBig,
      iconBox: "bg-slate-100 text-slate-700",
      bar: "bg-slate-400",
      footer: (
        <span className="flex items-center gap-2 text-xs font-medium text-slate-600">
          38 Ruangan <span className="size-1 rounded-full bg-slate-300" /> 74
          Perangkat Lab
        </span>
      ),
    },
    {
      label: "Jadwal Bentrok",
      value: 0,
      unit: "Konflik",
      icon: BadgeCheck,
      iconBox: "bg-emerald-100 text-emerald-700",
      bar: "bg-brand",
      footer: (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
          <CircleCheck className="size-3.5" /> Validasi otomatis aktif
        </span>
      ),
    },
  ];

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, unit, icon: Icon, iconBox, bar, footer }) => (
        <div
          key={label}
          className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-line bg-white px-6 pb-6 pt-5"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-[13px] font-bold uppercase tracking-wide text-slate-600">
              {label}
            </p>
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconBox}`}
            >
              <Icon className="size-5" />
            </span>
          </div>
          <p className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight">
              {value}
            </span>
            <span className="text-sm font-medium text-slate-500">{unit}</span>
          </p>
          <div>{footer}</div>
          <span className={`absolute inset-x-0 bottom-0 h-1 ${bar}`} />
        </div>
      ))}
    </div>
  );
}
