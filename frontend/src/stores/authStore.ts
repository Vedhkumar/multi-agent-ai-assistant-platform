/**
 * Auth store using Zustand for state management.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../services/api';

interface User {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.login(email, password);
          set({
            user: data.user,
            token: data.access_token,
            refreshToken: data.refresh_token,
            isLoading: false,
          });
        } catch (err: any) {
          set({
            isLoading: false,
            error: err.message || 'Login failed',
          });
          throw err;
        }
      },

      register: async (email: string, username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.register(email, username, password);
          set({
            user: data.user,
            token: data.access_token,
            refreshToken: data.refresh_token,
            isLoading: false,
          });
        } catch (err: any) {
          set({
            isLoading: false,
            error: err.message || 'Registration failed',
          });
          throw err;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          error: null,
        });
      },

      clearError: () => set({ error: null }),

      checkAuth: async () => {
        const token = get().token;
        if (!token) return;
        try {
          const user = await api.getMe();
          set({ user });
        } catch {
          set({ user: null, token: null, refreshToken: null });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
