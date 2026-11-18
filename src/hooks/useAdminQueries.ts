import { useQuery } from "@tanstack/react-query";
import {
  getAdminBookingStatsApi,
  getAdminBookingsApi,
  getAdminBookingDetailApi,
  getAdminRoomsApi,
  getAdminItemsApi,
  getAdminLembagaApi,
  getAuditLogsApi,
  getBookingSummaryReportApi,
} from "../api/adminService";
import type {
  Booking,
  Room,
  Item,
  Lembaga,
  AuditLog,
  Paginated,
  DashboardStats,
} from "../types/api";

// Admin stats
export function useAdminBookingStats() {
  return useQuery<DashboardStats>({
    queryKey: ["admin", "booking-stats"],
    queryFn: async () => {
      const res = await getAdminBookingStatsApi();
      const raw = res.data as DashboardStats & Record<string, unknown>;
      // Normalize: map backend fields (diajukan, direview, etc.) → camelCase aliases used by UI components
      const total = Number(raw.total ?? raw.total_bookings ?? 0);
      const pending = Number(
        raw.pending ?? raw.pending_bookings ?? raw.diajukan ?? 0,
      );
      const review = Number(
        raw.review ?? raw.review_bookings ?? raw.direview ?? 0,
      );
      const waitingSignature = Number(
        raw.waitingSignature ?? raw.waiting_signature ?? raw.menunggu_ttd ?? 0,
      );
      const needsRevision = Number(
        raw.needsRevision ?? raw.needs_revision ?? raw.perlu_revisi ?? 0,
      );
      const approved = Number(
        raw.approved ?? raw.approved_bookings ?? raw.disetujui ?? 0,
      );
      const rejected = Number(
        raw.rejected ?? raw.rejected_bookings ?? raw.ditolak ?? 0,
      );
      const cancelled = Number(
        raw.cancelled ?? raw.cancelled_bookings ?? raw.dibatalkan ?? 0,
      );

      return {
        ...raw,
        total,
        pending,
        review,
        waitingSignature,
        needsRevision,
        approved,
        rejected,
        cancelled,
        total_bookings: total,
        pending_bookings: pending,
        approved_bookings: approved,
        active_facilities: Number(raw.active_facilities ?? 0),
      } satisfies DashboardStats;
    },
  });
}

// Admin bookings list (paginated + filter)
export function useAdminBookingsPaginated(params: {
  page: number;
  per_page: number;
  status?: string;
  q?: string;
}) {
  return useQuery<Paginated<ExtendedAdminBooking>>({
    queryKey: ["admin", "bookings", params],
    queryFn: async () => {
      const queryParams: Record<string, unknown> = {
        page: params.page,
        per_page: params.per_page,
      };
      if (params.status && params.status !== "all") {
        queryParams.status = params.status;
      }
      if (params.q?.trim()) {
        queryParams.q = params.q.trim();
      }
      const res = await getAdminBookingsApi(queryParams);
      const data = res.data;
      const items = (data?.items ?? []).map((r, idx): ExtendedAdminBooking => {
        const name = r.requester_name || r.user?.name || "Pemohon";
        const roomName = r.room_name || r.room?.name || "Ruangan FILKOM";
        const org = r.lembaga_name || r.lembaga?.name || "-";
        const identifier = r.requester_nim || r.user?.nim || "-";
        const programStudy =
          r.requester_prodi || r.user?.program_studi || "Fakultas Ilmu Komputer";
        const contact = r.requester_contact || r.user?.phone || "-";
        return {
          ...r,
          backendId: r.id,
          ticketCode: r.booking_no ?? r.ticket_code ?? r.id,
          rawStatus: r.status,
          initials: getInitials(name),
          tone: tones[idx % tones.length],
          name,
          identifier,
          org,
          room: roomName,
          roomMeta:
            r.room?.location ??
            r.room?.building ??
            r.purpose ??
            "Kegiatan Akademik",
          category: mapRoomToCalendarMeta(roomName).category ?? "Ruang Kelas",
          date: (r.booking_date ?? r.date ?? "").slice(0, 10),
          time: `${r.start_time ?? "08:00"} - ${r.end_time ?? "10:00"}`,
          programStudy,
          contact,
          participants: r.participants ?? 0,
          purpose: r.purpose ?? "Kegiatan",
          agenda: r.agenda ?? "-",
          programKerja: r.program_kerja ?? "-",
          revisionHistory: r.revision_note,
          rejectionReason: r.rejection_reason,
          documentUrl: r.document_url,
          finalLetterUrl: r.final_letter_url,
          doc: { name: "Dokumen_Pengajuan.pdf", kind: "pdf" },
        };
      });
      return {
        items,
        total: data?.total ?? items.length,
        page: data?.page ?? params.page,
        per_page: data?.per_page ?? params.per_page,
      };
    },
  });
}

