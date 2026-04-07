import { create } from "zustand";

type AuthState = {
  token: string | null;
  setToken: (t: string | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("access_token"),
  setToken: (t) => {
    if (t) localStorage.setItem("access_token", t);
    else localStorage.removeItem("access_token");
    set({ token: t });
  },
}));
