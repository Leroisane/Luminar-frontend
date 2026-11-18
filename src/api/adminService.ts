import axiosClient, { downloadExcelExport } from "./axiosClient";
import type {
  ApiResponse,
  Booking,
  Room,
  Item,
  Lembaga,
  AuditLog,
  Paginated,
  DashboardStats,
} from "../types/api";

// --- Booking & Workflow Admin ---

export const getAdminBookingStatsApi = async (): Promise<
  ApiResponse<DashboardStats>
> => {
  const res =
    await axiosClient.get<ApiResponse<DashboardStats>>(
      "/admin/room-bookings/stats",
    );
  return res.data;
};

export const getAdminBookingsApi = async (
  params?: Record<string, unknown>,
): Promise<ApiResponse<Paginated<Booking>>> => {
  const res = await axiosClient.get<ApiResponse<Paginated<Booking>>>(
    "/admin/room-bookings",
    { params },
  );
  return res.data;
};

export const getAdminBookingDetailApi = async (
  id: string | number,
): Promise<ApiResponse<Booking>> => {
  const res = await axiosClient.get<ApiResponse<Booking>>(
    `/admin/room-bookings/${id}`,
  );
  return res.data;
};

export const getLetterDraftApi = async (id: string | number): Promise<Blob> => {
  const res = await axiosClient.get<Blob>(
    `/admin/room-bookings/${id}/letter-draft`,
    { responseType: "blob" },
  );
  return res.data;
};

// Backend expects: { action: "review"|"request_revision"|"approve"|"reject"|"cancel", note?: string }
export interface UpdateBookingStatusPayload {
  action: "review" | "request_revision" | "approve" | "reject" | "cancel";
  note?: string;
}

export const updateBookingStatusApi = async (
  id: string | number,
  payload: UpdateBookingStatusPayload,
): Promise<ApiResponse<Booking>> => {
  const res = await axiosClient.post<ApiResponse<Booking>>(
    `/admin/room-bookings/${id}/status`,
    payload,
  );
  return res.data;
};

export interface FinalLetterPayload {
  final_letter_url: string;
}

export const uploadFinalLetterApi = async (
  id: string | number,
  payload: FinalLetterPayload | string,
): Promise<ApiResponse<Booking>> => {
  const body =
    typeof payload === "string" ? { final_letter_url: payload } : payload;
  const res = await axiosClient.post<ApiResponse<Booking>>(
    `/admin/room-bookings/${id}/final-letter`,
    body,
  );
  return res.data;
};

export interface AdminManualBookingPayload {
  requester_name: string;
  requester_contact: string;
  requester_nim?: string;
  requester_prodi?: string;
  lembaga_id: string;
  program_kerja: string;
  agenda: string;
  room_id: string;
  booking_date: string; // YYYY-MM-DD
  start_time: string;   // HH:MM
  end_time: string;     // HH:MM
  participants: number;
  purpose?: string;
  document_url?: string;
}

export const createManualBookingApi = async (
  payload: AdminManualBookingPayload,
): Promise<ApiResponse<Booking>> => {
  const res = await axiosClient.post<ApiResponse<Booking>>(
    "/admin/room-bookings",
    payload,
  );
  return res.data;
};

export const updateAdminBookingApi = async (
  id: string | number,
  payload: Record<string, unknown>,
): Promise<ApiResponse<Booking>> => {
  const res = await axiosClient.put<ApiResponse<Booking>>(
    `/admin/room-bookings/${id}`,
    payload,
  );
  return res.data;
};

export const exportAdminBookingsExcelApi = (
  params?: Record<string, unknown>,
) =>
  downloadExcelExport(
    "/admin/room-bookings/export",
    params,
    "rekap-peminjaman-luminar.xlsx",
  );

// --- Master Rooms Admin ---
// Backend DTO: { name, location, capacity, description?, status?, status_note? }
// Status valid values: "tersedia" | "renovasi" | "nonaktif"

export interface RoomPayload {
  name: string;
  location: string;       // was "building" — backend uses "location"
  capacity: number;
  description?: string;
  status?: "tersedia" | "renovasi" | "nonaktif";  // "rusak" is NOT valid — use "renovasi"
  status_note?: string;
}

export const getAdminRoomsApi = async (
  params?: Record<string, unknown>,
): Promise<ApiResponse<Paginated<Room>>> => {
  const res = await axiosClient.get<ApiResponse<Paginated<Room>>>(
    "/admin/rooms",
    { params },
  );
  return res.data;
};

export const createAdminRoomApi = async (
  payload: RoomPayload,
): Promise<ApiResponse<Room>> => {
  const res = await axiosClient.post<ApiResponse<Room>>(
    "/admin/rooms",
    payload,
  );
  return res.data;
};

export const updateAdminRoomApi = async (
  id: string | number,
  payload: Partial<RoomPayload>,
): Promise<ApiResponse<Room>> => {
  const res = await axiosClient.put<ApiResponse<Room>>(
    `/admin/rooms/${id}`,
    payload,
  );
  return res.data;
};

