import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/theme';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-6 right-6 z-50 p-3 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5 text-[#0B1E3F]" />
      ) : (
        <Sun className="h-5 w-5 text-white" />
      )}
    </button>
  );
};

