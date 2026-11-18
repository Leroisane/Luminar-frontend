import { useQuery } from "@tanstack/react-query";
import {
  getItemsApi,
  getLembagaApi,
  getMyBookingsApi,
  getRoomAvailabilityApi,
  getRoomsApi,
  getTimeSlotsConfigApi,
} from "../api/facilityService";
import type { BookingStep, BuildingKey, Facility, TimeSlot } from "../types";

export interface BackendBookingItem {
  id: string | number;
  ticketId: string;
  status: string;
  rawStatus: string;
  submittedAt: string;
  activity: string;
  programKerja?: string;
  agenda?: string;
  resources: string;
  schedule: string;
  date: string;
  startTime: string;
  endTime: string;
  participants?: number;
  purpose?: string;
  lembagaName?: string;
  revisionNote?: string;
  rejectionReason?: string;
  documentUrl?: string;
  finalLetterUrl?: string;
  steps: BookingStep[];
}

function extractArray(res: unknown): Record<string, unknown>[] {
  const obj = res as Record<string, unknown>;
  const inner = obj?.data as Record<string, unknown> | unknown[] | undefined;
  if (Array.isArray(inner)) return inner as Record<string, unknown>[];
  if (inner && typeof inner === "object") {
    const list =
      (inner as Record<string, unknown>).items ||
      (inner as Record<string, unknown>).data ||
      (inner as Record<string, unknown>).rows;
    if (Array.isArray(list)) return list as Record<string, unknown>[];
  }
  if (Array.isArray(res)) return res as Record<string, unknown>[];
  return [];
}

function mapRoomCategory(raw: Record<string, unknown>): Facility["category"] {
  const cat = String(raw.category ?? raw.type ?? "").toLowerCase();
  const name = String(raw.name ?? "").toLowerCase();
  if (cat.includes("lab") || name.includes("lab")) return "Laboratorium";
  if (cat.includes("audio") || name.includes("sound") || name.includes("band"))
    return "Audio System";
  if (
    cat.includes("alat") ||
    cat.includes("item") ||
    cat.includes("multimedia")
  )
    return "Peralatan Multimedia";
  return "Ruang Kuliah";
}

export function useFacilities() {
  return useQuery<Facility[]>({
    queryKey: ["facilities"],
    queryFn: async () => {
      const [roomsRes, itemsRes] = await Promise.all([
        getRoomsApi().catch(() => []),
        getItemsApi().catch(() => []),
      ]);

      const rooms = extractArray(roomsRes).map((r) => ({
        id: String(r.id ?? ""),
        name: String(r.name ?? "Ruangan FILKOM"),
        category: mapRoomCategory(r),
        location: String(
          r.building ?? r.location ?? r.floor ?? "Gedung FILKOM UB",
        ),
        specs: String(
          r.description ??
            r.specs ??
            (r.capacity ? `Kapasitas ${r.capacity} orang` : "Fasilitas Ruang"),
        ),
        image: String(r.image_url ?? r.image ?? ""),
        units: typeof r.capacity === "number" ? r.capacity : undefined,
        requirement: {
          label: "Syarat Dokumen",
          value: String(r.requirement ?? "Surat Izin Kegiatan"),
        },
      })) as Facility[];

      const items = extractArray(itemsRes).map((it) => ({
        id: `item-${it.id ?? ""}`,
        name: String(it.name ?? "Inventaris FILKOM"),
        category: mapRoomCategory({ ...it, type: "item" }),
        location: String(it.location ?? "Loket Sarpras Gd. G Lt. 1"),
        specs: String(
          it.description ?? it.specs ?? "Peralatan Penunjang Kegiatan",
        ),
        image: String(it.image_url ?? it.image ?? ""),
        units:
          typeof it.stock === "number"
            ? it.stock
            : typeof it.quantity === "number"
              ? it.quantity
              : 1,
        requirement: {
          label: "Syarat Dokumen",
          value: "KTM & Surat Peminjaman",
        },
      })) as Facility[];

      return [...rooms, ...items];
    },
  });
}

export function useRoomsList() {
  return useQuery({
    queryKey: ["rooms-list"],
    queryFn: async () => {
      const res = await getRoomsApi();
      return extractArray(res).map((r) => ({
        id: String(r.id ?? ""),
        name: String(r.name ?? ""),
        building: String(r.building ?? r.location ?? ""),
        capacity: Number(r.capacity ?? 0),
        status: String(r.status ?? "tersedia"),
      }));
    },
  });
}