export const patchAdminRoomStatusApi = async (
  id: string | number,
  status: "tersedia" | "renovasi" | "nonaktif",
  status_note?: string,
): Promise<ApiResponse<Room>> => {
  const res = await axiosClient.patch<ApiResponse<Room>>(
    `/admin/rooms/${id}/status`,
    { status, status_note },
  );
  return res.data;
};

export const deleteAdminRoomApi = async (
  id: string | number,
): Promise<ApiResponse<null>> => {
  const res = await axiosClient.delete<ApiResponse<null>>(
    `/admin/rooms/${id}`,
  );
  return res.data;
};

// --- Master Items Admin ---
// Backend routes for /admin/items are fully registered and active.
// Backend DTO: { name (required), category (required), description?, stock_total (required), status?, status_note? }

export interface ItemPayload {
  name: string;
  category: string;        // required by backend binding:"required"
  description?: string;
  stock_total: number;
  status?: "tersedia" | "rusak" | "nonaktif";
  status_note?: string;
}

export const getAdminItemsApi = async (
  params?: Record<string, unknown>,
): Promise<ApiResponse<Paginated<Item>>> => {
  const res = await axiosClient.get<ApiResponse<Paginated<Item>>>(
    "/admin/items",
    { params },
  );
  return res.data;
};

export const createAdminItemApi = async (
  payload: ItemPayload,
): Promise<ApiResponse<Item>> => {
  const res = await axiosClient.post<ApiResponse<Item>>(
    "/admin/items",
    payload,
  );
  return res.data;
};

export const updateAdminItemApi = async (
  id: string | number,
  payload: Partial<ItemPayload>,
): Promise<ApiResponse<Item>> => {
  const res = await axiosClient.put<ApiResponse<Item>>(
    `/admin/items/${id}`,
    payload,
  );
  return res.data;
};

export const patchAdminItemStatusApi = async (
  id: string | number,
  status: "tersedia" | "rusak" | "nonaktif",
  status_note?: string,
): Promise<ApiResponse<Item>> => {
  const res = await axiosClient.patch<ApiResponse<Item>>(
    `/admin/items/${id}/status`,
    { status, status_note },
  );
  return res.data;
};

export const deleteAdminItemApi = async (
  id: string | number,
): Promise<ApiResponse<null>> => {
  const res = await axiosClient.delete<ApiResponse<null>>(
    `/admin/items/${id}`,
  );
  return res.data;
};

// --- Master Lembaga Admin ---
// Backend DTO Create: { name } only — is_active not accepted on create
// Backend DTO Update: { name, is_active? }

export interface LembagaPayload {
  name: string;
  is_active?: boolean;
}

export const getAdminLembagaApi = async (
  params?: Record<string, unknown>,
): Promise<ApiResponse<Paginated<Lembaga>>> => {
  const res = await axiosClient.get<ApiResponse<Paginated<Lembaga>>>(
    "/admin/lembaga",
    { params },
  );
  return res.data;
};

export const createAdminLembagaApi = async (
  payload: LembagaPayload,
): Promise<ApiResponse<Lembaga>> => {
  // Backend only accepts "name" on create
  const res = await axiosClient.post<ApiResponse<Lembaga>>(
    "/admin/lembaga",
    { name: payload.name },
  );
  return res.data;
};

export const updateAdminLembagaApi = async (
  id: string | number,
  payload: Partial<LembagaPayload>,
): Promise<ApiResponse<Lembaga>> => {
  const res = await axiosClient.put<ApiResponse<Lembaga>>(
    `/admin/lembaga/${id}`,
    payload,
  );
  return res.data;
};

export const deleteAdminLembagaApi = async (
  id: string | number,
): Promise<ApiResponse<null>> => {
  const res = await axiosClient.delete<ApiResponse<null>>(
    `/admin/lembaga/${id}`,
  );
  return res.data;
};

// --- Audit Logs & Reports ---

export const getAuditLogsApi = async (
  params?: Record<string, unknown>,
): Promise<ApiResponse<Paginated<AuditLog>>> => {
  const res = await axiosClient.get<ApiResponse<Paginated<AuditLog>>>(
    "/admin/audit-logs",
    { params },
  );
  return res.data;
};

export const exportAuditLogsExcelApi = (params?: Record<string, unknown>) =>
  downloadExcelExport(
    "/admin/audit-logs/export",
    params,
    "audit-logs-luminar.xlsx",
  );

export const getBookingSummaryReportApi = async (
  params?: Record<string, unknown>,
): Promise<ApiResponse<Record<string, unknown>>> => {
  const res = await axiosClient.get<ApiResponse<Record<string, unknown>>>(
    "/admin/reports/room-bookings/summary",
    { params },
  );
  return res.data;
};

export const exportBookingSummaryExcelApi = (
  params?: Record<string, unknown>,
) =>
  downloadExcelExport(
    "/admin/reports/room-bookings/summary/export",
    params,
    "laporan-ringkasan-luminar.xlsx",
  );
