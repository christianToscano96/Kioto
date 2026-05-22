import { create } from 'zustand';
import type { Settings } from '../../../shared/src';
import { settingsApi } from '../lib/api';

interface SettingsState {
  settings: Settings | null;
  isLoading: boolean;
  error: string | null;
}

interface SettingsActions {
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Settings) => Promise<void>;
  setSettings: (settings: Settings) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  isLoading: false,
  error: null,

fetchSettings: async () => {
     set({ isLoading: true, error: null });
     try {
       const response = await settingsApi.get();
       set({ settings: response.data });
     } catch (error) {
       const message = error instanceof Error ? error.message : 'Failed to fetch settings';
       set({ error: message });
     } finally {
       set({ isLoading: false });
     }
   },

   updateSettings: async (settings) => {
     set({ isLoading: true, error: null });
     try {
       await settingsApi.update(settings);
       set({ settings });
     } catch (error) {
       const message = error instanceof Error ? error.message : 'Failed to update settings';
       set({ error: message });
       throw error;
     } finally {
       set({ isLoading: false });
     }
   },

  setSettings: (settings) => set({ settings }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));