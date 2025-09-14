import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type ColorScheme = 'blue' | 'green' | 'purple' | 'red' | 'orange';

interface ThemeContextType {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

const colorSchemes = {
  blue: {
    primary: '#3B82F6',
    primaryHover: '#2563EB',
    primaryLight: '#DBEAFE',
    primaryDark: '#1E40AF'
  },
  green: {
    primary: '#10B981',
    primaryHover: '#059669',
    primaryLight: '#D1FAE5',
    primaryDark: '#047857'
  },
  purple: {
    primary: '#8B5CF6',
    primaryHover: '#7C3AED',
    primaryLight: '#EDE9FE',
    primaryDark: '#6D28D9'
  },
  red: {
    primary: '#EF4444',
    primaryHover: '#DC2626',
    primaryLight: '#FEE2E2',
    primaryDark: '#B91C1C'
  },
  orange: {
    primary: '#F97316',
    primaryHover: '#EA580C',
    primaryLight: '#FED7AA',
    primaryDark: '#C2410C'
  }
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme-mode');
    return (saved as ThemeMode) || 'system';
  });
  
  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    const saved = localStorage.getItem('color-scheme');
    return (saved as ColorScheme) || 'blue';
  });

  const [isDark, setIsDark] = useState(false);

  // Determine if dark mode should be active
  useEffect(() => {
    const updateDarkMode = () => {
      if (mode === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDark(systemPrefersDark);
      } else {
        setIsDark(mode === 'dark');
      }
    };

    updateDarkMode();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mode === 'system') {
        updateDarkMode();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    const colors = colorSchemes[colorScheme];

    // Apply dark/light class
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply color scheme CSS variables
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-primary-hover', colors.primaryHover);
    root.style.setProperty('--color-primary-light', colors.primaryLight);
    root.style.setProperty('--color-primary-dark', colors.primaryDark);

    // Save to localStorage
    localStorage.setItem('theme-mode', mode);
    localStorage.setItem('color-scheme', colorScheme);
  }, [isDark, colorScheme, mode]);

  const handleSetMode = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  const handleSetColorScheme = (scheme: ColorScheme) => {
    setColorScheme(scheme);
  };

  const toggleMode = () => {
    if (mode === 'light') {
      setMode('dark');
    } else if (mode === 'dark') {
      setMode('system');
    } else {
      setMode('light');
    }
  };

  const value: ThemeContextType = {
    mode,
    colorScheme,
    isDark,
    setMode: handleSetMode,
    setColorScheme: handleSetColorScheme,
    toggleMode
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export { colorSchemes };
export type { ThemeMode, ColorScheme };