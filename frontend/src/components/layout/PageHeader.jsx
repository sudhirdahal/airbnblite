import React from 'react';

/**
 * ============================================================================
 * PAGE HEADER COMPONENT (The Visual Anchor)
 * ============================================================================
 * A reusable UI utility designed to provide immediate context and 
 * high-fidelity typography for top-level navigation pages.
 * 
 * Props:
 * @param {string} title - The primary bold heading.
 * @param {string} subtitle - Supporting description text.
 * @param {LucideIcon} icon - An optional Lucide icon component to render.
 */
const PageHeader = ({ title, subtitle, icon: Icon }) => {
  
  /* --- HISTORICAL STAGE 1: PRIMITIVE HEADER ---
   * return (
   *   <div>
   *     <h1>{title}</h1>
   *     <p>{subtitle}</p>
   *   </div>
   * );
   */

  return (
    <div style={headerContainer}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* ICON RENDERING: Injects the dynamic Lucide icon with theme colors */}
        {Icon && (
          <div style={iconBox}>
            <Icon size={28} color="#ff385c" />
          </div>
        )}
        <div>
          <h1 style={titleStyle}>{title}</h1>
          {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

// --- PREMIUM UTILITY STYLES ---
const headerContainer = {
  marginBottom: '3.5rem',
  paddingBottom: '2rem',
  borderBottom: '1.5px solid #f0f0f0'
};

const iconBox = {
  width: '56px',
  height: '56px',
  backgroundColor: '#fff1f2',
  borderRadius: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};

const titleStyle = {
  fontSize: '2.2rem',
  fontWeight: '800',
  margin: 0,
  color: '#222',
  letterSpacing: '-0.02em'
};

const subtitleStyle = {
  fontSize: '1.05rem',
  color: '#717171',
  margin: '0.4rem 0 0 0',
  fontWeight: '400'
};

export default PageHeader;
