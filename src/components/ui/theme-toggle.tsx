
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    setTheme(initialTheme);
    applyTheme(initialTheme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        setTheme(newTheme);
        applyTheme(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const applyTheme = (newTheme: 'light' | 'dark') => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add new theme class
    root.classList.add(newTheme);
    
    // Also set data attribute for compatibility
    root.setAttribute('data-theme', newTheme);
    
    // Force update body styles
    document.body.style.backgroundColor = newTheme === 'dark' 
      ? 'hsl(0 0% 0%)' 
      : 'hsl(255 255 255)';
    document.body.style.color = newTheme === 'dark' 
      ? 'hsl(255 255 255)' 
      : 'hsl(0 0% 0%)';
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
    
    // Force re-render of components by triggering a custom event
    window.dispatchEvent(new CustomEvent('theme-change', { detail: newTheme }));
  };

  // Don't render on server-side
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 rounded-lg border border-border bg-background hover:bg-accent transition-colors"
      >
        <div className="h-5 w-5" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-10 w-10 rounded-lg border border-border bg-background hover:bg-accent transition-colors"
      style={{
        backgroundColor: 'hsl(var(--background))',
        borderColor: 'hsl(var(--border))',
        color: 'hsl(var(--foreground))'
      }}
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5" style={{ color: 'hsl(var(--foreground))' }} />
      ) : (
        <Sun className="h-5 w-5" style={{ color: 'hsl(var(--foreground))' }} />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};
