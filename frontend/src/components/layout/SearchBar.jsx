import React, { useState } from 'react';
import { Search, MapPin, Users, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { theme } from '../../theme'; // --- NEW: THEME AUTHORITY ---

/**
 * ============================================================================
 * SEARCH BAR COMPONENT (V2 - THE DESIGN TOKEN UPDATE)
 * ============================================================================
 * OVERHAUL: Refactored to consume the centralized Design Token system.
 * This ensures that input radii, brand accents, and shadows are perfectly
 * synchronized with the application's global SaaS identity.
 */
const SearchBar = ({ onSearch }) => {
  const [params, setParams] = useState({
    location: '',
    guests: '',
    amenities: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(params);
  };

  return (
    <div style={searchContainer}>
      <motion.form 
        onSubmit={handleSubmit}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        whileHover={{ scale: 1.01 }}
        style={searchBarInner}
      >
        {/* --- LOCATION SEGMENT --- */}
        <div style={inputSegment}>
          <label style={labelStyle}>Location</label>
          <div style={fieldWrapper}>
            <MapPin size={16} color={theme.colors.brand} />
            <input 
              type="text" 
              placeholder="Search destinations" 
              value={params.location}
              onChange={(e) => setParams({...params, location: e.target.value})}
              style={inputStyle} 
            />
          </div>
        </div>

        <div style={divider} />

        {/* --- GUEST SEGMENT --- */}
        <div style={inputSegment}>
          <label style={labelStyle}>Who</label>
          <div style={fieldWrapper}>
            <Users size={16} color={theme.colors.brand} />
            <input 
              type="number" 
              placeholder="Add guests" 
              value={params.guests}
              onChange={(e) => setParams({...params, guests: e.target.value})}
              style={inputStyle} 
            />
          </div>
        </div>

        <div style={divider} />

        {/* --- AMENITIES SEGMENT --- */}
        <div style={inputSegment}>
          <label style={labelStyle}>Extras</label>
          <div style={fieldWrapper}>
            <Filter size={16} color={theme.colors.brand} />
            <input 
              type="text" 
              placeholder="WiFi, Pool, etc." 
              value={params.amenities}
              onChange={(e) => setParams({...params, amenities: e.target.value})}
              style={inputStyle} 
            />
          </div>
        </div>

        {/* --- SUBMIT ACTION --- */}
        <motion.button 
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={searchBtn}
        >
          <Search size={18} color={theme.colors.white} strokeWidth={3} />
        </motion.button>

      </motion.form>
    </div>
  );
};

// --- TOKEN-BASED STYLES ---
const searchContainer = {
  padding: '2rem 4rem',
  maxWidth: '2560px',
  margin: '0 auto',
  width: '100%',
  backgroundColor: theme.colors.white,
  position: 'sticky',
  top: '80px',
  zIndex: 100
};

const searchBarInner = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: theme.colors.white,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: '40px', // Specialized search pill radius
  padding: '0.5rem 0.5rem 0.5rem 2rem',
  boxShadow: theme.shadows.card,
  cursor: 'pointer'
};

const inputSegment = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.2rem'
};

const labelStyle = {
  fontSize: '0.75rem',
  fontWeight: theme.typography.weights.extraBold,
  color: theme.colors.charcoal,
  textTransform: 'uppercase',
  marginLeft: '1.5rem'
};

const fieldWrapper = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const inputStyle = {
  border: 'none',
  outline: 'none',
  fontSize: theme.typography.sizes.sm,
  color: theme.colors.charcoal,
  backgroundColor: 'transparent',
  width: '100%',
  padding: '0.2rem 0'
};

const divider = {
  width: '1px',
  height: '32px',
  backgroundColor: theme.colors.divider,
  margin: '0 1.5rem'
};

const searchBtn = {
  backgroundColor: theme.colors.brand,
  border: 'none',
  borderRadius: theme.radius.full,
  width: '48px',
  height: '48px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: `0 4px 10px rgba(255, 56, 92, 0.3)`
};

export default SearchBar;
