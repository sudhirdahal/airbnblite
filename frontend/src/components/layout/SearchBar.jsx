import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Users, Filter, Plus, Minus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { theme } from '../../theme';
import API from '../../services/api';

/**
 * ============================================================================
 * SEARCH BAR (V3 - THE HIGH-FIDELITY DISCOVERY UPDATE)
 * ============================================================================
 * OVERHAUL: 
 * 1. Location Auto-suggest (Real-time DB lookup).
 * 2. Professional Guest Counter (+/- controls, no negatives).
 * 3. Amenity Multi-select dropdown.
 * 4. Instant-Clear: Reverting to 'All' when input is erased.
 */
const SearchBar = ({ onSearch }) => {
  const [params, setParams] = useState({ location: '', guests: 1, amenities: '' });
  const [metadata, setMetadata] = useState({ locations: [], amenities: [] });
  
  // UI States
  const [showLocationSug, setShowLocationSug] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [showAmenityPicker, setShowAmenityPicker] = useState(false);
  
  const searchBarRef = useRef(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await API.get('/listings/metadata');
        setMetadata(res.data);
      } catch (err) {}
    };
    fetchMetadata();

    // Close dropdowns on outside click
    const handleClickOutside = (e) => {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target)) {
        setShowLocationSug(false); setShowGuestPicker(false); setShowAmenityPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * INSTANT CLEAR LOGIC
   * Logic: If the location field is erased, we proactively trigger
   * an empty search to restore the full listing grid immediately.
   */
  const handleLocationChange = (val) => {
    setParams({ ...params, location: val });
    if (val === '') onSearch({ ...params, location: '' }); // Instant reset
    setShowLocationSug(true);
  };

  const updateGuests = (op) => {
    const newVal = op === 'inc' ? params.guests + 1 : Math.max(1, params.guests - 1);
    setParams({ ...params, guests: newVal });
  };

  const handleSuggestClick = (loc) => {
    setParams({ ...params, location: loc });
    setShowLocationSug(false);
    onSearch({ ...params, location: loc });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(params);
    setShowGuestPicker(false); setShowAmenityPicker(false);
  };

  return (
    <div style={searchContainer} ref={searchBarRef}>
      <motion.form onSubmit={handleSubmit} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={searchBarInner}>
        
        {/* --- LOCATION SEGMENT (With Auto-Suggest) --- */}
        <div style={inputSegment}>
          <label style={labelStyle}>Location</label>
          <div style={fieldWrapper}>
            <MapPin size={16} color={theme.colors.brand} />
            <input 
              type="text" placeholder="Where to?" value={params.location}
              onChange={(e) => handleLocationChange(e.target.value)}
              onFocus={() => setShowLocationSug(true)}
              style={inputStyle} 
            />
          </div>
          <AnimatePresence>
            {showLocationSug && params.location && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={dropdownStyle}>
                {metadata.locations.filter(l => l.toLowerCase().includes(params.location.toLowerCase())).map((loc, i) => (
                  <div key={i} onClick={() => handleSuggestClick(loc)} style={suggestionItem}>{loc}</div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={divider} />

        {/* --- GUEST SEGMENT (With Professional Counter) --- */}
        <div style={inputSegment} onClick={() => setShowGuestPicker(!showGuestPicker)}>
          <label style={labelStyle}>Who</label>
          <div style={fieldWrapper}>
            <Users size={16} color={theme.colors.brand} />
            <div style={{ fontSize: '0.9rem', color: theme.colors.charcoal }}>{params.guests} guests</div>
          </div>
          <AnimatePresence>
            {showGuestPicker && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={dropdownStyle} onClick={e => e.stopPropagation()}>
                <div style={counterRow}>
                  <span style={{ fontWeight: 'bold' }}>Guests</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button type="button" onClick={() => updateGuests('dec')} style={countBtn}><Minus size={14} /></button>
                    <span style={{ width: '20px', textAlign: 'center', fontWeight: 'bold' }}>{params.guests}</span>
                    <button type="button" onClick={() => updateGuests('inc')} style={countBtn}><Plus size={14} /></button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={divider} />

        {/* --- AMENITIES SEGMENT (With Selection List) --- */}
        <div style={inputSegment} onClick={() => setShowAmenityPicker(!showAmenityPicker)}>
          <label style={labelStyle}>Extras</label>
          <div style={fieldWrapper}>
            <Filter size={16} color={theme.colors.brand} />
            <div style={{ fontSize: '0.9rem', color: theme.colors.charcoal, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
              {params.amenities || 'WiFi, Pool...'}
            </div>
          </div>
          <AnimatePresence>
            {showAmenityPicker && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ ...dropdownStyle, width: '250px' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', padding: '0.5rem' }}>
                  {metadata.amenities.map((a, i) => (
                    <div 
                      key={i} onClick={() => setParams({ ...params, amenities: a })}
                      style={{ ...suggestionItem, borderRadius: '8px', fontSize: '0.8rem', border: params.amenities === a ? `1px solid ${theme.colors.brand}` : '1px solid transparent' }}
                    >
                      {a}
                    </div>
                  ))}
                  <div onClick={() => setParams({...params, amenities: ''})} style={{ ...suggestionItem, gridColumn: 'span 2', textAlign: 'center', color: theme.colors.brand, fontWeight: 'bold' }}>Clear Extras</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button type="submit" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={searchBtn}>
          <Search size={18} color={theme.colors.white} strokeWidth={3} />
        </motion.button>

      </motion.form>
    </div>
  );
};

// --- STYLES ---
const searchContainer = { padding: '2rem 4rem', maxWidth: '2560px', margin: '0 auto', width: '100%', backgroundColor: '#fff', position: 'sticky', top: '80px', zIndex: 100 };
const searchBarInner = { display: 'flex', alignItems: 'center', backgroundColor: '#fff', border: `1px solid ${theme.colors.border}`, borderRadius: '40px', padding: '0.5rem 0.5rem 0.5rem 2rem', boxShadow: theme.shadows.card, position: 'relative' };
const inputSegment = { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem', cursor: 'pointer', position: 'relative' };
const labelStyle = { fontSize: '0.7rem', fontWeight: '800', color: theme.colors.charcoal, textTransform: 'uppercase', marginLeft: '1.5rem' };
const fieldWrapper = { display: 'flex', alignItems: 'center', gap: '0.5rem' };
const inputStyle = { border: 'none', outline: 'none', fontSize: '0.9rem', color: theme.colors.charcoal, backgroundColor: 'transparent', width: '100%' };
const divider = { width: '1px', height: '32px', backgroundColor: theme.colors.divider, margin: '0 1.5rem' };
const searchBtn = { backgroundColor: theme.colors.brand, border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: `0 4px 10px rgba(255, 56, 92, 0.3)` };

const dropdownStyle = { position: 'absolute', top: '110%', left: 0, width: '100%', backgroundColor: '#fff', borderRadius: '16px', border: `1px solid ${theme.colors.divider}`, boxShadow: theme.shadows.md, zIndex: 1000, overflow: 'hidden', padding: '0.5rem' };
const suggestionItem = { padding: '0.8rem 1rem', cursor: 'pointer', fontSize: '0.9rem', transition: 'background 0.2s' };
const counterRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' };
const countBtn = { width: '32px', height: '32px', borderRadius: '50%', border: `1px solid ${theme.colors.divider}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };

export default SearchBar;
