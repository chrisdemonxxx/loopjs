import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeType = 'obsidian-black' | 'neon-purple' | 'quantum-gold' | 'matrix-green';

interface ThemeColors {
  primary: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  background: string;
  backgroundSecondary: string;
  cardBg: string;
  cardBgHover: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  icon: string;
  name: string;
  description: string;
  // Optional gradient properties for themes that use them
  primaryLight?: string;
  bgGradientFrom?: string;
  bgGradientTo?: string;
  cardGradientFrom?: string;
  cardGradientTo?: string;
  glowColor?: string;
}

const themes: Record<ThemeType, ThemeColors> = {
  'obsidian-black': {
    primary: '#6366f1',
    primaryDark: '#4f46e5',
    secondary: '#8b5cf6',
    accent: '#a78bfa',
    background: '#000000',
    backgroundSecondary: '#0a0a0a',
    cardBg: '#0d0d0d',
    cardBgHover: '#121212',
    textPrimary: '#d4d4d8',
    textSecondary: '#71717a',
    border: 'rgba(113, 113, 122, 0.2)',
    bgGradientFrom: '#000000',
    bgGradientTo: '#0a0a0a',
    cardGradientFrom: '#0d0d0d',
    cardGradientTo: '#121212',
    glowColor: 'rgba(99, 102, 241, 0.15)',
    icon: '◆',
    name: 'Obsidian Black',
    description: 'Ultra dark pure black with minimal violet accents'
  },
  'neon-purple': {
    primary: '#c026d3',
    primaryLight: '#e879f9',
    primaryDark: '#a21caf',
    secondary: '#ec4899',
    accent: '#f97316',
    bgGradientFrom: '#0f0019',
    bgGradientTo: '#1a0528',
    cardGradientFrom: '#1e0a2e',
    cardGradientTo: '#2d1245',
    glowColor: 'rgba(192, 38, 211, 0.4)',
    textPrimary: '#fdf4ff',
    textSecondary: '#e9d5ff',
    border: 'rgba(192, 38, 211, 0.4)',
    icon: '◆',
    name: 'Neon Purple',
    description: 'Electric magenta energy with neon glow'
  },
  'quantum-gold': {
    primary: '#f59e0b',
    primaryLight: '#fbbf24',
    primaryDark: '#d97706',
    secondary: '#eab308',
    accent: '#fb923c',
    bgGradientFrom: '#0c0a03',
    bgGradientTo: '#1a1408',
    cardGradientFrom: '#1f1a0a',
    cardGradientTo: '#2d2410',
    glowColor: 'rgba(245, 158, 11, 0.35)',
    textPrimary: '#fffbeb',
    textSecondary: '#fef3c7',
    border: 'rgba(245, 158, 11, 0.4)',
    icon: '◆',
    name: 'Quantum Gold',
    description: 'Luxury golden particles with premium feel'
  },
  'matrix-green': {
    primary: '#22c55e',
    primaryLight: '#4ade80',
    primaryDark: '#16a34a',
    secondary: '#10b981',
    accent: '#84cc16',
    bgGradientFrom: '#020905',
    bgGradientTo: '#0a1508',
    cardGradientFrom: '#0f1f14',
    cardGradientTo: '#152d1a',
    glowColor: 'rgba(34, 197, 94, 0.3)',
    textPrimary: '#f0fdf4',
    textSecondary: '#bbf7d0',
    border: 'rgba(34, 197, 94, 0.4)',
    icon: '◆',
    name: 'Matrix Green',
    description: 'Digital rain with hacker terminal vibe'
  }
};

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('loopjs-theme');
    return (saved as ThemeType) || 'obsidian-black';
  });

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    localStorage.setItem('loopjs-theme', newTheme);
  };

  useEffect(() => {
    // Apply theme to document root
    const colors = themes[theme];
    document.documentElement.style.setProperty('--theme-primary', colors.primary);
    document.documentElement.style.setProperty('--theme-primary-dark', colors.primaryDark);
    document.documentElement.style.setProperty('--theme-secondary', colors.secondary);
    document.documentElement.style.setProperty('--theme-accent', colors.accent);
    document.documentElement.style.setProperty('--theme-bg', colors.background);
    document.documentElement.style.setProperty('--theme-bg-secondary', colors.backgroundSecondary);
    document.documentElement.style.setProperty('--theme-card-bg', colors.cardBg);
    document.documentElement.style.setProperty('--theme-card-bg-hover', colors.cardBgHover);
    document.documentElement.style.setProperty('--theme-glow', colors.glowColor);
    document.documentElement.style.setProperty('--theme-text-primary', colors.textPrimary);
    document.documentElement.style.setProperty('--theme-text-secondary', colors.textSecondary);
    document.documentElement.style.setProperty('--theme-border', colors.border);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors: themes[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export { themes };
export type { ThemeColors };