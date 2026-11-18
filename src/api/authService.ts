import axiosClient from "./axiosClient";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  nim?: string;
  phone?: string;
}

export const loginApi = async (payload: LoginPayload) => {
  const res = await axiosClient.post("/auth/login", payload);
  return res.data;
};

export const registerApi = async (payload: RegisterPayload) => {
  const res = await axiosClient.post("/auth/register", payload);
  return res.data;
};

export const refreshTokenApi = async (refreshToken: string) => {
  const res = await axiosClient.post("/auth/refresh", {
    refresh_token: refreshToken,
  });
  return res.data;
};

export const logoutApi = async () => {
  try {
    await axiosClient.post("/auth/logout");
  } finally {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }
};

export const getProfileApi = async () => {
  const res = await axiosClient.get("/auth/me");
  return res.data;
};

export const updateProfileApi = async (payload: Record<string, unknown>) => {
  const res = await axiosClient.put("/profile", payload);
  return res.data;
};
