import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  Presentation,
  Search,
  Users,
  Video,
} from "lucide-react";
import { toISODate } from "../../utils/helpers";

export interface SearchPayload {
  query: string;
  date: Date;
}

interface Props {
  selectedDate: Date;
  onSearch: (payload: SearchPayload) => void;
}

const categories = [
  {
    icon: Presentation,
    title: "Ruang Kelas & Teater",
    info: "28 Ruangan Tersedia",
  },
  {
    icon: Users,
    title: "Ruang Rapat & Seminar",
    info: "12 Ruangan Tersedia",
  },
  {
    icon: Video,
    title: "Proyektor & Layar",
    info: "45 Unit Siap Pakai",
  },
  {
    icon: Camera,
    title: "Kamera & Audio Video",
    info: "18 Perangkat Tersedia",
  },
];

export default function HeroSection({ selectedDate, onSearch }: Props) {
  const [query, setQuery] = useState("");
  const [dateValue, setDateValue] = useState(toISODate(selectedDate));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const [y, m, d] = dateValue.split("-").map(Number);
    onSearch({ query: query.trim(), date: new Date(y, m - 1, d) });
    document.getElementById("katalog")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCategoryClick = () => {
    document.getElementById("katalog")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 pt-6 sm:px-6 lg:px-10">
      {/* Hero banner */}
      <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-[#16301f] via-[#1f4630] to-[#0f2217]">
        <img
          src="/images/hero-filkom.jpg"
          alt=""
          className="absolute inset-0 -z-20 size-full object-cover"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/45 via-black/55 to-black/70" />

        <div className="flex min-h-[420px] flex-col items-center justify-center px-5 py-14 text-center sm:min-h-[490px] sm:px-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-black/40 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur">
            <span className="size-2 shrink-0 rounded-full bg-accent" />
            Sistem Terpadu Fasilitas Akademik FILKOM UB
          </span>

          <h1 className="mt-5 text-3xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Peminjaman Alat dan Ruang FILKOM
          </h1>
          <p className="mt-4 max-w-2xl text-base font-medium text-white/90 sm:text-lg">
            Layanan reservasi fasilitas laboratorium, auditorium, ruang kelas,
            dan perangkat multimedia terpadu Fakultas Ilmu Komputer.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-9 flex w-full max-w-[740px] flex-col gap-2 rounded-2xl bg-white p-2 shadow-xl sm:flex-row sm:items-center"
          >
            <label className="flex flex-1 items-center gap-3 px-3 py-2">
              <Search className="size-5 shrink-0 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari alat atau ruang yang ingin dipinjam"
                className="w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-slate-400"
              />
            </label>
            <label className="flex shrink-0 items-center gap-2 border-t border-line px-3 py-2 sm:border-l sm:border-t-0">
              <CalendarDays className="size-4 shrink-0 text-slate-500" />
              <input
                type="date"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                className="bg-transparent text-sm font-medium text-slate-700 outline-none"
              />
            </label>
            <button
              type="submit"
              className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark cursor-pointer"
            >
              Cari Fasilitas <ArrowRight className="size-4 shrink-0" />
            </button>
          </form>
        </div>
      </div>

      {/* Category strip */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map(({ icon: Icon, title, info }) => (
          <button
            key={title}
            type="button"
            onClick={handleCategoryClick}
            className="flex items-center gap-4 rounded-2xl border border-line bg-white px-5 py-4 text-left transition-all hover:border-brand/40 hover:shadow-sm cursor-pointer"
          >
            <span className="flex size-11 aspect-square shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold leading-tight text-ink">
                {title}
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                {info}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
