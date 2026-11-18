import axiosClient, { SERVER_ROOT_URL } from "./axiosClient";

// --- Katalog Ruang, Barang, Lembaga & Slot Waktu ---
export const getRoomsApi = async (params?: Record<string, unknown>) => {
  const res = await axiosClient.get("/rooms", { params });
  return res.data;
};

export const getRoomDetailApi = async (id: string | number) => {
  const res = await axiosClient.get(`/rooms/${id}`);
  return res.data;
};

export const getRoomAvailabilityApi = async (
  id: string | number,
  date: string, // format YYYY-MM-DD
) => {
  const res = await axiosClient.get(`/rooms/${id}/availability`, {
    params: { date },
  });
  return res.data;
};

export const getItemsApi = async (params?: { q?: string; status?: string }) => {
  const res = await axiosClient.get("/items", { params });
  return res.data;
};

export const getItemDetailApi = async (id: string | number) => {
  const res = await axiosClient.get(`/items/${id}`);
  return res.data;
};

export const getLembagaApi = async () => {
  const res = await axiosClient.get("/lembaga");
  return res.data;
};

export const getTimeSlotsConfigApi = async () => {
  const res = await axiosClient.get("/time-slots", {
    baseURL: SERVER_ROOT_URL,
  });
  return res.data;
};

// --- Pengajuan & Riwayat Peminjaman Mahasiswa ---
export const createBookingApi = async (payload: Record<string, unknown>) => {
  const res = await axiosClient.post("/room-bookings", payload);
  return res.data;
};

export const getMyBookingsApi = async (params?: { status?: string }) => {
  const res = await axiosClient.get("/room-bookings/me", { params });
  return res.data;
};

export const getBookingDetailApi = async (id: string | number) => {
  const res = await axiosClient.get(`/room-bookings/${id}`);
  return res.data;
};

export const updateRevisionBookingApi = async (
  id: string | number,
  payload: Record<string, unknown>,
) => {
  const res = await axiosClient.put(`/room-bookings/${id}`, payload);
  return res.data;
};

export const resubmitBookingApi = async (id: string | number) => {
  const res = await axiosClient.post(`/room-bookings/${id}/resubmit`);
  return res.data;
};

export const cancelBookingApi = async (id: string | number) => {
  const res = await axiosClient.post(`/room-bookings/${id}/cancel`);
  return res.data;
};
