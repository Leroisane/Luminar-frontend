import { create } from "zustand";
import { getProfileApi, logoutApi } from "../api/authService";

export interface AuthUser {
  id?: string | number;
  name: string;
  email: string;
  role: "mahasiswa" | "admin" | string;
  nim?: string;
  phone?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isLoadingProfile: boolean;
  setAuth: (
    user: AuthUser,
    accessToken: string,
    refreshToken?: string | null,
  ) => void;
  syncProfile: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
}

const getStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem("luminar_user");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  token: localStorage.getItem("access_token"),
  refreshToken: localStorage.getItem("refresh_token"),
  isLoadingProfile: false,

  setAuth: (user, accessToken, refreshToken = null) => {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("luminar_user", JSON.stringify(user));
    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
    }
    set((state) => ({
      user,
      token: accessToken,
      refreshToken: refreshToken ?? state.refreshToken,
    }));
  },

  syncProfile: async () => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      set({ user: null, token: null, refreshToken: null });
      return null;
    }

    // Lewati pemanggilan API jika sedang memakai sesi demo staging lokal
    if (accessToken.startsWith("dev-token-")) {
      return getStoredUser();
    }

    set({ isLoadingProfile: true });
    try {
      const res = await getProfileApi();
      // Backend membungkus respons sukses dalam { message, data }
      const profile: AuthUser = res?.data || res;
      localStorage.setItem("luminar_user", JSON.stringify(profile));
      set({ user: profile, token: accessToken, isLoadingProfile: false });
      return profile;
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("luminar_user");
      set({
        user: null,
        token: null,
        refreshToken: null,
        isLoadingProfile: false,
      });
      return null;
    }
  },

  logout: async () => {
    const accessToken = localStorage.getItem("access_token");
    try {
      if (accessToken && !accessToken.startsWith("dev-token-")) {
        await logoutApi();
      }
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("luminar_user");
      set({ user: null, token: null, refreshToken: null });
    }
  },
}));
