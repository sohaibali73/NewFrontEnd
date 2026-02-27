import { useState, useEffect, useRef } from 'react';

interface BreakpointState {
  isMobile: boolean;       // < 768
  isSmallMobile: boolean;  // < 480 (alias kept for auth pages)
  isTablet: boolean;       // 768..1023
  isDesktop: boolean;      // >= 1024
  width: number;
  height: number;
}

function calcBreakpoints(width: number, height: number): BreakpointState {
  return {
    isMobile: width < 768,
    isSmallMobile: width < 480,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    width,
    height,
  };
}

const SSR_DEFAULT: BreakpointState = calcBreakpoints(1200, 800);

export function useResponsive(): BreakpointState {
  const [state, setState] = useState<BreakpointState>(() => {
    if (typeof window === 'undefined') return SSR_DEFAULT;
    return calcBreakpoints(window.innerWidth, window.innerHeight);
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setState(calcBreakpoints(window.innerWidth, window.innerHeight));
      }, 150); // 150ms debounce
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return state;
}

// Helper function to get responsive styles
export function getResponsiveStyles(
  mobile: React.CSSProperties,
  tablet?: React.CSSProperties,
  desktop?: React.CSSProperties
): React.CSSProperties {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
  
  if (width < 768) {
    return mobile;
  } else if (width < 1024 && tablet) {
    return { ...mobile, ...tablet };
  } else if (desktop) {
    return { ...mobile, ...tablet, ...desktop };
  }
  
  return mobile;
}

// Helper function to get responsive padding
export function getResponsivePadding(): string {
  if (typeof window === 'undefined') return '32px';
  const width = window.innerWidth;
  
  if (width < 768) return '16px';
  if (width < 1024) return '24px';
  return '32px';
}

// Helper function to get responsive font size
export function getResponsiveFontSize(desktop: number): number {
  if (typeof window === 'undefined') return desktop;
  const width = window.innerWidth;
  
  if (width < 768) return desktop * 0.75; // 75% on mobile
  if (width < 1024) return desktop * 0.875; // 87.5% on tablet
  return desktop;
}
