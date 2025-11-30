import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  getEffectiveTheme: () => 'light' | 'dark';
  getSystemPreference: () => 'light' | 'dark';
}

// Helper function to detect system preference
const getSystemPreference = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Helper function to apply theme to document
const applyTheme = (theme: 'light' | 'dark') => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      getSystemPreference,
      getEffectiveTheme: () => {
        const theme = get().theme;
        if (theme === 'system') {
          return getSystemPreference();
        }
        return theme;
      },
      toggleTheme: () => {
        const currentTheme = get().theme;
        let newTheme: Theme;
        
        // Cycle through: system -> light -> dark -> system
        if (currentTheme === 'system') {
          newTheme = 'light';
        } else if (currentTheme === 'light') {
          newTheme = 'dark';
        } else {
          newTheme = 'system';
        }
        
        set({ theme: newTheme });
        applyTheme(get().getEffectiveTheme());
      },
      setTheme: (theme: Theme) => {
        set({ theme });
        applyTheme(get().getEffectiveTheme());
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        // Apply theme on hydration
        if (state) {
          const effectiveTheme = state.getEffectiveTheme();
          applyTheme(effectiveTheme);
        }
      },
    }
  )
);

// Initialize theme on module load (before React hydration)
if (typeof window !== 'undefined') {
  // Get initial state from localStorage
  const storedTheme = localStorage.getItem('theme-storage');
  let initialTheme: Theme = 'system';
  
  if (storedTheme) {
    try {
      const parsed = JSON.parse(storedTheme);
      initialTheme = parsed.state?.theme || 'system';
    } catch (e) {
      // If parsing fails, use system
      initialTheme = 'system';
    }
  }
  
  // Apply initial theme immediately to prevent flash
  const effectiveTheme = initialTheme === 'system' ? getSystemPreference() : initialTheme;
  applyTheme(effectiveTheme);
} 