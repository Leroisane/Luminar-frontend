import { axiosClient } from "./axiosClient";

export interface LoginPayload {
  email: string;
  password: string;
}

export const loginApi = async (payload: LoginPayload) => {
  const response = await axiosClient.post("/api/v1/auth/login", payload);
  return response.data;
};

export const getProfileApi = async () => {
  const response = await axiosClient.get("/api/v1/auth/me");
  return response.data;
};

export const logoutApi = async () => {
  const response = await axiosClient.post("/api/v1/auth/logout");
  return response.data;
};