import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  accentColor: string;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');
  const [accentColor, setAccentColorState] = useState<string>('#FEC00F');

  // Prevent flash of unstyled content on initial load
  useEffect(() => {
    // Add preload class to prevent transitions on initial load
    document.documentElement.classList.add('preload');
    
    // Remove preload class after a short delay to enable smooth transitions
    const timer = setTimeout(() => {
      document.documentElement.classList.remove('preload');
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Load theme and accent color from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('user_settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          if (parsed.appearance?.theme) {
            setThemeState(parsed.appearance.theme as Theme);
          }
          if (parsed.appearance?.accentColor) {
            setAccentColorState(parsed.appearance.accentColor);
          }
        } catch (e) {
          // Failed to parse settings - ignore
        }
      }
    } catch (e) {
      // localStorage access failed - ignore
    }
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    const applyTheme = (isDark: boolean) => {
      // Add transition class for smooth theme changes
      document.documentElement.style.transition = 'background-color 0.3s ease, color 0.3s ease';
      
      if (isDark) {
        document.documentElement.classList.add('dark');
        setResolvedTheme('dark');
      } else {
        document.documentElement.classList.remove('dark');
        setResolvedTheme('light');
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme]);

  // Apply accent color when it changes
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', accentColor);
    document.documentElement.style.setProperty('--accent-text-color', getAccentTextColor(accentColor));
    
    // Also set other accent-related variables for consistency
    document.documentElement.style.setProperty('--accent-hover', adjustColorBrightness(accentColor, 10));
    document.documentElement.style.setProperty('--accent-light', `${accentColor}33`); // 20% opacity
    document.documentElement.style.setProperty('--accent-lighter', `${accentColor}1A`); // 10% opacity
  }, [accentColor]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    // Save to localStorage
    try {
      const savedSettings = localStorage.getItem('user_settings');
      let settings = {};
      if (savedSettings) {
        try {
          settings = JSON.parse(savedSettings);
        } catch (e) {
          // Failed to parse - use empty object
        }
      }
      const updatedSettings = {
        ...settings,
        appearance: {
          ...(settings as any).appearance,
          theme: newTheme,
        },
      };
      localStorage.setItem('user_settings', JSON.stringify(updatedSettings));
    } catch (e) {
      // localStorage access failed - ignore
    }
  };

  const setAccentColor = (color: string) => {
    setAccentColorState(color);
    // Save to localStorage
    try {
      const savedSettings = localStorage.getItem('user_settings');
      let settings = {};
      if (savedSettings) {
        try {
          settings = JSON.parse(savedSettings);
        } catch (e) {
          // Failed to parse - use empty object
        }
      }
      const updatedSettings = {
        ...settings,
        appearance: {
          ...(settings as any).appearance,
          accentColor: color,
        },
      };
      localStorage.setItem('user_settings', JSON.stringify(updatedSettings));
    } catch (e) {
      // localStorage access failed - ignore
    }
  };

  // Helper function to determine if accent color needs dark text
  const getAccentTextColor = (color: string) => {
    // Simple luminance check to determine if text should be dark or light
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);  // ✅ Fixed: use substring instead of substr
    const g = parseInt(hex.substring(2, 4), 16);  // ✅ Fixed: use substring instead of substr
    const b = parseInt(hex.substring(4, 6), 16);  // ✅ Fixed: use substring instead of substr
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance > 140 ? '#212121' : '#FFFFFF';
  };

  // Helper function to adjust color brightness
  const adjustColorBrightness = (color: string, percent: number) => {
    const hex = color.replace('#', '');
    const r = Math.min(255, Math.max(0, parseInt(hex.substring(0, 2), 16) + percent));
    const g = Math.min(255, Math.max(0, parseInt(hex.substring(2, 4), 16) + percent));
    const b = Math.min(255, Math.max(0, parseInt(hex.substring(4, 6), 16) + percent));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, accentColor, setTheme, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}