// Single booking detail for admin
export function useAdminBookingDetail(id: string | number | undefined) {
  return useQuery<Booking>({
    queryKey: ["admin", "booking-detail", id],
    queryFn: async () => {
      const res = await getAdminBookingDetailApi(id!);
      return res.data;
    },
    enabled: !!id,
  });
}

// Master rooms (admin)
export function useAdminMasterRooms(page = 1, perPage = 20) {
  return useQuery<Paginated<Room>>({
    queryKey: ["admin", "rooms", page, perPage],
    queryFn: async () => {
      const res = await getAdminRoomsApi({ page, per_page: perPage });
      return res.data;
    },
  });
}

// Master items (admin)
export function useAdminMasterItems(
  pageOrParams:
    | number
    | { page?: number; perPage?: number; q?: string; status?: string } = 1,
  perPageParam = 20,
) {
  const params: Record<string, unknown> =
    typeof pageOrParams === "object"
      ? {
          page: pageOrParams.page ?? 1,
          per_page: pageOrParams.perPage ?? 20,
          ...(pageOrParams.q?.trim() ? { q: pageOrParams.q.trim() } : {}),
          ...(pageOrParams.status && pageOrParams.status !== "all"
            ? { status: pageOrParams.status }
            : {}),
        }
      : {
          page: pageOrParams,
          per_page: perPageParam,
        };

  return useQuery<Paginated<Item>>({
    queryKey: ["admin", "items", params],
    queryFn: async () => {
      const res = await getAdminItemsApi(params);
      return res.data;
    },
  });
}

// Master lembaga (admin)
export function useAdminMasterLembaga(page = 1, perPage = 50) {
  return useQuery<Paginated<Lembaga>>({
    queryKey: ["admin", "lembaga", page, perPage],
    queryFn: async () => {
      const res = await getAdminLembagaApi({ page, per_page: perPage });
      return res.data;
    },
  });
}

// Audit logs
export function useAdminAuditLogs(params: {
  page: number;
  per_page: number;
  q?: string;
}) {
  return useQuery<Paginated<AuditLog>>({
    queryKey: ["admin", "audit-logs", params],
    queryFn: async () => {
      const res = await getAuditLogsApi(params);
      return res.data;
    },
  });
}

// Summary report
export function useAdminSummaryReport() {
  return useQuery<Record<string, unknown>>({
    queryKey: ["admin", "summary-report"],
    queryFn: async () => {
      const res = await getBookingSummaryReportApi();
      return res.data;
    },
  });
}

// ===================== BACKWARD COMPAT =====================
// AdminCalendar and AdminTableSection use these; kept to avoid full rewrites.

import type { CalendarEvent } from "../types/admin";

