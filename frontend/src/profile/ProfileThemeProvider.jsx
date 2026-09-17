import React, { createContext, useContext, useMemo } from 'react';
import { PROFILE_PRESETS, ACCENT_COLORS } from '../config/profilePresets';
import { useTheme } from '../context/ThemeContext';

const ProfileThemeContext = createContext();

export const useProfileTheme = () => useContext(ProfileThemeContext);

export const ProfileThemeProvider = ({ customization, children }) => {
  const { theme } = useTheme();
  const { appearance } = customization || {};
  const presetId = appearance?.preset || 'geist';
  const accentId = appearance?.accent || 'default';
  const cardStyle = appearance?.cardStyle || 'default';
  const motion = appearance?.motion || 'subtle';

  const preset = PROFILE_PRESETS[presetId] || PROFILE_PRESETS['geist'];
  const accentColor = ACCENT_COLORS[accentId] || ACCENT_COLORS['default'];

  const themeStyles = useMemo(() => {
    const baseTokens = preset.tokens || {};
    const darkTokens = preset.darkTokens || {};
    const tokens = { ...(theme === 'dark' ? { ...baseTokens, ...darkTokens } : baseTokens) };
    
    // Override accent color if not default
    if (accentId !== 'default') {
      tokens['--profile-accent'] = accentColor;
    }

    // Apply card style modifications
    if (cardStyle === 'glass' || cardStyle === 'soft') {
      tokens['--profile-shadow'] = '0 8px 32px 0 rgba(0, 0, 0, 0.05)';
      tokens['--profile-card-bg'] = 'color-mix(in srgb, var(--profile-card-bg) 50%, transparent)';
      tokens['--profile-backdrop-filter'] = 'blur(16px)';
      tokens['--profile-card-border'] = 'color-mix(in srgb, var(--profile-text) 10%, transparent)';
    } else if (cardStyle === 'outlined') {
      tokens['--profile-shadow'] = 'none';
      tokens['--profile-card-bg'] = 'transparent';
    } else if (cardStyle === 'paper') {
      tokens['--profile-shadow'] = '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)';
      tokens['--profile-radius'] = '0';
    }

    // Generate local SVG patterns
    if (preset.pattern === 'blueprint') {
      tokens['--profile-pattern-url'] = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20z' fill='%23cce0f5' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`;
      tokens['--profile-pattern-size'] = '40px 40px';
    } else if (preset.pattern === 'circuit') {
      tokens['--profile-pattern-url'] = `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='2' fill='%2322d3ee' fill-opacity='0.2'/%3E%3C/svg%3E")`;
      tokens['--profile-pattern-size'] = '20px 20px';
    } else if (preset.pattern === 'noise') {
      tokens['--profile-pattern-url'] = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;
      tokens['--profile-pattern-size'] = '200px 200px';
    } else if (preset.pattern === 'paper') {
      // Warm paper texture
      tokens['--profile-pattern-url'] = `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23a)' opacity='0.05'/%3E%3C/svg%3E")`;
      tokens['--profile-pattern-size'] = '100px 100px';
    } else if (preset.pattern === 'organic') {
      tokens['--profile-pattern-url'] = `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='40' fill='%2316a34a' fill-opacity='0.05'/%3E%3C/svg%3E")`;
      tokens['--profile-pattern-size'] = '100px 100px';
    }

    return tokens;
  }, [preset, accentColor, accentId, cardStyle, theme]);

  const value = {
    presetId,
    typography: preset.typography,
    pattern: preset.pattern,
    motion,
    cardStyle
  };

  // Add the base class for typography and motion
  const baseClasses = `profile-theme-root preset-${presetId} font-${preset.typography} motion-${motion}`;

  return (
    <ProfileThemeContext.Provider value={value}>
      <div 
        className={baseClasses}
        style={themeStyles}
      >
        {children}
      </div>
    </ProfileThemeContext.Provider>
  );
};
