import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from './ui/button';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Check local storage or system preference
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
      if (savedTheme) return savedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-10 w-10 rounded-full border border-border/50 bg-background hover:bg-muted/50 transition-all flex items-center justify-center"
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-amber-500 transition-all" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700 transition-all" />
      )}
    </Button>
  );
}
