import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function BrandLogo({ className = '', alt = 'Campus Connect' }) {
  const { resolvedTheme } = useTheme();
  const logoSrc = resolvedTheme === 'light'
    ? '/campus-connect-logo-dark.png'
    : '/campus-connect-logo-light.png';

  return (
    <img
      src={logoSrc}
      alt={alt}
      className={`object-contain ${className}`}
    />
  );
}
