export const PROFILE_PRESETS = {
  geist: {
    typography: 'sans',
    pattern: 'none',
    motion: 'subtle',
    tokens: {
      '--profile-bg': 'var(--ds-gray-100)',
      '--profile-card-bg': 'var(--ds-background-100)',
      '--profile-card-border': 'var(--ds-gray-400)',
      '--profile-text': 'var(--ds-gray-1000)',
      '--profile-muted-text': 'var(--ds-gray-700)',
      '--profile-accent': 'var(--ds-gray-1000)',
      '--profile-shadow': '0 1px 2px rgba(0,0,0,0.05)',
      '--profile-radius': '0.75rem',
      '--profile-pattern-opacity': '0'
    }
  },
  editorial: {
    typography: 'serif',
    pattern: 'noise',
    motion: 'subtle',
    tokens: {
      '--profile-bg': '#fcfaf8',
      '--profile-card-bg': '#ffffff',
      '--profile-card-border': '#e5e0d8',
      '--profile-text': '#1a1818',
      '--profile-muted-text': '#6b6661',
      '--profile-accent': '#c44536',
      '--profile-shadow': '0 4px 12px rgba(0,0,0,0.03)',
      '--profile-radius': '0',
      '--profile-pattern-opacity': '0.04'
    },
    darkTokens: {
      '--profile-bg': '#12100f',
      '--profile-card-bg': '#1a1818',
      '--profile-card-border': '#2d2a27',
      '--profile-text': '#f4f1ee',
      '--profile-muted-text': '#9a948e',
      '--profile-accent': '#d86659',
      '--profile-shadow': '0 4px 12px rgba(0,0,0,0.2)',
    }
  },
  research: {
    typography: 'mono',
    pattern: 'blueprint',
    motion: 'none',
    tokens: {
      '--profile-bg': '#f0f4f8',
      '--profile-card-bg': '#ffffff',
      '--profile-card-border': '#cce0f5',
      '--profile-text': '#0f172a',
      '--profile-muted-text': '#64748b',
      '--profile-accent': '#0284c7',
      '--profile-shadow': 'none',
      '--profile-radius': '0.25rem',
      '--profile-pattern-opacity': '0.08'
    },
    darkTokens: {
      '--profile-bg': '#0f172a',
      '--profile-card-bg': '#1e293b',
      '--profile-card-border': '#334155',
      '--profile-text': '#f8fafc',
      '--profile-muted-text': '#94a3b8',
      '--profile-accent': '#38bdf8',
      '--profile-shadow': 'none',
      '--profile-pattern-opacity': '0.15'
    }
  },
  cyber: {
    typography: 'mono',
    pattern: 'circuit',
    motion: 'interactive',
    tokens: {
      '--profile-bg': '#09090b',
      '--profile-card-bg': '#18181b',
      '--profile-card-border': '#27272a',
      '--profile-text': '#fafafa',
      '--profile-muted-text': '#a1a1aa',
      '--profile-accent': '#22d3ee',
      '--profile-shadow': '0 0 15px rgba(34, 211, 238, 0.15)',
      '--profile-radius': '0.5rem',
      '--profile-pattern-opacity': '0.1'
    }
  },
  paper: {
    typography: 'sans',
    pattern: 'paper',
    motion: 'subtle',
    tokens: {
      '--profile-bg': '#f4f1ea',
      '--profile-card-bg': '#fbfaf8',
      '--profile-card-border': '#eaddd0',
      '--profile-text': '#2c2a29',
      '--profile-muted-text': '#8c8580',
      '--profile-accent': '#d97736',
      '--profile-shadow': '0 2px 8px rgba(0,0,0,0.04)',
      '--profile-radius': '0.375rem',
      '--profile-pattern-opacity': '1'
    },
    darkTokens: {
      '--profile-bg': '#1c1b1a',
      '--profile-card-bg': '#262423',
      '--profile-card-border': '#363332',
      '--profile-text': '#e3e1df',
      '--profile-muted-text': '#9e9995',
      '--profile-accent': '#d97736',
      '--profile-shadow': '0 2px 8px rgba(0,0,0,0.2)',
      '--profile-pattern-opacity': '0.3'
    }
  },
  brutalist: {
    typography: 'sans',
    pattern: 'none',
    motion: 'none',
    tokens: {
      '--profile-bg': '#e5e5e5',
      '--profile-card-bg': '#ffffff',
      '--profile-card-border': '#000000',
      '--profile-text': '#000000',
      '--profile-muted-text': '#404040',
      '--profile-accent': '#000000',
      '--profile-shadow': '4px 4px 0px #000000',
      '--profile-radius': '0',
      '--profile-pattern-opacity': '0'
    },
    darkTokens: {
      '--profile-bg': '#121212',
      '--profile-card-bg': '#000000',
      '--profile-card-border': '#ffffff',
      '--profile-text': '#ffffff',
      '--profile-muted-text': '#a3a3a3',
      '--profile-accent': '#ffffff',
      '--profile-shadow': '4px 4px 0px #ffffff',
    }
  },
  organic: {
    typography: 'sans',
    pattern: 'organic',
    motion: 'interactive',
    tokens: {
      '--profile-bg': '#f0fdf4',
      '--profile-card-bg': '#ffffff',
      '--profile-card-border': '#bbf7d0',
      '--profile-text': '#14532d',
      '--profile-muted-text': '#166534',
      '--profile-accent': '#16a34a',
      '--profile-shadow': '0 10px 25px rgba(22, 163, 74, 0.1)',
      '--profile-radius': '2rem',
      '--profile-pattern-opacity': '0.05'
    },
    darkTokens: {
      '--profile-bg': '#0a0f0d',
      '--profile-card-bg': '#111814',
      '--profile-card-border': '#1b3b28',
      '--profile-text': '#f0fdf4',
      '--profile-muted-text': '#86efac',
      '--profile-accent': '#4ade80',
      '--profile-shadow': '0 10px 25px rgba(0, 0, 0, 0.4)',
      '--profile-pattern-opacity': '0.05'
    }
  },
  luxury: {
    typography: 'serif',
    pattern: 'none',
    motion: 'subtle',
    tokens: {
      '--profile-bg': '#111111',
      '--profile-card-bg': '#1a1a1a',
      '--profile-card-border': '#333333',
      '--profile-text': '#f5f5f5',
      '--profile-muted-text': '#888888',
      '--profile-accent': '#d4af37',
      '--profile-shadow': '0 4px 20px rgba(0,0,0,0.4)',
      '--profile-radius': '0.25rem',
      '--profile-pattern-opacity': '0'
    }
  }
};

export const ACCENT_COLORS = {
  default: 'var(--profile-accent)',
  blue: '#3b82f6',
  violet: '#8b5cf6',
  green: '#10b981',
  orange: '#f97316',
  rose: '#f43f5e',
  cyan: '#06b6d4'
};
