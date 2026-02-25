import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`切换到${theme === 'light' ? '深色' : '浅色'}模式`}
    >
      {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
}
