import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'hacker-elite' | 'premium-cyber';
type ColorScheme = 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'neon' | 'terminal' | 'blood' | 'matrix-green' | 'cyber-purple' | 'neon-pink' | 'quantum-blue' | 'holographic';

interface ThemeProperties {
  name: string;
  icon: string;
  background: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  borderColor: string;
  animation: string;
  effect: string;
  glassMorphism: boolean;
  glowEffect: boolean;
  particleEffect: boolean;
}

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
  },
  neon: {
    primary: '#00FF41',
    primaryHover: '#00CC33',
    primaryLight: '#80FF99',
    primaryDark: '#00AA2B'
  },
  terminal: {
    primary: '#00FFFF',
    primaryHover: '#00CCCC',
    primaryLight: '#80FFFF',
    primaryDark: '#00AAAA'
  },
  blood: {
    primary: '#FF0040',
    primaryHover: '#CC0033',
    primaryLight: '#FF8099',
    primaryDark: '#AA002B'
  },
  'matrix-green': {
    primary: '#00FF41',
    primaryHover: '#00CC33',
    primaryLight: '#80FF99',
    primaryDark: '#00AA2B'
  },
  'cyber-purple': {
    primary: '#8A2BE2',
    primaryHover: '#6A0DAD',
    primaryLight: '#C9A3FF',
    primaryDark: '#4B0082'
  },
  'neon-pink': {
    primary: '#FF00FF',
    primaryHover: '#CC00CC',
    primaryLight: '#FF80FF',
    primaryDark: '#AA00AA'
  },
  'quantum-blue': {
    primary: '#00FFFF',
    primaryHover: '#00CCCC',
    primaryLight: '#80FFFF',
    primaryDark: '#00AAAA'
  },
  holographic: {
    primary: '#FF6B6B',
    primaryHover: '#FF5252',
    primaryLight: '#FFBABA',
    primaryDark: '#E53935'
  }
};

// Advanced theme properties with unique visual identities
const themeProperties: Record<ThemeMode, ThemeProperties> = {
  light: {
    name: 'Light Premium',
    icon: '☀️',
    background: 'bg-white',
    primaryColor: '#6366f1',
    secondaryColor: '#f8fafc',
    accentColor: '#10b981',
    textColor: '#0f172a',
    borderColor: '#e2e8f0',
    animation: 'none',
    effect: 'none',
    glassMorphism: false,
    glowEffect: false,
    particleEffect: false
  },
  dark: {
    name: 'Dark Premium',
    icon: '🌙',
    background: 'bg-slate-900',
    primaryColor: '#6366f1',
    secondaryColor: '#1e293b',
    accentColor: '#10b981',
    textColor: '#f8fafc',
    borderColor: '#334155',
    animation: 'none',
    effect: 'none',
    glassMorphism: false,
    glowEffect: false,
    particleEffect: false
  },
  'hacker-elite': {
    name: 'Hacker Elite',
    icon: '💚',
    background: 'bg-black',
    primaryColor: '#00ff41',
    secondaryColor: '#0a0a0a',
    accentColor: '#00cc33',
    textColor: '#00ff41',
    borderColor: '#00ff41',
    animation: 'matrix-rain',
    effect: 'terminal-cursor',
    glassMorphism: true,
    glowEffect: true,
    particleEffect: true
  },
  'premium-cyber': {
    name: 'Premium Cyber',
    icon: '🚀',
    background: 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900',
    primaryColor: '#00d4ff',
    secondaryColor: '#1a1a2e',
    accentColor: '#0099cc',
    textColor: '#00d4ff',
    borderColor: '#00d4ff',
    animation: 'cyber-grid',
    effect: 'holographic-display',
    glassMorphism: true,
    glowEffect: true,
    particleEffect: false
  }
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme-mode');
    return (saved as ThemeMode) || 'dark';
  });
  
  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    const saved = localStorage.getItem('color-scheme');
    return (saved as ColorScheme) || 'blue';
  });

  const [isDark, setIsDark] = useState(false);

  // Determine if dark mode should be active
  useEffect(() => {
    const updateDarkMode = () => {
      if (['hacker-elite', 'premium-cyber'].includes(mode)) {
        setIsDark(true); // Hacker themes are always dark
      } else {
        setIsDark(mode === 'dark');
      }
    };

    updateDarkMode();
  }, [mode]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    const colors = colorSchemes[colorScheme];

    // Apply dark/light class for shadcn
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply theme-specific data attributes for shadcn compatibility
    root.setAttribute('data-theme', mode);
    
    // Apply theme-specific classes for existing system
    root.classList.remove('theme-hacker-elite', 'theme-premium-cyber');
    if (['hacker-elite', 'premium-cyber'].includes(mode)) {
      root.classList.add(`theme-${mode}`);
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
    const modes: ThemeMode[] = ['light', 'dark', 'hacker-elite', 'premium-cyber'];
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setMode(modes[nextIndex]);
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

export { colorSchemes, themeProperties };
export type { ThemeMode, ColorScheme };