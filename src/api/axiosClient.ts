import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ApiResponse } from "../types/api";

// Contoh VITE_API_BASE_URL: http://localhost:8080/api/v1 atau https://xxxx.ngrok-free.app/api/v1
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

// Root URL tanpa /api/v1 (khusus endpoint sistem seperti /health dan /time-slots)
export const SERVER_ROOT_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// Sisipkan access_token di setiap request yang terproteksi
axiosClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Antrean request saat proses refresh token sedang berjalan
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else if (token) prom.resolve(token);
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: string; message?: string }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        localStorage.removeItem("access_token");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (newToken: string) => {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(axiosClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        const newAccess =
          res.data?.data?.access_token || res.data?.access_token;
        const newRefresh =
          res.data?.data?.refresh_token || res.data?.refresh_token;

        if (!newAccess) throw new Error("Refresh token gagal");

        localStorage.setItem("access_token", newAccess);
        if (newRefresh) localStorage.setItem("refresh_token", newRefresh);

        processQueue(null, newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return axiosClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// Helper ekstrak pesan error dari response backend
export function getApiErrorMessage(err: unknown): string {
  const axiosErr = err as AxiosError<{ error?: string; message?: string }>;
  const status = axiosErr?.response?.status;
  const serverErr =
    axiosErr?.response?.data?.error || axiosErr?.response?.data?.message;

  if (serverErr) return serverErr;
  if (status === 403) return "Akses ditolak (Forbidden).";
  if (status === 404) return "Data tidak ditemukan (404).";
  if (status === 429) return "Terlalu banyak permintaan. Tunggu sebentar.";
  return "Gagal terhubung ke server Luminar.";
}

// Generic wrapper – mengembalikan { data, error } alih-alih throw
export async function apiRequest<T>(
  fn: () => Promise<{ data: ApiResponse<T> | T }>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fn();
    // Handle both wrapped { data: { data: T } } and unwrapped { data: T }
    const payload = (res as { data: ApiResponse<T> }).data;
    const result =
      payload && typeof payload === "object" && "data" in payload
        ? (payload as ApiResponse<T>).data
        : (payload as T);
    return { data: result, error: null };
  } catch (e) {
    return { data: null, error: getApiErrorMessage(e) };
  }
}

// Helper unduh Excel (.xlsx) dari endpoint .../export
export async function downloadExcelExport(
  endpoint: string,
  params?: Record<string, unknown>,
  fallbackFilename = "export-luminar.xlsx",
) {
  const res = await axiosClient.get(endpoint, {
    params,
    responseType: "blob",
  });

  const disposition = res.headers["content-disposition"] as string | undefined;
  const match = disposition?.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] || fallbackFilename;

  const url = window.URL.createObjectURL(new Blob([res.data as BlobPart]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export const api = axiosClient;
export default axiosClient;
