import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { useFacilities } from "../../hooks/useDashboardQueries";
import type { Facility, FacilityCategory } from "../../types";
import { cn } from "../../utils/helpers";

type Filter = "Semua" | FacilityCategory;

const filters: Filter[] = [
  "Semua",
  "Ruang Kuliah",
  "Laboratorium",
  "Peralatan Multimedia",
  "Audio System",
];

interface Props {
  searchQuery: string;
  onSelectFacility: (facility: Facility) => void;
}

export default function CatalogSection({
  searchQuery,
  onSelectFacility,
}: Props) {
  const [filter, setFilter] = useState<Filter>("Semua");
  const { data = [], isLoading } = useFacilities();

  const items = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return data.filter(
      (f) =>
        (filter === "Semua" || f.category === filter) &&
        (!q || `${f.name} ${f.location} ${f.specs}`.toLowerCase().includes(q)),
    );
  }, [data, filter, searchQuery]);

  return (
    <section
      id="katalog"
      className="mx-auto w-full max-w-[1400px] px-4 pt-16 sm:px-6 lg:px-10"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Katalog Alat &amp; Ruangan
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Jelajahi spesifikasi lengkap dan ketersediaan fasilitas penunjang
            akademik
          </p>
        </div>

        <div
          role="tablist"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:pb-0"
        >
          {filters.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "shrink-0 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors",
                filter === f
                  ? "bg-brand text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[380px] animate-pulse rounded-2xl bg-slate-100"
            />
          ))}

        {!isLoading && items.length === 0 && (
          <p className="col-span-full rounded-2xl border border-dashed border-line py-12 text-center text-sm text-slate-500">
            Tidak ada fasilitas yang cocok. Ubah kata kunci atau pilih kategori
            lain.
          </p>
        )}

        {items.map((f) => (
          <FacilityCard
            key={f.id}
            facility={f}
            onSelect={() => onSelectFacility(f)}
          />
        ))}
      </div>
    </section>
  );
}

function FacilityCard({
  facility: f,
  onSelect,
}: {
  facility: Facility;
  onSelect: () => void;
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white">
      <div className="relative h-[170px] bg-gradient-to-br from-slate-200 to-slate-300">
        <img
          src={f.image}
          alt={f.name}
          loading="lazy"
          className="size-full object-cover"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
        <StatusBadge
          tone="green"
          className="absolute right-3 top-3 border-white/60 bg-white/90 backdrop-blur"
        >
          {f.units ? `Tersedia (${f.units} Unit)` : "Tersedia"}
        </StatusBadge>
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-md bg-black/55 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
          <MapPin className="size-3" /> {f.location}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <h3 className="min-h-[52px] text-lg font-bold leading-snug">
          {f.name}
        </h3>
        <p className="mt-1 min-h-[54px] text-[13px] leading-relaxed text-slate-600">
          {f.specs}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4">
          <div className="leading-tight">
            <p className="text-[11px] font-medium text-slate-500">
              {f.requirement.label}
            </p>
            <p className="text-[13px] font-bold">{f.requirement.value}</p>
          </div>
          <button
            type="button"
            onClick={onSelect}
            className="rounded-lg bg-brand px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-brand-dark cursor-pointer"
          >
            Ajukan Peminjaman
          </button>
        </div>
      </div>
    </article>
  );
}
