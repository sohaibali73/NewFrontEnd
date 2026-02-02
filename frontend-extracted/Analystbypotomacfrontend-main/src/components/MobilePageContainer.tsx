import React from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/contexts/ThemeContext';

interface MobilePageContainerProps {
  children: React.ReactNode;
  maxWidth?: string;
  noPadding?: boolean;
}

export function MobilePageContainer({ 
  children, 
  maxWidth = '1400px',
  noPadding = false 
}: MobilePageContainerProps) {
  const { isMobile, isTablet } = useResponsive();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const padding = noPadding ? '0' : (isMobile ? '20px' : (isTablet ? '32px' : '48px'));

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: isDark ? '#121212' : '#ffffff',
      fontFamily: "'Quicksand', sans-serif",
      transition: 'background-color 0.3s ease',
    }}>
      <div style={{
        padding,
        maxWidth,
        margin: '0 auto',
        width: '100%',
      }}>
        {children}
      </div>
    </div>
  );
}

interface MobileSectionProps {
  children: React.ReactNode;
  spacing?: 'tight' | 'normal' | 'loose';
}

export function MobileSection({ children, spacing = 'normal' }: MobileSectionProps) {
  const { isMobile, isTablet } = useResponsive();
  
  const spacingMap = {
    tight: isMobile ? '16px' : (isTablet ? '20px' : '24px'),
    normal: isMobile ? '24px' : (isTablet ? '32px' : '40px'),
    loose: isMobile ? '32px' : (isTablet ? '48px' : '64px'),
  };

  return (
    <div style={{
      marginBottom: spacingMap[spacing],
    }}>
      {children}
    </div>
  );
}

interface MobileGridProps {
  children: React.ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: string;
  minColumnWidth?: string;
}

export function MobileGrid({ 
  children, 
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap,
  minColumnWidth
}: MobileGridProps) {
  const { isMobile, isTablet } = useResponsive();
  
  const getGridColumns = () => {
    if (minColumnWidth) {
      return `repeat(auto-fill, minmax(${minColumnWidth}, 1fr))`;
    }
    
    if (isMobile) return `repeat(${columns.mobile}, 1fr)`;
    if (isTablet) return `repeat(${columns.tablet}, 1fr)`;
    return `repeat(${columns.desktop}, 1fr)`;
  };

  const getGap = () => {
    if (gap) return gap;
    return isMobile ? '16px' : (isTablet ? '20px' : '24px');
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: getGridColumns(),
      gap: getGap(),
    }}>
      {children}
    </div>
  );
}

interface MobileCardProps {
  children: React.ReactNode;
  padding?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  hoverable?: boolean;
}

export function MobileCard({ 
  children, 
  padding = 'medium',
  onClick,
  hoverable = false
}: MobileCardProps) {
  const { isMobile, isTablet } = useResponsive();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const paddingMap = {
    small: isMobile ? '16px' : (isTablet ? '20px' : '24px'),
    medium: isMobile ? '20px' : (isTablet ? '24px' : '28px'),
    large: isMobile ? '24px' : (isTablet ? '32px' : '40px'),
  };

  const colors = {
    cardBg: isDark ? '#1E1E1E' : '#f8f9fa',
    border: isDark ? '#424242' : '#e0e0e0',
    accent: '#FEC00F',
  };

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: isMobile ? '12px' : '16px',
        padding: paddingMap[padding],
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        if (hoverable || onClick) {
          e.currentTarget.style.borderColor = colors.accent;
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable || onClick) {
          e.currentTarget.style.borderColor = colors.border;
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {children}
    </div>
  );
}

interface MobileHeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4;
  spacing?: 'tight' | 'normal' | 'loose';
}

export function MobileHeading({ children, level = 1, spacing = 'normal' }: MobileHeadingProps) {
  const { isMobile, isTablet } = useResponsive();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const getFontSize = () => {
    const sizes = {
      1: { mobile: '28px', tablet: '36px', desktop: '48px' },
      2: { mobile: '22px', tablet: '28px', desktop: '32px' },
      3: { mobile: '18px', tablet: '22px', desktop: '24px' },
      4: { mobile: '16px', tablet: '18px', desktop: '20px' },
    };
    
    const size = sizes[level];
    if (isMobile) return size.mobile;
    if (isTablet) return size.tablet;
    return size.desktop;
  };

  const getMarginBottom = () => {
    const margins = {
      tight: isMobile ? '8px' : '10px',
      normal: isMobile ? '12px' : '16px',
      loose: isMobile ? '16px' : '24px',
    };
    return margins[spacing];
  };

  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <Tag style={{
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: getFontSize(),
      fontWeight: 700,
      color: isDark ? '#FFFFFF' : '#212121',
      marginBottom: getMarginBottom(),
      letterSpacing: level === 1 ? '1.5px' : '1px',
      lineHeight: level === 1 ? 1.2 : 1.3,
      transition: 'color 0.3s ease',
    }}>
      {children}
    </Tag>
  );
}

interface MobileTextProps {
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  muted?: boolean;
  spacing?: 'tight' | 'normal' | 'loose';
}

export function MobileText({ 
  children, 
  size = 'medium', 
  muted = false,
  spacing = 'normal'
}: MobileTextProps) {
  const { isMobile } = useResponsive();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const sizeMap = {
    small: isMobile ? '13px' : '14px',
    medium: isMobile ? '15px' : '16px',
    large: isMobile ? '16px' : '18px',
  };

  const marginMap = {
    tight: '8px',
    normal: '12px',
    loose: '20px',
  };

  return (
    <p style={{
      fontSize: sizeMap[size],
      lineHeight: 1.7,
      color: muted 
        ? (isDark ? '#9E9E9E' : '#757575')
        : (isDark ? '#FFFFFF' : '#212121'),
      marginBottom: marginMap[spacing],
      transition: 'color 0.3s ease',
    }}>
      {children}
    </p>
  );
}

interface MobileButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function MobileButton({ 
  children, 
  onClick,
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  size = 'medium',
}: MobileButtonProps) {
  const { isMobile } = useResponsive();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const sizeMap = {
    small: { padding: isMobile ? '10px 20px' : '10px 24px', fontSize: '14px', height: '44px' },
    medium: { padding: isMobile ? '14px 24px' : '14px 28px', fontSize: '15px', height: '50px' },
    large: { padding: isMobile ? '16px 28px' : '16px 36px', fontSize: '16px', height: '56px' },
  };

  const variantStyles = {
    primary: {
      backgroundColor: '#FEC00F',
      color: '#212121',
      border: 'none',
      boxShadow: '0 4px 12px rgba(254, 192, 15, 0.3)',
    },
    secondary: {
      backgroundColor: 'transparent',
      color: '#FEC00F',
      border: `1px solid ${isDark ? '#424242' : '#e0e0e0'}`,
      boxShadow: 'none',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: isDark ? '#FFFFFF' : '#212121',
      border: 'none',
      boxShadow: 'none',
    },
  };

  const currentSize = sizeMap[size];
  const currentVariant = variantStyles[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: currentSize.padding,
        fontSize: currentSize.fontSize,
        minHeight: currentSize.height,
        width: fullWidth ? '100%' : 'auto',
        fontFamily: "'Rajdhani', sans-serif",
        fontWeight: 700,
        letterSpacing: '0.5px',
        borderRadius: '12px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: disabled ? 0.5 : 1,
        ...currentVariant,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          if (variant === 'primary') {
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(254, 192, 15, 0.4)';
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(0)';
          if (variant === 'primary') {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(254, 192, 15, 0.3)';
          }
        }
      }}
    >
      {children}
    </button>
  );
}
