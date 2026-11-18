import { useQuery } from "@tanstack/react-query";
import {
  getAdminBookingStatsApi,
  getAdminBookingsApi,
  getAdminItemsApi,
  getAdminLembagaApi,
  getAdminRoomsApi,
  getAuditLogsApi,
  getBookingSummaryReportApi,
} from "../api/adminService";
import type {
  AvatarTone,
  BookingRequest,
  CalendarEvent,
  EventKind,
  RequestCategory,
  RoomCategory,
} from "../types/admin";

export interface AdminBookingStats {
  total: number;
  pending: number;
  review: number;
  waitingSignature: number;
  needsRevision: number;
  approved: number;
  rejected: number;
}

export interface ExtendedAdminBooking extends BookingRequest {
  backendId: string | number;
  ticketCode: string;
  rawStatus: string;
  programStudy?: string;
  contact?: string;
  participants?: number;
  purpose?: string;
  agenda?: string;
  programKerja?: string;
  revisionHistory?: string;
  rejectionReason?: string;
  documentUrl?: string;
  finalLetterUrl?: string;
}

const tones: AvatarTone[] = ["blue", "green", "violet", "amber"];

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

function mapCategory(roomName: string): RequestCategory {
  const lower = roomName.toLowerCase();
  if (lower.includes("auditorium")) return "Auditorium";
  if (lower.includes("lab")) return "Laboratorium";
  if (
    lower.includes("kamera") ||
    lower.includes("audio") ||
    lower.includes("alat")
  )
    return "Peralatan Multimedia";
  return "Ruang Kelas";
}

function mapRoomToCalendarMeta(roomName: string): {
  category: RoomCategory;
  kind: EventKind;
} {
  const lower = roomName.toLowerCase();
  if (lower.includes("auditorium")) {
    return { category: "Auditorium", kind: "auditorium" };
  }
  if (lower.includes("lab")) {
    return { category: "Lab Komputer", kind: "class" };
  }
  if (
    lower.includes("studio") ||
    lower.includes("multimedia") ||
    lower.includes("podcast") ||
    lower.includes("kamera") ||
    lower.includes("audio")
  ) {
    return { category: "Studio & Multimedia", kind: "studio" };
  }
  return { category: "Ruang Kelas", kind: "class" };
}

function extractPaginated(res: unknown): {
  items: Record<string, unknown>[];
  total: number;
} {
  const root = res as Record<string, unknown>;
  const data = (root?.data ?? root) as Record<string, unknown>;
  if (Array.isArray(data)) {
    return {
      items: data as Record<string, unknown>[],
      total: Number(root?.total ?? data.length),
    };
  }
  const items = Array.isArray(data?.items)
    ? (data.items as Record<string, unknown>[])
    : Array.isArray(data?.data)
      ? (data.data as Record<string, unknown>[])
      : [];
  const total = Number(data?.total ?? root?.total ?? items.length);
  return { items, total };
}

export function useAdminBookingStats() {
  return useQuery<AdminBookingStats>({
    queryKey: ["admin", "booking-stats"],
    queryFn: async () => {
      const res = await getAdminBookingStatsApi();
      const s = (res?.data || res || {}) as Record<string, unknown>;
      return {
        total: Number(s.total ?? s.total_bookings ?? 0),
        pending: Number(s.pending ?? s.perlu_diulas ?? 0),
        review: Number(s.review ?? s.sedang_direview ?? 0),
        waitingSignature: Number(s.waiting_signature ?? s.menunggu_ttd ?? 0),
        needsRevision: Number(s.perlu_revisi ?? s.revision_requested ?? 0),
        approved: Number(s.approved ?? s.disetujui ?? 0),
        rejected: Number(s.rejected ?? s.ditolak ?? 0),
      };
    },
  });
}

