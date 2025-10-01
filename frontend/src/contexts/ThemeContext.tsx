import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'system' | 'hacker' | 'matrix' | 'cyberpunk' | 'redteam' | 'neon-city' | 'ghost-protocol' | 'quantum' | 'neural-net' | 'dark-web' | 'glass' | 'hologram';
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
    name: 'Light Mode',
    icon: '☀️',
    background: 'bg-white',
    primaryColor: '#3B82F6',
    secondaryColor: '#F3F4F6',
    accentColor: '#10B981',
    textColor: '#1F2937',
    borderColor: '#E5E7EB',
    animation: 'none',
    effect: 'none',
    glassMorphism: false,
    glowEffect: false,
    particleEffect: false
  },
  dark: {
    name: 'Dark Mode',
    icon: '🌙',
    background: 'bg-gray-900',
    primaryColor: '#3B82F6',
    secondaryColor: '#1F2937',
    accentColor: '#10B981',
    textColor: '#F9FAFB',
    borderColor: '#374151',
    animation: 'none',
    effect: 'none',
    glassMorphism: false,
    glowEffect: false,
    particleEffect: false
  },
  system: {
    name: 'System Default',
    icon: '⚙️',
    background: 'bg-gray-100 dark:bg-gray-900',
    primaryColor: '#3B82F6',
    secondaryColor: '#F3F4F6 dark:bg-gray-800',
    accentColor: '#10B981',
    textColor: '#1F2937 dark:text-gray-100',
    borderColor: '#E5E7EB dark:border-gray-700',
    animation: 'none',
    effect: 'none',
    glassMorphism: false,
    glowEffect: false,
    particleEffect: false
  },
  hacker: {
    name: 'Classic Hacker',
    icon: '💚',
    background: 'bg-gradient-to-br from-black via-green-900 to-black',
    primaryColor: '#00FF41',
    secondaryColor: '#001100',
    accentColor: '#00CC33',
    textColor: '#00FF41',
    borderColor: '#00FF41/30',
    animation: 'matrix-rain',
    effect: 'terminal-cursor',
    glassMorphism: true,
    glowEffect: true,
    particleEffect: true
  },
  matrix: {
    name: 'Matrix Rain',
    icon: '🔋',
    background: 'bg-gradient-to-br from-black via-#001a00 to-#000d00',
    primaryColor: '#00FF41',
    secondaryColor: '#001a00',
    accentColor: '#00CC33',
    textColor: '#00FF41',
    borderColor: '#00FF41/40',
    animation: 'matrix-rain-intense',
    effect: 'digital-rain',
    glassMorphism: true,
    glowEffect: true,
    particleEffect: true
  },
  cyberpunk: {
    name: 'Cyberpunk 2077',
    icon: '🌆',
    background: 'bg-gradient-to-br from-#0f0f23 via-#1a1a2e to-#16213e',
    primaryColor: '#FF00FF',
    secondaryColor: '#1a1a2e',
    accentColor: '#00FFFF',
    textColor: '#FF00FF',
    borderColor: '#FF00FF/40',
    animation: 'neon-pulse',
    effect: 'cyber-grid',
    glassMorphism: true,
    glowEffect: true,
    particleEffect: false
  },
  redteam: {
    name: 'Red Team',
    icon: '🔴',
    background: 'bg-gradient-to-br from-#200000 via-#400000 to-#200000',
    primaryColor: '#FF0040',
    secondaryColor: '#400000',
    accentColor: '#FF6B6B',
    textColor: '#FF0040',
    borderColor: '#FF0040/40',
    animation: 'pulse-red',
    effect: 'blood-splatter',
    glassMorphism: true,
    glowEffect: true,
    particleEffect: true
  },
  'neon-city': {
    name: 'Neon City',
    icon: '🏙️',
    background: 'bg-gradient-to-br from-#0a0a0a via-#1a0a2e to-#16213e',
    primaryColor: '#00FFFF',
    secondaryColor: '#1a0a2e',
    accentColor: '#FF00FF',
    textColor: '#00FFFF',
    borderColor: '#00FFFF/40',
    animation: 'neon-flicker',
    effect: 'city-lights',
    glassMorphism: true,
    glowEffect: true,
    particleEffect: true
  },
  'ghost-protocol': {
    name: 'Ghost Protocol',
    icon: '👻',
    background: 'bg-gradient-to-br from-#000000 via-#1a1a1a to-#2d2d2d',
    primaryColor: '#FFFFFF',
    secondaryColor: '#1a1a1a',
    accentColor: '#E0E0E0',
    textColor: '#FFFFFF',
    borderColor: '#FFFFFF/30',
    animation: 'ghost-fade',
    effect: 'stealth-mode',
    glassMorphism: true,
    glowEffect: false,
    particleEffect: false
  },
  quantum: {
    name: 'Quantum Realm',
    icon: '⚛️',
    background: 'bg-gradient-to-br from-#0d1421 via-#1a252f to-#2d3748',
    primaryColor: '#64FFDA',
    secondaryColor: '#1a252f',
    accentColor: '#00BFA5',
    textColor: '#64FFDA',
    borderColor: '#64FFDA/40',
    animation: 'quantum-fluctuate',
    effect: 'particle-wave',
    glassMorphism: true,
    glowEffect: true,
    particleEffect: true
  },
  'neural-net': {
    name: 'Neural Network',
    icon: '🧠',
    background: 'bg-gradient-to-br from-#1a1a2e via-#16213e to-#0f3460',
    primaryColor: '#E94560',
    secondaryColor: '#16213e',
    accentColor: '#F67280',
    textColor: '#E94560',
    borderColor: '#E94560/40',
    animation: 'neural-pulse',
    effect: 'synapse-connections',
    glassMorphism: true,
    glowEffect: true,
    particleEffect: true
  },
  'dark-web': {
    name: 'Dark Web',
    icon: '🕸️',
    background: 'bg-gradient-to-br from-#000000 via-#1c1c1c to-#383838',
    primaryColor: '#FF6B6B',
    secondaryColor: '#1c1c1c',
    accentColor: '#FF5252',
    textColor: '#FF6B6B',
    borderColor: '#FF6B6B/40',
    animation: 'spider-crawl',
    effect: 'web-network',
    glassMorphism: false,
    glowEffect: true,
    particleEffect: true
  },
  glass: {
    name: 'Glass Morphism',
    icon: '🔮',
    background: 'bg-gradient-to-br from-rgba(255,255,255,0.1) via-rgba(255,255,255,0.05) to-rgba(255,255,255,0.1)',
    primaryColor: '#FFFFFF',
    secondaryColor: 'rgba(255,255,255,0.1)',
    accentColor: '#E0E0E0',
    textColor: '#FFFFFF',
    borderColor: 'rgba(255,255,255,0.2)',
    animation: 'none',
    effect: 'frosted-glass',
    glassMorphism: true,
    glowEffect: false,
    particleEffect: false
  },
  hologram: {
    name: 'Holographic',
    icon: '🌈',
    background: 'bg-gradient-to-br from-#000428 via-#004e92 to-#000428',
    primaryColor: '#00D4FF',
    secondaryColor: '#004e92',
    accentColor: '#00B8D4',
    textColor: '#00D4FF',
    borderColor: '#00D4FF/40',
    animation: 'hologram-shimmer',
    effect: 'holographic-display',
    glassMorphism: true,
    glowEffect: true,
    particleEffect: true
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
      } else if (['hacker', 'matrix', 'cyberpunk', 'redteam'].includes(mode)) {
        setIsDark(true); // Hacker themes are always dark
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

    // Apply theme-specific classes
    root.classList.remove('theme-hacker', 'theme-matrix', 'theme-cyberpunk', 'theme-redteam');
    if (['hacker', 'matrix', 'cyberpunk', 'redteam'].includes(mode)) {
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
    const modes: ThemeMode[] = ['light', 'dark', 'hacker', 'matrix', 'cyberpunk', 'redteam', 'system'];
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