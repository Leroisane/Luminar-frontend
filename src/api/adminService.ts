import axiosClient, { downloadExcelExport } from "./axiosClient";

// --- Booking & Workflow Admin ---
export const getAdminBookingStatsApi = async () => {
  const res = await axiosClient.get("/admin/room-bookings/stats");
  return res.data;
};

export const getAdminBookingsApi = async (params?: Record<string, unknown>) => {
  const res = await axiosClient.get("/admin/room-bookings", { params });
  return res.data;
};

export const getAdminBookingDetailApi = async (id: string | number) => {
  const res = await axiosClient.get(`/admin/room-bookings/${id}`);
  return res.data;
};

export const getLetterDraftApi = async (id: string | number) => {
  const res = await axiosClient.get(`/admin/room-bookings/${id}/letter-draft`, {
    responseType: "blob",
  });
  return res.data;
};

export const updateBookingStatusApi = async (
  id: string | number,
  payload: { status: string; note?: string; reason?: string },
) => {
  const res = await axiosClient.post(
    `/admin/room-bookings/${id}/status`,
    payload,
  );
  return res.data;
};

export const uploadFinalLetterApi = async (
  id: string | number,
  file: File,
  fieldName = "file",
) => {
  const formData = new FormData();
  formData.append(fieldName, file);
  const res = await axiosClient.post(
    `/admin/room-bookings/${id}/final-letter`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
};

export const createManualBookingApi = async (
  payload: Record<string, unknown>,
) => {
  const res = await axiosClient.post("/admin/room-bookings", payload);
  return res.data;
};

export const updateAdminBookingApi = async (
  id: string | number,
  payload: Record<string, unknown>,
) => {
  const res = await axiosClient.put(`/admin/room-bookings/${id}`, payload);
  return res.data;
};

export const exportAdminBookingsExcelApi = (params?: Record<string, unknown>) =>
  downloadExcelExport(
    "/admin/room-bookings/export",
    params,
    "rekap-peminjaman-luminar.xlsx",
  );

// --- Master Rooms Admin ---
export const getAdminRoomsApi = async (params?: Record<string, unknown>) => {
  const res = await axiosClient.get("/admin/rooms", { params });
  return res.data;
};

export const createAdminRoomApi = async (payload: Record<string, unknown>) => {
  const res = await axiosClient.post("/admin/rooms", payload);
  return res.data;
};

export const updateAdminRoomApi = async (
  id: string | number,
  payload: Record<string, unknown>,
) => {
  const res = await axiosClient.put(`/admin/rooms/${id}`, payload);
  return res.data;
};

export const patchAdminRoomStatusApi = async (
  id: string | number,
  status: "tersedia" | "rusak" | "nonaktif",
) => {
  const res = await axiosClient.patch(`/admin/rooms/${id}/status`, { status });
  return res.data;
};

export const deleteAdminRoomApi = async (id: string | number) => {
  const res = await axiosClient.delete(`/admin/rooms/${id}`);
  return res.data;
};

// --- Master Items Admin ---
export const getAdminItemsApi = async (params?: Record<string, unknown>) => {
  const res = await axiosClient.get("/admin/items", { params });
  return res.data;
};

export const createAdminItemApi = async (payload: Record<string, unknown>) => {
  const res = await axiosClient.post("/admin/items", payload);
  return res.data;
};

export const updateAdminItemApi = async (
  id: string | number,
  payload: Record<string, unknown>,
) => {
  const res = await axiosClient.put(`/admin/items/${id}`, payload);
  return res.data;
};

export const patchAdminItemStatusApi = async (
  id: string | number,
  status: "tersedia" | "rusak" | "nonaktif",
) => {
  const res = await axiosClient.patch(`/admin/items/${id}/status`, { status });
  return res.data;
};

export const deleteAdminItemApi = async (id: string | number) => {
  const res = await axiosClient.delete(`/admin/items/${id}`);
  return res.data;
};

// --- Master Lembaga Admin ---
export const getAdminLembagaApi = async (params?: Record<string, unknown>) => {
  const res = await axiosClient.get("/admin/lembaga", { params });
  return res.data;
};

export const createAdminLembagaApi = async (
  payload: Record<string, unknown>,
) => {
  const res = await axiosClient.post("/admin/lembaga", payload);
  return res.data;
};

export const updateAdminLembagaApi = async (
  id: string | number,
  payload: Record<string, unknown>,
) => {
  const res = await axiosClient.put(`/admin/lembaga/${id}`, payload);
  return res.data;
};

export const deleteAdminLembagaApi = async (id: string | number) => {
  const res = await axiosClient.delete(`/admin/lembaga/${id}`);
  return res.data;
};

// --- Audit Logs & Reports ---
export const getAuditLogsApi = async (params?: Record<string, unknown>) => {
  const res = await axiosClient.get("/admin/audit-logs", { params });
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
) => {
  const res = await axiosClient.get("/admin/reports/room-bookings/summary", {
    params,
  });
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
