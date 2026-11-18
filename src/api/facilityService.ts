import axiosClient, { SERVER_ROOT_URL } from "./axiosClient";
import type {
  ApiResponse,
  Room,
  RoomSlot,
  Item,
  Lembaga,
  Booking,
  Paginated,
} from "../types/api";

// --- Katalog Ruang, Barang, Lembaga & Slot Waktu ---

export const getRoomsApi = async (
  params?: Record<string, unknown>,
): Promise<ApiResponse<Room[] | Paginated<Room>>> => {
  const res = await axiosClient.get<ApiResponse<Room[] | Paginated<Room>>>(
    "/rooms",
    { params },
  );
  return res.data;
};

export const getRoomDetailApi = async (
  id: string | number,
): Promise<ApiResponse<Room>> => {
  const res = await axiosClient.get<ApiResponse<Room>>(`/rooms/${id}`);
  return res.data;
};

export const getRoomAvailabilityApi = async (
  id: string | number,
  date: string, // format YYYY-MM-DD
): Promise<ApiResponse<RoomSlot[]>> => {
  const res = await axiosClient.get<ApiResponse<RoomSlot[]>>(
    `/rooms/${id}/availability`,
    { params: { date } },
  );
  return res.data;
};

export const getItemsApi = async (params?: {
  q?: string;
  status?: string;
}): Promise<ApiResponse<Item[] | Paginated<Item>>> => {
  const res = await axiosClient.get<ApiResponse<Item[] | Paginated<Item>>>(
    "/items",
    { params },
  );
  return res.data;
};

export const getItemDetailApi = async (
  id: string | number,
): Promise<ApiResponse<Item>> => {
  const res = await axiosClient.get<ApiResponse<Item>>(`/items/${id}`);
  return res.data;
};

export const getLembagaApi = async (): Promise<ApiResponse<Lembaga[]>> => {
  const res = await axiosClient.get<ApiResponse<Lembaga[]>>("/lembaga");
  return res.data;
};

export const getTimeSlotsConfigApi = async (): Promise<unknown> => {
  const res = await axiosClient.get("/time-slots", {
    baseURL: SERVER_ROOT_URL,
  });
  return res.data;
};

// --- Pengajuan & Riwayat Peminjaman Mahasiswa ---
// Backend SubmitBookingRequest DTO:
// lembaga_id (uuid, required), program_kerja (required), agenda (required),
// room_id (uuid, required), booking_date (required), start_time (required), end_time (required),
// participants (required, min=1), purpose (optional), requester_contact (required), document_url (required, url)

export interface CreateBookingPayload {
  room_id: string;
  lembaga_id: string;
  booking_date: string;         // YYYY-MM-DD  (was "date")
  start_time: string;           // HH:MM
  end_time: string;             // HH:MM
  program_kerja: string;        // required
  agenda: string;               // required
  participants: number;         // required, min=1
  requester_contact: string;    // required (was "pic_phone")
  document_url: string;         // required, must be a URL
  purpose?: string;             // optional, max=100
  // Legacy compat aliases (not sent to backend)
  date?: string;
  pic_phone?: string;
  activity_name?: string;
}

export const createBookingApi = async (
  payload: CreateBookingPayload,
): Promise<ApiResponse<Booking>> => {
  // Map legacy field names to backend field names
  const body = {
    room_id: payload.room_id,
    lembaga_id: payload.lembaga_id,
    booking_date: payload.booking_date || payload.date,
    start_time: payload.start_time,
    end_time: payload.end_time,
    program_kerja: payload.program_kerja,
    agenda: payload.agenda,
    participants: payload.participants,
    requester_contact: payload.requester_contact || payload.pic_phone,
    document_url: payload.document_url,
    purpose: payload.purpose,
  };
  const res = await axiosClient.post<ApiResponse<Booking>>(
    "/room-bookings",
    body,
  );
  return res.data;
};

export const getMyBookingsApi = async (params?: {
  status?: string;
}): Promise<ApiResponse<Booking[]>> => {
  const res = await axiosClient.get<ApiResponse<Booking[]>>(
    "/room-bookings/me",
    { params },
  );
  return res.data;
};

export const getBookingDetailApi = async (
  id: string | number,
): Promise<ApiResponse<Booking>> => {
  const res = await axiosClient.get<ApiResponse<Booking>>(
    `/room-bookings/${id}`,
  );
  return res.data;
};

export const updateRevisionBookingApi = async (
  id: string | number,
  payload: Partial<CreateBookingPayload>,
): Promise<ApiResponse<Booking>> => {
  const body = {
    room_id: payload.room_id,
    lembaga_id: payload.lembaga_id,
    booking_date: payload.booking_date || payload.date,
    start_time: payload.start_time,
    end_time: payload.end_time,
    program_kerja: payload.program_kerja,
    agenda: payload.agenda,
    participants: payload.participants,
    requester_contact: payload.requester_contact || payload.pic_phone,
    document_url: payload.document_url,
    purpose: payload.purpose,
  };
  const res = await axiosClient.put<ApiResponse<Booking>>(
    `/room-bookings/${id}`,
    body,
  );
  return res.data;
};

export const resubmitBookingApi = async (
  id: string | number,
): Promise<ApiResponse<Booking>> => {
  const res = await axiosClient.post<ApiResponse<Booking>>(
    `/room-bookings/${id}/resubmit`,
  );
  return res.data;
};

export const cancelBookingApi = async (
  id: string | number,
): Promise<ApiResponse<Booking>> => {
  const res = await axiosClient.post<ApiResponse<Booking>>(
    `/room-bookings/${id}/cancel`,
  );
  return res.data;
};