export function useAdminBookingsPaginated(params: {
  page: number;
  per_page: number;
  status?: string;
  q?: string;
}) {
  return useQuery({
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
      const { items, total } = extractPaginated(res);

      const mapped: ExtendedAdminBooking[] = items.map((r, idx) => {
        const userObj = r.user as Record<string, unknown> | undefined;
        const roomObj = r.room as Record<string, unknown> | undefined;
        const lembagaObj = r.lembaga as Record<string, unknown> | undefined;

        const name = String(
          userObj?.name ??
            r.applicant_name ??
            r.user_name ??
            "Mahasiswa FILKOM",
        );
        const roomName = String(
          roomObj?.name ?? r.room_name ?? "Ruangan FILKOM",
        );
        const dateStr = String(r.date ?? r.booking_date ?? "").slice(0, 10);
        const startTime = String(r.start_time ?? "08:00");
        const endTime = String(r.end_time ?? "10:00");
        const backendId = (r.id as string | number) ?? idx;
        const ticketCode = String(
          r.ticket_code ?? r.booking_code ?? r.code ?? `RR-${backendId}`,
        );

        return {
          id: String(backendId),
          backendId,
          ticketCode,
          rawStatus: String(r.status ?? "pending"),
          initials: getInitials(name) || "MF",
          tone: tones[idx % tones.length],
          name,
          identifier: String(userObj?.nim ?? r.nim ?? r.identifier ?? "-"),
          org: String(lembagaObj?.name ?? r.lembaga_name ?? "-"),
          room: roomName,
          roomMeta: String(
            roomObj?.building ?? r.purpose ?? "Kegiatan Akademik",
          ),
          category: mapCategory(roomName),
          date: dateStr,
          time: `${startTime} - ${endTime}`,
          programStudy: String(
            userObj?.prodi ?? r.program_studi ?? "Fakultas Ilmu Komputer",
          ),
          contact: String(userObj?.phone ?? r.contact ?? r.pic_phone ?? "-"),
          participants: Number(r.participants ?? r.participant_count ?? 0),
          purpose: String(r.purpose ?? "Kegiatan"),
          agenda: String(r.agenda ?? r.activity_name ?? "-"),
          programKerja: String(r.program_kerja ?? "-"),
          revisionHistory: r.revision_note
            ? String(r.revision_note)
            : undefined,
          rejectionReason: r.rejection_reason
            ? String(r.rejection_reason)
            : undefined,
          documentUrl: r.document_url ? String(r.document_url) : undefined,
          finalLetterUrl: r.final_letter_url
            ? String(r.final_letter_url)
            : undefined,
          doc: {
            name: String(r.document_name ?? "Dokumen_Pengajuan.pdf"),
            kind: "pdf",
          },
        };
      });

      return { items: mapped, total };
    },
  });
}

export function useCalendarEvents(startDate?: string, endDate?: string) {
  return useQuery<CalendarEvent[]>({
    queryKey: ["admin", "calendar-events", startDate, endDate],
    queryFn: async () => {
      const params: Record<string, unknown> = { page: 1, per_page: 200 };
      if (startDate) params.date_from = startDate;
      if (endDate) params.date_to = endDate;

      const res = await getAdminBookingsApi(params);
      const { items } = extractPaginated(res);

      return items
        .filter((r) => {
          const status = String(r.status ?? "").toLowerCase();
          return !status.includes("reject") && !status.includes("cancel");
        })
        .map((r, idx) => {
          const roomObj = r.room as Record<string, unknown> | undefined;
          const roomName = String(
            roomObj?.name ?? r.room_name ?? "Ruangan FILKOM",
          );
          const dateStr = String(r.date ?? r.booking_date ?? "").slice(0, 10);
          const startTime = String(r.start_time ?? "08:00").slice(0, 5);
          const endTime = String(r.end_time ?? "10:00").slice(0, 5);
          const activity = String(
            r.agenda ?? r.activity_name ?? r.program_kerja ?? "Kegiatan",
          );
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
    data: query.data?.items ?? [],
  };
}

export function useAdminMasterRooms(page = 1, perPage = 20) {
  return useQuery({
    queryKey: ["admin", "rooms", page, perPage],
    queryFn: async () =>
      extractPaginated(await getAdminRoomsApi({ page, per_page: perPage })),
  });
}

export function useAdminMasterItems(page = 1, perPage = 20) {
  return useQuery({
    queryKey: ["admin", "items", page, perPage],
    queryFn: async () =>
      extractPaginated(await getAdminItemsApi({ page, per_page: perPage })),
  });
}

export function useAdminMasterLembaga(page = 1, perPage = 50) {
  return useQuery({
    queryKey: ["admin", "lembaga", page, perPage],
    queryFn: async () =>
      extractPaginated(await getAdminLembagaApi({ page, per_page: perPage })),
  });
}

export function useAdminAuditLogs(params: {
  page: number;
  per_page: number;
  q?: string;
}) {
  return useQuery({
    queryKey: ["admin", "audit-logs", params],
    queryFn: async () => extractPaginated(await getAuditLogsApi(params)),
  });
}

export function useAdminSummaryReport() {
  return useQuery({
    queryKey: ["admin", "summary-report"],
    queryFn: async () => {
      const res = await getBookingSummaryReportApi();
      return (res?.data || res || {}) as Record<string, unknown>;
    },
  });
}
