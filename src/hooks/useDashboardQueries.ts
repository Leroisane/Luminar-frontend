import { useQuery } from "@tanstack/react-query";
import {
  getRoomsApi,
  getItemsApi,
  getLembagaApi,
  getMyBookingsApi,
  getBookingDetailApi,
  getRoomAvailabilityApi,
} from "../api/facilityService";
import type { Room, Item, Lembaga, Booking, RoomSlot, Paginated } from "../types/api";

/** Ekstrak array dari response (handle both wrapped & paginated) */
function extractArray<T>(res: { data?: T[] | Paginated<T> } | T[] | Paginated<T>): T[] {
  const payload = (res as { data?: unknown }).data ?? res;
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object" && "items" in (payload as object)) {
    return ((payload as Paginated<T>).items) ?? [];
  }
  return [];
}

// --- Katalog Fasilitas (Mahasiswa) ---

export function useRooms(params?: Record<string, unknown>) {
  return useQuery<Room[]>({
    queryKey: ["rooms", params],
    queryFn: async () => {
      const res = await getRoomsApi(params);
      return extractArray<Room>(res as unknown as Room[] | Paginated<Room>);
    },
  });
}

export function useItems(params?: { q?: string; status?: string }) {
  return useQuery<Item[]>({
    queryKey: ["items", params],
    queryFn: async () => {
      const res = await getItemsApi(params);
      return extractArray<Item>(res as unknown as Item[] | Paginated<Item>);
    },
  });
}

export function useLembaga() {
  return useQuery<Lembaga[]>({
    queryKey: ["lembaga"],
    queryFn: async () => {
      const res = await getLembagaApi();
      const payload = res?.data;
      return Array.isArray(payload) ? payload : [];
    },
  });
}

// --- Booking Mahasiswa ---

export function useMyBookings(status?: string) {
  return useQuery<Booking[]>({
    queryKey: ["my-bookings", status],
    queryFn: async () => {
      const res = await getMyBookingsApi(status ? { status } : undefined);
      const payload = res?.data;
      return Array.isArray(payload) ? payload : [];
    },
  });
}

export function useBookingDetail(id: string | number | undefined) {
  return useQuery<Booking>({
    queryKey: ["booking-detail", id],
    queryFn: async () => {
      const res = await getBookingDetailApi(id!);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useRoomAvailability(
  roomId: string | number | undefined,
  date: string | undefined,
) {
  return useQuery<RoomSlot[]>({
    queryKey: ["room-availability", roomId, date],
    queryFn: async () => {
      const res = await getRoomAvailabilityApi(roomId!, date!);
      const payload = res?.data;
      return Array.isArray(payload) ? payload : [];
    },
    enabled: !!roomId && !!date,
  });
}

// ===================== BACKWARD COMPAT ALIASES =====================
// StatusSection uses these names; kept to avoid a full rewrite of that component.

export type BackendBookingItem = {
  id: string;
  ticketId: string;
  rawStatus: string;
  status: string;
  lembagaName: string;
  schedule: string;
  resources: string;
  activity: string;
  agenda?: string;
  programKerja?: string;
  revisionNote?: string;
  rejectionReason?: string;
  documentUrl?: string;
  finalLetterUrl?: string;
};

export function useMyBookingsList(status?: string) {
  return useQuery<BackendBookingItem[]>({
    queryKey: ["my-bookings", status],
    queryFn: async () => {
      const res = await getMyBookingsApi(
        status && status !== "all" ? { status } : undefined,
      );
      const payload = res?.data;
      const arr = Array.isArray(payload) ? payload : [];
      return arr.map((b): BackendBookingItem => ({
        id: b.id,
        ticketId: b.booking_no ?? b.ticket_code ?? b.id,
        rawStatus: b.status,
        status: b.status,
        lembagaName: b.lembaga?.name ?? "-",
        schedule: `${b.booking_date ?? b.date} ${b.start_time}–${b.end_time}`,
        resources: b.room?.name ?? "-",
        activity: b.agenda ?? b.purpose ?? "-",
        agenda: b.agenda,
        programKerja: b.program_kerja,
        revisionNote: b.revision_note,
        rejectionReason: b.rejection_reason,
        documentUrl: b.document_url,
        finalLetterUrl: b.final_letter_url,
      }));
    },
  });
}

// ---- Additional compat aliases used by ScheduleSection / BookingModal ----
export { useLembaga as useLembagaOptions };
export { useRooms as useRoomsList };

export function useTimeSlotsConfig() {
  return useQuery<unknown>({
    queryKey: ["time-slots-config"],
    queryFn: async () => {
      const { getTimeSlotsConfigApi } = await import("../api/facilityService");
      return getTimeSlotsConfigApi();
    },
  });
}

// ---- useFacilities alias for CatalogSection ----
import type { Facility, FacilityCategory } from "../types/index";

export function useFacilities(params?: Record<string, unknown>) {
  return useQuery<Facility[]>({
    queryKey: ["facilities", params],
    queryFn: async () => {
      const res = await getRoomsApi(params);
      const rooms = extractArray<Room>(res as unknown as Room[] | Paginated<Room>);
      return rooms.map((rm): Facility => {
        let cat: FacilityCategory = "Ruang Kuliah";
        const lower = rm.name.toLowerCase();
        if (lower.includes("lab")) cat = "Laboratorium";
        else if (lower.includes("audio") || lower.includes("sound")) cat = "Audio System";
        else if (lower.includes("kamera") || lower.includes("multimedia") || lower.includes("studio")) cat = "Peralatan Multimedia";

        return {
          id: String(rm.id),
          name: rm.name,
          image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80",
          location: `Gedung ${rm.building}`,
          specs: `Kapasitas ${rm.capacity} orang • ${rm.description || "Fasilitas FILKOM UB"}`,
          category: cat,
          requirement: { label: "Peminjaman", value: "Minimal H-3" },
        };
      });
    },
  });
}
