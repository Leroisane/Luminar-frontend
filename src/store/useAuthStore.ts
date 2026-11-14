import { create } from "zustand";

export interface AuthUser {
  id?: string;
  name: string;
  nim?: string;
  email: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
  clearAuth: () => void;
}

function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem("auth_user");
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    localStorage.removeItem("auth_user");
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => {
  const initialToken = localStorage.getItem("access_token");
  const initialUser = getStoredUser();

  const handleClear = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("auth_user");
    set({ user: null, token: null, isAuthenticated: false });
  };

  return {
    user: initialUser,
    token: initialToken,
    isAuthenticated: Boolean(initialToken && initialUser),

    setAuth: (user, token) => {
      localStorage.setItem("access_token", token);
      localStorage.setItem("auth_user", JSON.stringify(user));
      set({ user, token, isAuthenticated: true });
    },

    logout: handleClear,
    clearAuth: handleClear,
  };
});
