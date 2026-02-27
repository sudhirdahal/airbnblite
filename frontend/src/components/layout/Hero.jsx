import React from 'react';
import { motion } from 'framer-motion';
import { theme } from '../../theme'; // --- NEW: THEME AUTHORITY ---

/**
 * ============================================================================
 * HERO COMPONENT (V2 - THE DESIGN TOKEN UPDATE)
 * ============================================================================
 * OVERHAUL: Refactored to consume the centralized Design Token system.
 * This ensures that spacing, typography weights, and accent colors are
 * mathematically consistent with the global Design Language.
 */
const Hero = ({ user }) => {
  const greeting = user ? `Welcome back, ${user.name}` : "Find your next adventure";
  const subtitle = user 
    ? "Manage your stays and explore new destinations from your traveler dashboard." 
    : "Discover unique homes and experiences around the world.";

  return (
    <div style={heroContainer}>
      <div style={heroInner}>
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 style={greetingStyle}>{greeting}</h1>
          <p style={subtitleStyle}>{subtitle}</p>
        </motion.div>
        
        {/* Decorative High-Fidelity Accent */}
        <div style={heroGraphic}>
          <div style={blobStyle} />
        </div>
      </div>
    </div>
  );
};

// --- TOKEN-BASED STYLES ---
const heroContainer = {
  backgroundColor: theme.colors.white,
  padding: '3rem 4rem 1rem 4rem',
  maxWidth: '2560px',
  margin: '0 auto',
  width: '100%'
};

const heroInner = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: `1px solid ${theme.colors.lightGrey}`,
  paddingBottom: '2rem'
};

const greetingStyle = {
  fontSize: theme.typography.sizes.xxl,
  fontWeight: theme.typography.weights.extraBold,
  margin: 0,
  color: theme.colors.charcoal,
  letterSpacing: '-0.02em'
};

const subtitleStyle = {
  fontSize: theme.typography.base,
  color: theme.colors.slate,
  marginTop: '0.5rem',
  maxWidth: '500px'
};

const heroGraphic = {
  position: 'relative',
  width: '100px',
  height: '100px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const blobStyle = {
  width: '60px',
  height: '60px',
  backgroundColor: theme.colors.brand,
  borderRadius: theme.radius.full,
  filter: 'blur(30px)',
  opacity: 0.4
};

export default Hero;
