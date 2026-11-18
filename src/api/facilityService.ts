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

export interface CreateBookingPayload {
  room_id: string | number;
  lembaga_id: string | number;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  purpose: string;
  agenda?: string;
  activity_name?: string;
  program_kerja?: string;
  participants?: number;
  document_url?: string;
  pic_phone?: string;
  items?: Array<{ item_id: string | number; quantity: number }>;
}

export const createBookingApi = async (
  payload: CreateBookingPayload,
): Promise<ApiResponse<Booking>> => {
  const res = await axiosClient.post<ApiResponse<Booking>>(
    "/room-bookings",
    payload,
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
  const res = await axiosClient.put<ApiResponse<Booking>>(
    `/room-bookings/${id}`,
    payload,
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
