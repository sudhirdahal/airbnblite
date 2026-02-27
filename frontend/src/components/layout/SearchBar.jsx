import React, { useState } from 'react';
import { Search, MapPin, Users, Calendar, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ============================================================================
 * SEARCH BAR COMPONENT (The Discovery Controller)
 * ============================================================================
 * This is the primary input layer for the application's search engine.
 * It has evolved from a simple text input to a multi-parameter 
 * filter bar that manages Location, Guests, and Dates.
 * 
 * Logic: Aggregates local input states into a single 'onSearch' 
 * callback that triggers the global API fetch in App.jsx.
 */
const SearchBar = ({ onSearch }) => {
  const [isFocused, setIsHovered] = useState(false);
  const [params, setParams] = useState({
    location: '',
    guests: '',
    amenities: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(params);
  };

  /* --- HISTORICAL STAGE 1: PRIMITIVE SEARCH ---
   * return (
   *   <input 
   *     type="text" 
   *     placeholder="Where are you going?" 
   *     onChange={(e) => onSearch({ location: e.target.value })} 
   *   />
   * );
   */

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
            <MapPin size={16} color="#ff385c" />
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
            <Users size={16} color="#ff385c" />
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
            <Filter size={16} color="#ff385c" />
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
          <Search size={18} color="white" strokeWidth={3} />
        </motion.button>

      </motion.form>
    </div>
  );
};

// --- PREMIUM SEARCH STYLES ---
const searchContainer = {
  padding: '2rem 4rem',
  maxWidth: '2560px',
  margin: '0 auto',
  width: '100%',
  backgroundColor: '#fff',
  position: 'sticky',
  top: '80px', // Sticks below Navbar
  zIndex: 100
};

const searchBarInner = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: '#fff',
  border: '1px solid #ddd',
  borderRadius: '40px',
  padding: '0.5rem 0.5rem 0.5rem 2rem',
  boxShadow: '0 3px 12px rgba(0,0,0,0.08)',
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
  fontWeight: '800',
  color: '#222',
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
  fontSize: '0.9rem',
  color: '#222',
  backgroundColor: 'transparent',
  width: '100%',
  padding: '0.2rem 0'
};

const divider = {
  width: '1px',
  height: '32px',
  backgroundColor: '#eee',
  margin: '0 1.5rem'
};

const searchBtn = {
  backgroundColor: '#ff385c',
  border: 'none',
  borderRadius: '50%',
  width: '48px',
  height: '48px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: '0 4px 10px rgba(255, 56, 92, 0.3)'
};

export default SearchBar;
