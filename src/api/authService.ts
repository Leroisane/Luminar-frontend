import axiosClient from "./axiosClient";
import type { ApiResponse, AuthUser, LoginResponseData } from "../types/api";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
  nim?: string;
  phone?: string;
  program_studi?: string;
}

export const loginApi = async (
  payload: LoginPayload,
): Promise<ApiResponse<LoginResponseData>> => {
  const res = await axiosClient.post<ApiResponse<LoginResponseData>>(
    "/auth/login",
    payload,
  );
  return res.data;
};

export const registerApi = async (
  payload: RegisterPayload,
): Promise<ApiResponse<{ user: AuthUser }>> => {
  const res = await axiosClient.post<ApiResponse<{ user: AuthUser }>>(
    "/auth/register",
    payload,
  );
  return res.data;
};

export const refreshTokenApi = async (
  refreshToken: string,
): Promise<ApiResponse<{ access_token: string; refresh_token?: string }>> => {
  const res = await axiosClient.post<
    ApiResponse<{ access_token: string; refresh_token?: string }>
  >("/auth/refresh", { refresh_token: refreshToken });
  return res.data;
};

export const logoutApi = async (): Promise<void> => {
  try {
    await axiosClient.post("/auth/logout");
  } finally {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }
};

export const getProfileApi = async (): Promise<ApiResponse<AuthUser>> => {
  const res = await axiosClient.get<ApiResponse<AuthUser>>("/auth/me");
  return res.data;
};

export const updateProfileApi = async (
  payload: Partial<Pick<AuthUser, "name" | "phone">>,
): Promise<ApiResponse<AuthUser>> => {
  const res = await axiosClient.put<ApiResponse<AuthUser>>("/profile", payload);
  return res.data;
};
