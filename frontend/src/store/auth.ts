import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../../../shared/src/index';
import { authApi } from '../lib/api';

interface AuthState {
  user: User | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { email: string; password: string; name?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      // Async actions
login: async (email, password) => {
         set({ isLoading: true, error: null });
         try {
           const response = await authApi.login({ email, password });
           set({ 
             user: response.data.user, 
             refreshToken: response.data.refreshToken,
             isLoading: false 
           });
           return true;
         } catch (error) {
           const message = error instanceof Error ? error.message : 'Login failed';
           set({ error: message, isLoading: false });
           return false;
         }
       },

       register: async (data) => {
         set({ isLoading: true, error: null });
         try {
           const response = await authApi.register(data);
           set({ 
             user: response.data.user, 
             refreshToken: response.data.refreshToken,
             isLoading: false 
           });
           return true;
         } catch (error) {
           const message = error instanceof Error ? error.message : 'Registration failed';
           set({ error: message, isLoading: false });
           return false;
         }
       },

       logout: async () => {
         set({ isLoading: true });
         try {
           // Try to call backend logout
           await authApi.logout();
         } catch {
           // Ignore errors - clear local state anyway
         } finally {
           set({ user: null, refreshToken: null, isLoading: false, error: null });
         }
       },

      fetchCurrentUser: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.me();
          set({ user: response.data.user, isLoading: false });
        } catch (error) {
          // Don't show error for unauthenticated requests
          set({ user: null, isLoading: false });
        }
      },

      // Local actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

// Selectors for optimal re-renders
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => !!state.user);
export const useIsAdmin = () => useAuthStore((state) => state.user?.role === 'admin');
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);