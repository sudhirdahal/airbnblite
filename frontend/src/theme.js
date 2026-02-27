/**
 * ============================================================================
 * DESIGN TOKEN SYSTEM (The Visual Source of Truth)
 * ============================================================================
 * This module orchestrates the application's entire aesthetic identity.
 * It has evolved from local inline constants into a centralized 'Theme Authority'.
 * 
 * Strategy: Uses Semantic Naming (e.g., 'primary' instead of 'red') 
 * to allow for rapid rebranding and dark-mode scalability.
 */

export const theme = {
  colors: {
    // Brand Identity
    brand: '#ff385c',      // Airbnb Red
    brandDark: '#e31c5f',
    secondary: '#4a148c',  // Host Purple
    
    // Neutrals
    charcoal: '#222222',   // Primary Typography
    slate: '#717171',      // Secondary/Muted Text
    lightGrey: '#f7f7f7',  // Backgrounds
    white: '#ffffff',
    
    // Accents & Feedback
    success: '#16a34a',
    error: '#ef4444',
    border: '#dddddd',
    divider: '#eeeeee'
  },
  
  shadows: {
    sm: '0 2px 8px rgba(0,0,0,0.08)',
    md: '0 6px 16px rgba(0,0,0,0.12)',
    lg: '0 12px 40px rgba(0,0,0,0.15)',
    card: '0 4px 12px rgba(0,0,0,0.05)'
  },
  
  radius: {
    sm: '8px',
    md: '12px',
    lg: '24px',
    full: '50%'
  },
  
  typography: {
    fontFamily: "'Inter', system-ui, sans-serif",
    sizes: {
      xs: '0.75rem',
      sm: '0.85rem',
      base: '1rem',
      lg: '1.25rem',
      xl: '1.5rem',
      xxl: '2rem'
    },
    weights: {
      normal: 400,
      semibold: 600,
      bold: 700,
      extraBold: 800
    }
  },
  
  transitions: {
    standard: 'all 0.2s cubic-bezier(0.2, 1, 0.3, 1)',
    spring: { type: 'spring', stiffness: 400, damping: 10 }
  }
};

/* --- HISTORICAL STAGE 1: HARDCODED CONSTANTS ---
 * Initially, every file defined its own 'red' or 'grey' variables.
 * Problem: Changing the brand color required updating 25+ files!
 */
