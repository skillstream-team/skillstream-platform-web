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

  const getLabel = () => {
    if (theme === 'system') return 'System';
    if (theme === 'light') return 'Light';
    return 'Dark';
  };

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-6 right-6 z-50 flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border border-gray-200/60 dark:border-gray-700/60 shadow-md hover:shadow-lg transition-all duration-200"
      aria-label="Toggle theme"
      title={getTitle()}
    >
      {getIcon()}
      <span className="text-xs font-semibold" style={{ color: effectiveTheme === 'dark' ? 'white' : '#0B1E3F' }}>
        {getLabel()}
      </span>
    </button>
  );
};

