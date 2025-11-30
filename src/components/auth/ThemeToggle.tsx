import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '../../store/theme';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, getEffectiveTheme } = useThemeStore();
  const effectiveTheme = getEffectiveTheme();

  const getIcon = () => {
    if (theme === 'system') {
      return <Monitor className="h-5 w-5" style={{ color: effectiveTheme === 'dark' ? 'white' : '#0B1E3F' }} />;
    } else if (theme === 'light') {
      return <Moon className="h-5 w-5 text-[#0B1E3F]" />;
    } else {
      return <Sun className="h-5 w-5 text-white" />;
    }
  };

  const getTitle = () => {
    if (theme === 'system') {
      return `System (${effectiveTheme === 'dark' ? 'Dark' : 'Light'})`;
    } else if (theme === 'light') {
      return 'Light Mode';
    } else {
      return 'Dark Mode';
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-6 right-6 z-50 p-3 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
      aria-label="Toggle theme"
      title={getTitle()}
    >
      {getIcon()}
    </button>
  );
};