export type ExtendedAdminBooking = Omit<Booking, "room"> & {
  backendId: string | number;
  ticketCode: string;
  rawStatus: string;
  initials: string;
  tone: string;
  name: string;
  identifier: string;
  org: string;
  room: string;
  roomMeta: string;
  category: string;
  date: string;
  time: string;
  programStudy: string;
  contact: string;
  participants: number;
  purpose: string;
  agenda: string;
  programKerja: string;
  revisionHistory?: string;
  rejectionReason?: string;
  documentUrl?: string;
  finalLetterUrl?: string;
  doc: { name: string; kind: "pdf" | "memo" };
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

const tones = ["blue", "green", "violet", "amber"] as const;

function mapRoomToCalendarMeta(roomName: string): {
  category: CalendarEvent["category"];
  kind: CalendarEvent["kind"];
} {
  const lower = roomName.toLowerCase();
  if (lower.includes("auditorium")) return { category: "Auditorium", kind: "auditorium" };
  if (lower.includes("lab")) return { category: "Lab Komputer", kind: "class" };
  if (lower.includes("studio") || lower.includes("multimedia")) return { category: "Studio & Multimedia", kind: "studio" };
  return { category: "Ruang Kelas", kind: "class" };
}

export function useCalendarEvents(startDate?: string, endDate?: string) {
  return useQuery<CalendarEvent[]>({
    queryKey: ["admin", "calendar-events", startDate, endDate],
    queryFn: async () => {
      const params: Record<string, unknown> = { page: 1, per_page: 200 };
      if (startDate) params.date_from = startDate;
      if (endDate) params.date_to = endDate;
      const res = await getAdminBookingsApi(params);
      const items = res.data?.items ?? [];
      return items
        .filter((r) => !["rejected", "cancelled", "ditolak", "dibatalkan"].includes(r.status))
        .map((r, idx) => {
          const roomName =
            r.room_name ??
            (typeof r.room === "object" ? r.room?.name : r.room) ??
            "Ruangan FILKOM";
          const dateStr = (r.booking_date ?? r.date ?? "").slice(0, 10);
          const startTime = (r.start_time ?? "08:00").slice(0, 5);
          const endTime = (r.end_time ?? "10:00").slice(0, 5);
          const activity = r.agenda ?? r.program_kerja ?? r.purpose ?? "Kegiatan";
          const { category, kind } = mapRoomToCalendarMeta(roomName);
          return {
            id: String(r.id ?? idx),
            title: `${roomName} – ${activity}`,
            date: dateStr,
            time: `${startTime}–${endTime}`,
            kind,
            category,
          };
        });
    },
  });
}

export function useAdminRequests() {
  const query = useAdminBookingsPaginated({ page: 1, per_page: 50 });
  return {
    ...query,
    data: (query.data?.items ?? []).map((r, idx): ExtendedAdminBooking => {
      const name = r.user?.name ?? "Mahasiswa FILKOM";
      const roomObj = (typeof r.room === "object" ? r.room : null) as Room | null;
      const roomName = (typeof r.room === "string" ? r.room : roomObj?.name) ?? "Ruangan FILKOM";
      return {
        ...r,
        backendId: r.id,
        ticketCode: r.booking_no ?? r.ticket_code ?? r.id,
        rawStatus: r.status,
        initials: getInitials(name),
        tone: tones[idx % tones.length],
        name,
        identifier: r.user?.nim ?? "-",
        org: r.lembaga?.name ?? "-",
        room: roomName,
        roomMeta: roomObj?.location ?? roomObj?.building ?? r.purpose ?? "Kegiatan Akademik",
        category: mapRoomToCalendarMeta(roomName).category ?? "Ruang Kelas",
        date: (r.booking_date ?? r.date ?? "").slice(0, 10),
        time: `${r.start_time ?? "08:00"} - ${r.end_time ?? "10:00"}`,
        programStudy: "Fakultas Ilmu Komputer",
        contact: r.user?.phone ?? "-",
        participants: r.participants ?? 0,
        purpose: r.purpose ?? "Kegiatan",
        agenda: r.agenda ?? "-",
        programKerja: r.program_kerja ?? "-",
        revisionHistory: r.revision_note,
        rejectionReason: r.rejection_reason,
        documentUrl: r.document_url,
        finalLetterUrl: r.final_letter_url,
        doc: { name: "Dokumen_Pengajuan.pdf", kind: "pdf" },
      };
    }),
  };
}
