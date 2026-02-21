import { create } from "zustand";
import { api } from "../api/axios";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,

      register: async (payload) => {
        set({ loading: true });
        try {
          const response = await api.post("/users/register", payload);
          set({ loading: false });
          return response.data;
        } catch (err) {
          set({ loading: false });
          throw err;
        }
      },

      login: async (email, password) => {
        set({ loading: true });
        try {
          const response = await api.post("/users/login", { email, password });
          const { token, user } = response.data;

          // Manually store token for axios interceptor
          localStorage.setItem("token", token);

          set({
            user,
            token,
            isAuthenticated: true,
            loading: false,
          });
        } catch (err) {
          set({ loading: false });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem("token"); // clean up
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
        });
      },

      setUser: (userData) => set({ user: userData }),
    }),
    {
      name: "auth-storage",
      getStorage: () => localStorage,
    },
  ),
);
