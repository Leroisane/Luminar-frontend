import { create } from "zustand";
import { getProfileApi } from "../api/authService";
import type { AuthUser } from "../types/api";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isLoadingProfile: boolean;
  /** true jika user yang sedang login adalah admin */
  isAdmin: boolean;
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

export const useAuthStore = create<AuthState>((set) => {
  const storedUser = getStoredUser();
  return {
    user: storedUser,
    token: localStorage.getItem("access_token"),
    refreshToken: localStorage.getItem("refresh_token"),
    isLoadingProfile: false,
    isAdmin: storedUser?.role === "admin",

    setAuth: (user, accessToken, refreshToken = null) => {
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("luminar_user", JSON.stringify(user));
      if (user.id) {
        localStorage.setItem("luminar_user_id", String(user.id));
      }
      if (refreshToken) {
        localStorage.setItem("refresh_token", refreshToken);
      }
      set((state) => ({
        user,
        token: accessToken,
        isAdmin: user.role === "admin",
        refreshToken: refreshToken ?? state.refreshToken,
      }));
    },

    syncProfile: async () => {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        set({ user: null, token: null, refreshToken: null, isAdmin: false });
        return null;
      }

      // Lewati pemanggilan API jika sedang memakai sesi demo staging lokal
      if (accessToken.startsWith("dev-token-")) {
        return getStoredUser();
      }

      set({ isLoadingProfile: true });
      try {
        const res = await getProfileApi();
        const profile: AuthUser = res?.data ?? (res as unknown as AuthUser);
        localStorage.setItem("luminar_user", JSON.stringify(profile));
        if (profile.id) {
          localStorage.setItem("luminar_user_id", String(profile.id));
        }
        set({
          user: profile,
          token: accessToken,
          isAdmin: profile.role === "admin",
          isLoadingProfile: false,
        });
        return profile;
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("luminar_user");
        localStorage.removeItem("luminar_user_id");
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAdmin: false,
          isLoadingProfile: false,
        });
        return null;
      }
    },

    logout: async () => {
      const accessToken = localStorage.getItem("access_token");
      try {
        if (accessToken && !accessToken.startsWith("dev-token-")) {
          const { logoutApi } = await import("../api/authService");
          await logoutApi();
        }
      } finally {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("luminar_user");
        localStorage.removeItem("luminar_user_id");
        set({ user: null, token: null, refreshToken: null, isAdmin: false });
      }
    },
  };
});
