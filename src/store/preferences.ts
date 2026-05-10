import { create } from 'zustand';
import { hasSupabaseConfig, supabase } from '../lib/supabase';

export interface WorkspacePreferences {
  messageAlerts: boolean;
  homeworkAlerts: boolean;
  weeklyReminder: boolean;
  aiHelper: boolean;
  privateWorkspace: boolean;
}

interface PreferencesState {
  preferences: WorkspacePreferences;
  isLoading: boolean;
  error: string | null;
  loadPreferences: (userId?: string) => Promise<void>;
  updatePreferences: (next: Partial<WorkspacePreferences>, userId?: string) => Promise<void>;
}

const defaultPreferences: WorkspacePreferences = {
  messageAlerts: true,
  homeworkAlerts: true,
  weeklyReminder: false,
  aiHelper: true,
  privateWorkspace: true,
};

const toPreferences = (row: any): WorkspacePreferences => ({
  messageAlerts: Boolean(row?.message_alerts),
  homeworkAlerts: Boolean(row?.homework_alerts),
  weeklyReminder: Boolean(row?.weekly_reminder),
  aiHelper: Boolean(row?.ai_helper),
  privateWorkspace: Boolean(row?.private_workspace),
});

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  preferences: defaultPreferences,
  isLoading: false,
  error: null,

  loadPreferences: async (userId?: string) => {
    if (!userId || !hasSupabaseConfig) {
      set({ preferences: defaultPreferences, isLoading: false, error: null });
      return;
    }

    set({ isLoading: true, error: null });
    const { data, error } = await supabase
      .from('user_preferences')
      .select('message_alerts, homework_alerts, weekly_reminder, ai_helper, private_workspace')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }

    if (!data) {
      const { error: insertError } = await supabase.from('user_preferences').insert({ user_id: userId });
      if (insertError) {
        set({ isLoading: false, error: insertError.message });
        return;
      }
      set({ preferences: defaultPreferences, isLoading: false, error: null });
      return;
    }

    set({
      preferences: toPreferences(data),
      isLoading: false,
      error: null,
    });
  },

  updatePreferences: async (next: Partial<WorkspacePreferences>, userId?: string) => {
    const previous = get().preferences;
    const merged = { ...previous, ...next };
    set({ preferences: merged, error: null });

    if (!userId || !hasSupabaseConfig) {
      return;
    }

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        message_alerts: merged.messageAlerts,
        homework_alerts: merged.homeworkAlerts,
        weekly_reminder: merged.weeklyReminder,
        ai_helper: merged.aiHelper,
        private_workspace: merged.privateWorkspace,
      });

    if (error) {
      set({ preferences: previous, error: error.message });
      throw new Error(error.message);
    }
  },
}));
