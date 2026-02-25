import React from 'react';
import { motion } from 'framer-motion';

/**
 * PageHeader Component: A professional header for internal pages (Dashboard, Trips, etc.)
 * Replaces basic <h1> tags with a high-fidelity, animated interface.
 */
const PageHeader = ({ title, subtitle, icon: Icon }) => {
  return (
    <div style={containerStyle}>
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        style={contentStyle}
      >
        <div style={titleRowStyle}>
          {Icon && (
            <div style={iconWrapperStyle}>
              <Icon size={24} color="#ff385c" />
            </div>
          )}
          <h1 style={titleStyle}>{title}</h1>
        </div>
        {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
      </motion.div>
      <div style={dividerStyle} />
    </div>
  );
};

// --- STYLES ---
const containerStyle = { marginBottom: '2.5rem', width: '100%' };
const contentStyle = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };
const titleRowStyle = { display: 'flex', alignItems: 'center', gap: '1rem' };
const iconWrapperStyle = { 
  width: '48px', height: '48px', borderRadius: '12px', 
  backgroundColor: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center' 
};
const titleStyle = { fontSize: '2.2rem', fontWeight: '800', margin: 0, color: '#222', letterSpacing: '-0.02em' };
const subtitleStyle = { fontSize: '1rem', color: '#717171', margin: 0, fontWeight: '500' };
const dividerStyle = { height: '1px', backgroundColor: '#eee', marginTop: '1.5rem', width: '100%' };

export default PageHeader;
