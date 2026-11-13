import type { ReactNode } from "react";
import { cn } from "../../utils/helpers";

type Tone = "green" | "amber" | "slate";

const tones: Record<Tone, string> = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  slate: "bg-slate-100 text-slate-600 border-slate-200",
};

const dots: Record<Tone, string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  slate: "bg-slate-400",
};

interface Props {
  tone: Tone;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

export default function StatusBadge({
  tone,
  children,
  dot = true,
  className,
}: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", dots[tone])} />}
      {children}
    </span>
  );
}