export function useLembagaOptions() {
  return useQuery({
    queryKey: ["lembaga-options"],
    queryFn: async () => {
      const res = await getLembagaApi();
      return extractArray(res).map((l) => ({
        id: String(l.id ?? ""),
        name: String(l.name ?? l.nama ?? ""),
      }));
    },
  });
}

export function useTimeSlotsConfig() {
  return useQuery({
    queryKey: ["time-slots-config"],
    queryFn: async () => {
      try {
        const res = await getTimeSlotsConfigApi();
        const cfg = (res?.data || res || {}) as Record<string, unknown>;
        return {
          minLeadDays: Number(cfg.min_lead_days ?? 2),
          dayStart: String(cfg.day_start ?? "07:00"),
          dayEnd: String(cfg.day_end ?? "21:00"),
          slotMinutes: Number(cfg.slot_minutes ?? 30),
          timezone: String(cfg.timezone ?? "Asia/Jakarta"),
        };
      } catch {
        return {
          minLeadDays: 2,
          dayStart: "07:00",
          dayEnd: "21:00",
          slotMinutes: 30,
          timezone: "Asia/Jakarta",
        };
      }
    },
  });
}

export function useSlots(dateISO: string, building: BuildingKey) {
  return useQuery<TimeSlot[]>({
    queryKey: ["slots", dateISO, building],
    queryFn: async () => {
      const roomsRes = await getRoomsApi();
      const allRooms = extractArray(roomsRes);
      const filteredRooms = allRooms.filter((r) => {
        const loc =
          `${r.building ?? ""} ${r.location ?? ""} ${r.name ?? ""}`.toLowerCase();
        if (building === "G") return loc.includes("g") && !loc.includes("gkm");
        if (building === "F") return loc.includes("f");
        if (building === "Kreatif")
          return loc.includes("gkm") || loc.includes("kreatif");
        return true;
      });

      const targetRooms =
        filteredRooms.length > 0 ? filteredRooms : allRooms.slice(0, 6);

      const results = await Promise.all(
        targetRooms.map(async (room) => {
          const roomId = String(room.id ?? "");
          const availRes = await getRoomAvailabilityApi(roomId, dateISO).catch(
            () => null,
          );
          const availData = (availRes?.data || availRes || {}) as Record<
            string,
            unknown
          >;
          const hasExplicitSlots =
            Array.isArray(availData.free_slots) ||
            Array.isArray(availData.slots);
          const freeSlots = Array.isArray(availData.free_slots)
            ? availData.free_slots
            : Array.isArray(availData.slots)
              ? availData.slots
              : [];

          const firstFree = freeSlots[0] as
            | {
                start?: string;
                end?: string;
                start_time?: string;
                end_time?: string;
              }
            | string
            | undefined;

          const timeLabel =
            typeof firstFree === "string"
              ? firstFree
              : firstFree
                ? `${firstFree.start ?? firstFree.start_time ?? "08:00"} - ${firstFree.end ?? firstFree.end_time ?? "17:00"} WIB`
                : "08:00 - 17:00 WIB";

          const isAvailable = hasExplicitSlots
            ? freeSlots.length > 0
            : availData.available !== false;

          return {
            id: roomId,
            name: String(room.name ?? "Ruangan"),
            time: isAvailable ? timeLabel : "Penuh / Terjadwal",
            meta: room.capacity
              ? `Kapasitas ${room.capacity} Orang`
              : String(room.building ?? "FILKOM UB"),
            icon: String(room.name ?? "")
              .toLowerCase()
              .includes("lab")
              ? "lab"
              : "auditorium",
            status: isAvailable ? "available" : "reserved",
            reservedBy: isAvailable ? undefined : "Terjadwal",
          } as TimeSlot;
        }),
      );

      return results;
    },
  });
}

