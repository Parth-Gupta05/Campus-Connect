import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  theme: 'system',
  setTheme: () => {},
  resolvedTheme: 'dark',
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('zeit-theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  const [resolvedTheme, setResolvedTheme] = useState('dark');

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      const active = theme === 'system' 
        ? (mediaQuery.matches ? 'dark' : 'light') 
        : theme;

      setResolvedTheme(active);

      // Toggle Tailwind dark class
      if (active === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }

      root.setAttribute('data-theme', active);
      root.style.colorScheme = active;

      const favicon = document.querySelector('link[rel="icon"]');
      if (favicon) {
        favicon.type = 'image/png';
        favicon.href = active === 'light'
          ? '/campus-connect-logo-dark.png'
          : '/campus-connect-logo-light.png';
      }

      try {
        localStorage.setItem('zeit-theme', theme);
      } catch (err) {
        console.error('Failed to save theme to localStorage:', err);
      }
    };

    updateTheme();

    if (theme === 'system') {
      mediaQuery.addEventListener('change', updateTheme);
      return () => mediaQuery.removeEventListener('change', updateTheme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
