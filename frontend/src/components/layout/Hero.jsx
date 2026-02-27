import React from 'react';
import { motion } from 'framer-motion';

/**
 * ============================================================================
 * HERO COMPONENT (The Dashboard Context)
 * ============================================================================
 * Initially, this was a massive, centered full-screen greeting.
 * As the app matured into a SaaS platform, we refactored it into a 
 * compact 'Dashboard Banner' that provides context without pushing 
 * the listings too far below the fold.
 */
const Hero = ({ user }) => {
  const greeting = user ? `Welcome back, ${user.name}` : "Find your next adventure";
  const subtitle = user 
    ? "Manage your stays and explore new destinations from your traveler dashboard." 
    : "Discover unique homes and experiences around the world.";

  /* --- HISTORICAL STAGE 1: FULL-SCREEN GREETING ---
   * return (
   *   <div style={{ height: '80vh', display: 'flex', alignItems: 'center' }}>
   *     <h1>Travel with AirBnB Lite</h1>
   *   </div>
   * );
   */

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
        
        {/* Decorative Graphic Element */}
        <div style={heroGraphic}>
          <div style={blobStyle} />
        </div>
      </div>
    </div>
  );
};

// --- PREMIUM DASHBOARD STYLES ---
const heroContainer = {
  backgroundColor: '#fff',
  padding: '3rem 4rem 1rem 4rem',
  maxWidth: '2560px',
  margin: '0 auto',
  width: '100%'
};

const heroInner = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid #f0f0f0',
  paddingBottom: '2rem'
};

const greetingStyle = {
  fontSize: '2rem',
  fontWeight: '800',
  margin: 0,
  color: '#222',
  letterSpacing: '-0.02em'
};

const subtitleStyle = {
  fontSize: '1rem',
  color: '#717171',
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
  backgroundColor: '#ff385c',
  borderRadius: '50%',
  filter: 'blur(30px)',
  opacity: 0.4
};

export default Hero;