function buildStepsForStatus(
  rawStatus: string,
  submittedAt: string,
): BookingStep[] {
  const s = rawStatus.toLowerCase();
  const isApproved =
    s.includes("approve") || s.includes("setuju") || s.includes("selesai");
  const isHandedOver = s.includes("hand_over") || s.includes("return");

  return [
    {
      id: 1,
      title: "Pengajuan Diterima",
      state: "done",
      timestamp: submittedAt,
      note: "Tercatat di sistem Luminar",
    },
    {
      id: 2,
      title: "Verifikasi Admin Sarpras",
      state: isApproved || isHandedOver ? "done" : "current",
      timestamp: "",
      note:
        isApproved || isHandedOver
          ? "Telah diverifikasi admin"
          : "Menunggu peninjauan koordinator",
    },
    {
      id: 3,
      title: "Penerbitan Surat Izin Resmi",
      state: isHandedOver ? "done" : isApproved ? "current" : "pending",
      timestamp: "",
      note: "",
      description: isApproved
        ? "Surat resmi siap diunduh"
        : "Terbit setelah disetujui",
    },
    {
      id: 4,
      title: "Penggunaan & Pengembalian",
      state: isHandedOver ? "done" : "pending",
      timestamp: "",
      note: "",
      description: "Konfirmasi ke loket Gedung G Lt. 1",
    },
  ];
}

function formatHumanStatus(rawStatus: string): string {
  const s = rawStatus.toLowerCase();
  if (s === "pending" || s === "submitted" || s === "perlu_diulas")
    return "Menunggu Verifikasi";
  if (s === "review" || s === "in_review") return "Sedang Direview";
  if (s === "perlu_revisi" || s === "revision_requested") return "Perlu Revisi";
  if (s === "menunggu_ttd" || s === "waiting_signature") return "Menunggu TTD";
  if (s === "approved" || s === "disetujui") return "Disetujui";
  if (s === "rejected" || s === "ditolak") return "Ditolak";
  if (s === "cancelled" || s === "dibatalkan") return "Dibatalkan";
  if (s === "hand_over") return "Sedang Digunakan";
  if (s === "return" || s === "returned") return "Selesai / Dikembalikan";
  return rawStatus || "Menunggu Verifikasi";
}

export function normalizeBookingItem(
  raw: Record<string, unknown>,
): BackendBookingItem {
  const rawStatus = String(raw.status ?? "pending");
  const roomObj = raw.room as Record<string, unknown> | undefined;
  const lembagaObj = raw.lembaga as Record<string, unknown> | undefined;

  const dateStr = String(raw.date ?? raw.booking_date ?? "").slice(0, 10);
  const startTime = String(raw.start_time ?? "08:00").slice(0, 5);
  const endTime = String(raw.end_time ?? "10:00").slice(0, 5);
  const submittedAt = raw.created_at
    ? new Date(String(raw.created_at)).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : dateStr;

  const roomName = String(
    roomObj?.name ?? raw.room_name ?? raw.facility_name ?? "Ruangan FILKOM",
  );
  const activity = String(
    raw.agenda ?? raw.activity_name ?? raw.program_kerja ?? "Kegiatan Akademik",
  );

  return {
    id: (raw.id as string | number) ?? "",
    ticketId: String(
      raw.ticket_code ?? raw.booking_code ?? raw.code ?? `REQ-${raw.id ?? "-"}`,
    ),
    status: formatHumanStatus(rawStatus),
    rawStatus,
    submittedAt,
    activity,
    programKerja: String(raw.program_kerja ?? ""),
    agenda: String(raw.agenda ?? activity),
    resources: roomName,
    schedule: `${dateStr} • ${startTime} - ${endTime} WIB`,
    date: dateStr,
    startTime,
    endTime,
    participants: Number(raw.participants ?? raw.participant_count ?? 0),
    purpose: String(raw.purpose ?? "Kegiatan"),
    lembagaName: String(lembagaObj?.name ?? raw.lembaga_name ?? "-"),
    revisionNote: raw.revision_note
      ? String(raw.revision_note)
      : raw.admin_note
        ? String(raw.admin_note)
        : undefined,
    rejectionReason: raw.rejection_reason
      ? String(raw.rejection_reason)
      : undefined,
    documentUrl: raw.document_url ? String(raw.document_url) : undefined,
    finalLetterUrl: raw.final_letter_url
      ? String(raw.final_letter_url)
      : undefined,
    steps: buildStepsForStatus(rawStatus, submittedAt),
  };
}

export function useMyBookingsList(statusFilter?: string) {
  return useQuery<BackendBookingItem[]>({
    queryKey: ["my-bookings", statusFilter ?? "all"],
    queryFn: async () => {
      const params =
        statusFilter && statusFilter !== "all"
          ? { status: statusFilter }
          : undefined;
      const res = await getMyBookingsApi(params);
      return extractArray(res).map(normalizeBookingItem);
    },
  });
}

export function useMyBooking() {
  const listQuery = useMyBookingsList();
  return {
    ...listQuery,
    data: listQuery.data?.[0] ?? null,
  };
}
