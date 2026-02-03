'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type FontSize = 'small' | 'medium' | 'large';

interface FontSizeContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  getFontScale: () => number;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    const saved = localStorage.getItem('font_size');
    return (saved as FontSize) || 'medium';
  });

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem('font_size', size);
    
    // Apply CSS variable
    document.documentElement.style.setProperty('--font-scale', getFontScaleValue(size).toString());
  };

  const getFontScaleValue = (size: FontSize): number => {
    switch (size) {
      case 'small':
        return 0.875; // 87.5%
      case 'large':
        return 1.125; // 112.5%
      default:
        return 1; // 100%
    }
  };

  const getFontScale = () => getFontScaleValue(fontSize);

  // Initialize CSS variable on mount
  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', getFontScale().toString());
  }, []);

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize, getFontScale }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const context = useContext(FontSizeContext);
  if (context === undefined) {
    throw new Error('useFontSize must be used within a FontSizeProvider');
  }
  return context;
}
