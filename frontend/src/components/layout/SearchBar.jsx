import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Users, Filter, Plus, Minus, X, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { theme } from '../../theme';
import API from '../../services/api';
import { useResponsive } from '../../hooks/useResponsive';

/**
 * ============================================================================
 * 🔍 SEARCH BAR (The Discovery Suite)
 * ============================================================================
 * 
 * MASTERCLASS NOTES:
 * The SearchBar is the primary conversion tool. It must handle multi-dimensional 
 * state (Location, Guests, Amenities) while remaining tactile and fast. 
 * 
 * Evolution Timeline:
 * - Phase 1: Simple <input> tag. (No suggestions, no validation).
 * - Phase 10: Server-side Metadata Sync (Auto-suggesting valid locations).
 * - Phase 16: Multi-Dimensional Filter Suite (Pill-based UI).
 * - Phase 22: URL Synchronization (useSearchParams integration).
 * - Phase 27: Multi-Select Toggle Logic for Amenities.
 * - Phase 46: Mobile Convergence (Compact Pill & Full-Screen Overlay).
 */

const SearchBar = ({ onSearch }) => {
  const { isMobile } = useResponsive();
  const [params, setParams] = useState({ location: '', guests: 1, amenities: [] });
  const [metadata, setMetadata] = useState({ locations: [], amenities: [] });
  
  // UI Disclosure States
  const [showLocationSug, setShowLocationSug] = useState(false);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [showAmenityPicker, setShowAmenityPicker] = useState(false);
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);
  
  const searchBarRef = useRef(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await API.get('/listings/metadata');
        setMetadata(res.data);
      } catch (err) {}
    };
    fetchMetadata();

    const handleClickOutside = (e) => {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target)) {
        setShowLocationSug(false); 
        setShowGuestPicker(false); 
        setShowAmenityPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocationChange = (val) => {
    setParams({ ...params, location: val });
    if (val === '') onSearch({ ...params, location: '', amenities: params.amenities.join(',') }); 
    setShowLocationSug(true);
  };

  const updateGuests = (op) => {
    const newVal = op === 'inc' ? params.guests + 1 : Math.max(1, params.guests - 1);
    setParams({ ...params, guests: newVal });
  };

  const handleSuggestClick = (loc) => {
    setParams({ ...params, location: loc });
    setShowLocationSug(false);
    onSearch({ ...params, location: loc, amenities: params.amenities.join(',') }); 
    if (isMobile) setShowMobileOverlay(false);
  };

  const toggleAmenity = (a) => {
    setParams(prev => ({
      ...prev,
      amenities: prev.amenities.includes(a)
        ? prev.amenities.filter(item => item !== a)
        : [...prev.amenities, a]
    }));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const submissionParams = { ...params, amenities: params.amenities.join(',') };
    onSearch(submissionParams); 
    setShowGuestPicker(false); 
    setShowAmenityPicker(false);
    setShowMobileOverlay(false);
  };

  const CompactMobilePill = () => (
    <motion.div 
      onClick={() => setShowMobileOverlay(true)}
      style={mobilePillContainer}
      whileTap={{ scale: 0.98 }}
    >
      <div style={mobilePillInner}>
        <Search size={18} color={theme.colors.brand} strokeWidth={3} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>{params.location || 'Where to?'}</div>
          <div style={{ fontSize: '0.75rem', color: theme.colors.slate }}>
            Anywhere · {params.guests} guest{params.guests > 1 ? 's' : ''}
          </div>
        </div>
        <div style={mobileFilterBtn}><Filter size={16} /></div>
      </div>
    </motion.div>
  );

  return (
    <div style={searchContainer(isMobile)} ref={searchBarRef}>
      {!isMobile ? (
        <motion.form 
          onSubmit={handleSubmit} 
          initial={{ y: -10, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          style={searchBarInner}
        >
          {/* 🗺️ LOCATION SEGMENT */}
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
                  {metadata.locations
                    .filter(l => l.toLowerCase().includes(params.location.toLowerCase()))
                    .map((loc, i) => (
                      <div key={i} onClick={() => handleSuggestClick(loc)} style={suggestionItem}>{loc}</div>
                    ))
                  }
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={divider} />

          {/* 👥 GUEST SEGMENT */}
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
                    <span style={{ fontWeight: 'bold' }}>Adults</span>
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

          {/* 🛁 AMENITIES SEGMENT */}
          <div style={inputSegment} onClick={() => setShowAmenityPicker(!showAmenityPicker)}>
            <label style={labelStyle}>Extras</label>
            <div style={fieldWrapper}>
              <Filter size={16} color={theme.colors.brand} />
              <div style={{ fontSize: '0.9rem', color: theme.colors.charcoal, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
                {params.amenities.length > 0 ? params.amenities.join(', ') : 'WiFi, Pool...'}
              </div>
            </div>
            <AnimatePresence>
              {showAmenityPicker && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ ...dropdownStyle, width: '250px' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', padding: '0.5rem' }}>
                    {metadata.amenities.map((a, i) => (
                      <div 
                        key={i} onClick={() => toggleAmenity(a)}
                        style={{ 
                          ...suggestionItem, 
                          borderRadius: '8px', 
                          fontSize: '0.8rem', 
                          border: params.amenities.includes(a) ? `1px solid ${theme.colors.brand}` : '1px solid transparent',
                          backgroundColor: params.amenities.includes(a) ? '#fff1f2' : 'transparent',
                          color: params.amenities.includes(a) ? theme.colors.brand : 'inherit',
                          fontWeight: params.amenities.includes(a) ? 'bold' : 'normal'
                        }}
                      >
                        {a}
                      </div>
                    ))}
                    <div onClick={() => setParams({...params, amenities: []})} style={{ ...suggestionItem, gridColumn: 'span 2', textAlign: 'center', color: theme.colors.brand, fontWeight: 'bold' }}>Clear All</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button type="submit" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={searchBtn}>
            <Search size={18} color={theme.colors.white} strokeWidth={3} />
          </motion.button>
        </motion.form>
      ) : (
        <CompactMobilePill />
      )}

      {/* 📱 MOBILE SEARCH OVERLAY */}
      <AnimatePresence>
        {showMobileOverlay && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} style={mobileOverlay}>
            <div style={overlayHeader}>
              <button onClick={() => setShowMobileOverlay(false)} style={backBtn}><ChevronLeft size={24} /></button>
              <div style={{ fontWeight: 'bold' }}>Search filters</div>
              <div style={{ width: '24px' }} /> {/* Spacer */}
            </div>
            
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={overlayInputGroup}>
                <label style={labelStyle}>Where to?</label>
                <div style={mobileSearchInputWrapper}>
                  <MapPin size={18} color={theme.colors.brand} />
                  <input 
                    type="text" placeholder="Search destinations" value={params.location} 
                    onChange={e => handleLocationChange(e.target.value)} 
                    style={{ ...inputStyle, fontSize: '1.1rem' }} 
                  />
                </div>
                {params.location && (
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {metadata.locations
                      .filter(l => l.toLowerCase().includes(params.location.toLowerCase()))
                      .slice(0, 4)
                      .map((loc, i) => (
                        <div key={i} onClick={() => handleSuggestClick(loc)} style={refinedTagStyle}>{loc}</div>
                      ))
                    }
                  </div>
                )}
              </div>

              <div style={overlayInputGroup}>
                <label style={labelStyle}>Who's coming?</label>
                <div style={counterRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><Users size={18} color={theme.colors.slate} /> <span style={{ fontWeight: 'bold' }}>Adults</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <button onClick={() => updateGuests('dec')} style={countBtn}><Minus size={16} /></button>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{params.guests}</span>
                    <button onClick={() => updateGuests('inc')} style={countBtn}><Plus size={16} /></button>
                  </div>
                </div>
              </div>

              <div style={overlayInputGroup}>
                <label style={labelStyle}>Extras</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginTop: '0.5rem' }}>
                  {metadata.amenities.map((a, i) => (
                    <div 
                      key={i} onClick={() => toggleAmenity(a)}
                      style={{ 
                        ...suggestionItem, 
                        border: params.amenities.includes(a) ? `1.5px solid ${theme.colors.brand}` : `1px solid ${theme.colors.divider}`,
                        borderRadius: '12px',
                        textAlign: 'center',
                        backgroundColor: params.amenities.includes(a) ? '#fff1f2' : 'white',
                        color: params.amenities.includes(a) ? theme.colors.brand : 'inherit'
                      }}
                    >
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={overlayFooter}>
              <button onClick={() => { setParams({ location: '', guests: 1, amenities: [] }); onSearch({ location: '', guests: 1, amenities: '' }); }} style={clearBtn}>Clear all</button>
              <button onClick={handleSubmit} style={mobileSearchSubmitBtn}><Search size={18} /> Search</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- DESIGN TOKEN STYLES ---
const searchContainer = (isMobile) => ({ padding: isMobile ? '1rem 1.5rem' : '2rem 4rem', maxWidth: '2560px', margin: '0 auto', width: '100%', backgroundColor: '#fff', position: 'sticky', top: '80px', zIndex: 100 });
const searchBarInner = { display: 'flex', alignItems: 'center', backgroundColor: '#fff', border: `1px solid ${theme.colors.divider}`, borderRadius: '40px', padding: '0.5rem 0.5rem 0.5rem 2rem', boxShadow: theme.shadows.card, position: 'relative' };
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

// --- MOBILE OVERLAY STYLES ---
const mobilePillContainer = { backgroundColor: '#fff', border: `1px solid ${theme.colors.divider}`, borderRadius: '30px', padding: '0.6rem 1.2rem', boxShadow: theme.shadows.sm };
const mobilePillInner = { display: 'flex', alignItems: 'center', gap: '1rem' };
const mobileFilterBtn = { width: '36px', height: '36px', borderRadius: '50%', border: `1px solid ${theme.colors.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.colors.charcoal };
const mobileOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#f7f7f7', zIndex: 3000, display: 'flex', flexDirection: 'column' };
const overlayHeader = { padding: '1.2rem', backgroundColor: '#fff', borderBottom: `1px solid ${theme.colors.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const backBtn = { background: 'none', border: 'none', cursor: 'pointer' };
const overlayInputGroup = { backgroundColor: '#fff', padding: '1.5rem', borderRadius: '16px', boxShadow: theme.shadows.sm };
const mobileSearchInputWrapper = { display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem', border: `1px solid ${theme.colors.divider}`, borderRadius: '12px', marginTop: '0.8rem' };
const overlayFooter = { padding: '1.2rem 1.5rem', backgroundColor: '#fff', borderTop: `1px solid ${theme.colors.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' };
const clearBtn = { background: 'none', border: 'none', textDecoration: 'underline', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' };
const mobileSearchSubmitBtn = { backgroundColor: theme.colors.brand, color: '#fff', border: 'none', padding: '0.8rem 2rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' };
const refinedTagStyle = { fontSize: '0.8rem', padding: '0.5rem 1rem', borderRadius: '20px', border: `1px solid ${theme.colors.divider}`, backgroundColor: '#fff', cursor: 'pointer' };

export default SearchBar;
