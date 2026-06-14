import { create } from 'zustand';
import { hasSupabaseConfig, supabase } from '../lib/supabase';

const DEMO_PREFS_KEY = 'skillstream_demo_prefs_v1';
const isDemoId = (userId: string) => userId.startsWith('demo-');

const getStoredDemoPrefs = (userId: string): Partial<WorkspacePreferences> | null => {
  try {
    const raw = window.localStorage.getItem(`${DEMO_PREFS_KEY}_${userId}`);
    return raw ? (JSON.parse(raw) as Partial<WorkspacePreferences>) : null;
  } catch {
    return null;
  }
};

const persistDemoPrefs = (userId: string, prefs: WorkspacePreferences) => {
  try {
    window.localStorage.setItem(`${DEMO_PREFS_KEY}_${userId}`, JSON.stringify(prefs));
  } catch {
    // ignore quota errors
  }
};

export interface WorkspacePreferences {
  messageAlerts: boolean;
  homeworkAlerts: boolean;
  weeklyReminder: boolean;
  privateWorkspace: boolean;
  studentTheme: string;
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
  privateWorkspace: true,
  studentTheme: 'navy',
};

type PreferencesRow = {
  message_alerts: boolean | null;
  homework_alerts: boolean | null;
  weekly_reminder: boolean | null;
  private_workspace: boolean | null;
  student_theme: string | null;
};

const toPreferences = (row: PreferencesRow): WorkspacePreferences => ({
  messageAlerts: Boolean(row?.message_alerts),
  homeworkAlerts: Boolean(row?.homework_alerts),
  weeklyReminder: Boolean(row?.weekly_reminder),
  privateWorkspace: Boolean(row?.private_workspace),
  studentTheme: (row?.student_theme as string) || 'navy',
});

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  preferences: defaultPreferences,
  isLoading: false,
  error: null,

  loadPreferences: async (userId?: string) => {
    if (!userId) {
      set({ preferences: defaultPreferences, isLoading: false, error: null });
      return;
    }

    if (isDemoId(userId)) {
      const stored = getStoredDemoPrefs(userId);
      set({ preferences: stored ? { ...defaultPreferences, ...stored } : defaultPreferences, isLoading: false, error: null });
      return;
    }

    if (!hasSupabaseConfig) {
      set({ preferences: defaultPreferences, isLoading: false, error: null });
      return;
    }

    set({ isLoading: true, error: null });
    const { data, error } = await supabase
      .from('user_preferences')
      .select('message_alerts, homework_alerts, weekly_reminder, private_workspace, student_theme')
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

    if (!userId) return;

    if (isDemoId(userId)) {
      persistDemoPrefs(userId, merged);
      return;
    }

    if (!hasSupabaseConfig) return;

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        message_alerts: merged.messageAlerts,
        homework_alerts: merged.homeworkAlerts,
        weekly_reminder: merged.weeklyReminder,
        private_workspace: merged.privateWorkspace,
        student_theme: merged.studentTheme,
      });

    if (error) {
      set({ preferences: previous, error: error.message });
      throw new Error(error.message);
    }
  },
}));
