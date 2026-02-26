import React, { useState } from 'react';
import { Search, MapPin, Calendar, Users, X, Filter, Wifi, Utensils, Waves, Car, Tv } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SearchBar Component: Now features an Advanced Amenity Filter.
 */
const SearchBar = ({ onSearch }) => {
  const [params, setParams] = useState({
    location: '', checkInDate: '', checkOutDate: '', guests: '', amenities: []
  });
  const [showFilters, setShowFilters] = useState(false);

  const availableAmenities = [
    { id: 'WiFi', icon: Wifi },
    { id: 'Kitchen', icon: Utensils },
    { id: 'Pool', icon: Waves },
    { id: 'Parking', icon: Car },
    { id: 'TV', icon: Tv }
  ];

  const handleChange = (e) => {
    setParams({ ...params, [e.target.name]: e.target.value });
  };

  const toggleAmenity = (id) => {
    const newAmenities = params.amenities.includes(id)
      ? params.amenities.filter(a => a !== id)
      : [...params.amenities, id];
    setParams({ ...params, amenities: newAmenities });
  };

  const handleSearch = () => {
    // Convert amenities array to comma-separated string for backend
    const searchData = { 
      ...params, 
      amenities: params.amenities.length > 0 ? params.amenities.join(',') : '' 
    };
    onSearch(searchData);
    setShowFilters(false);
  };

  const handleClear = () => {
    const cleared = { location: '', checkInDate: '', checkOutDate: '', guests: '', amenities: [] };
    setParams(cleared);
    onSearch(cleared);
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <div style={searchWrapperStyle}>
          
          <div style={inputGroupStyle}>
            <div style={labelStyle}><MapPin size={14} /> Location</div>
            <input type="text" name="location" placeholder="Where to?" value={params.location} onChange={handleChange} style={inputStyle} />
          </div>

          <div style={dividerStyle} />

          <div style={inputGroupStyle}>
            <div style={labelStyle}><Calendar size={14} /> Dates</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="date" name="checkInDate" value={params.checkInDate} onChange={handleChange} style={dateInputStyle} />
              <span style={{ color: '#ddd' }}>|</span>
              <input type="date" name="checkOutDate" value={params.checkOutDate} onChange={handleChange} style={dateInputStyle} />
            </div>
          </div>

          <div style={dividerStyle} />

          <div style={inputGroupStyle}>
            <div style={labelStyle}><Users size={14} /> Guests</div>
            <input type="number" name="guests" placeholder="Add guests" value={params.guests} onChange={handleChange} style={{ ...inputStyle, width: '100px' }} />
          </div>

          {/* AMENITY FILTER TRIGGER */}
          <button onClick={() => setShowFilters(!showFilters)} style={filterToggleStyle(params.amenities.length > 0)}>
            <Filter size={18} />
            {params.amenities.length > 0 && <span style={badgeStyle}>{params.amenities.length}</span>}
          </button>

          <div style={buttonGroupStyle}>
            {(params.location || params.checkInDate || params.guests || params.amenities.length > 0) && (
              <button onClick={handleClear} style={clearButtonStyle} title="Clear"><X size={18} /></button>
            )}
            <button onClick={handleSearch} style={searchButtonStyle}>
              <Search size={18} color="white" />
              <span style={{ color: 'white', fontWeight: 'bold' }}>Search</span>
            </button>
          </div>
        </div>

        {/* ADVANCED AMENITY PANEL */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={filterPanelStyle}>
              <div style={{ fontWeight: 'bold', marginBottom: '1rem', fontSize: '0.9rem' }}>Filter by Amenities</div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {availableAmenities.map(a => (
                  <button 
                    key={a.id} 
                    onClick={() => toggleAmenity(a.id)}
                    style={amenityBtnStyle(params.amenities.includes(a.id))}
                  >
                    <a.icon size={16} /> {a.id}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- STYLES ---
const containerStyle = { display: 'flex', justifyContent: 'center', padding: '1rem 2rem', backgroundColor: '#fff', position: 'sticky', top: 0, zIndex: 100 };
const searchWrapperStyle = { display: 'flex', alignItems: 'center', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '40px', padding: '0.5rem 1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', gap: '0.5rem' };
const inputGroupStyle = { display: 'flex', flexDirection: 'column', padding: '0.4rem 1rem', gap: '0.2rem' };
const labelStyle = { fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', color: '#222', display: 'flex', alignItems: 'center', gap: '0.3rem' };
const inputStyle = { border: 'none', outline: 'none', fontSize: '0.9rem', color: '#222', backgroundColor: 'transparent', width: '120px' };
const dateInputStyle = { border: 'none', outline: 'none', fontSize: '0.85rem', color: '#222', backgroundColor: 'transparent', width: '110px' };
const dividerStyle = { width: '1px', height: '32px', backgroundColor: '#ddd' };
const buttonGroupStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '1rem' };
const searchButtonStyle = { backgroundColor: '#ff385c', border: 'none', borderRadius: '30px', padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' };
const clearButtonStyle = { backgroundColor: '#f7f7f7', border: 'none', borderRadius: '50%', padding: '0.6rem', cursor: 'pointer' };
const filterToggleStyle = (active) => ({ border: '1px solid #ddd', borderRadius: '20px', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', backgroundColor: active ? '#222' : '#fff', color: active ? '#fff' : '#222', position: 'relative', transition: 'all 0.2s' });
const badgeStyle = { position: 'absolute', top: -5, right: -5, backgroundColor: '#ff385c', color: 'white', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '10px', border: '2px solid white' };
const filterPanelStyle = { marginTop: '1rem', padding: '1.5rem', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', width: 'fit-content' };
const amenityBtnStyle = (active) => ({ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '12px', border: `1px solid ${active ? '#222' : '#ddd'}`, backgroundColor: active ? '#222' : '#fff', color: active ? '#fff' : '#717171', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' });

export default SearchBar;
