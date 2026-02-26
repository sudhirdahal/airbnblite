import React, { useState } from 'react';
import { Search, MapPin, Calendar, Users, X } from 'lucide-react';

/**
 * SearchBar Component: Premium, interactive search widget.
 * Features real-time parameter passing for location, dates, and guests.
 */
const SearchBar = ({ onSearch }) => {
  const [params, setParams] = useState({
    location: '',
    checkInDate: '',
    checkOutDate: '',
    guests: ''
  });

  const handleChange = (e) => {
    setParams({ ...params, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    onSearch(params);
  };

  const handleClear = () => {
    const cleared = { location: '', checkInDate: '', checkOutDate: '', guests: '' };
    setParams(cleared);
    onSearch(cleared);
  };

  return (
    <div style={containerStyle}>
      <div style={searchWrapperStyle}>
        
        {/* Location Input */}
        <div style={inputGroupStyle}>
          <div style={labelStyle}><MapPin size={14} /> Location</div>
          <input 
            type="text" 
            name="location"
            placeholder="Where are you going?" 
            value={params.location}
            onChange={handleChange}
            style={inputStyle} 
          />
        </div>

        <div style={dividerStyle} />

        {/* Date Inputs */}
        <div style={inputGroupStyle}>
          <div style={labelStyle}><Calendar size={14} /> Check-in</div>
          <input 
            type="date" 
            name="checkInDate"
            value={params.checkInDate}
            onChange={handleChange}
            style={inputStyle} 
          />
        </div>

        <div style={dividerStyle} />

        <div style={inputGroupStyle}>
          <div style={labelStyle}><Calendar size={14} /> Checkout</div>
          <input 
            type="date" 
            name="checkOutDate"
            value={params.checkOutDate}
            onChange={handleChange}
            style={inputStyle} 
          />
        </div>

        <div style={dividerStyle} />

        {/* Guest Input */}
        <div style={inputGroupStyle}>
          <div style={labelStyle}><Users size={14} /> Guests</div>
          <input 
            type="number" 
            name="guests"
            placeholder="Add guests" 
            value={params.guests}
            onChange={handleChange}
            style={inputStyle} 
          />
        </div>

        {/* Action Buttons */}
        <div style={buttonGroupStyle}>
          {(params.location || params.checkInDate || params.guests) && (
            <button onClick={handleClear} style={clearButtonStyle} title="Clear Filters">
              <X size={18} />
            </button>
          )}
          <button onClick={handleSearch} style={searchButtonStyle}>
            <Search size={18} color="white" />
            <span style={{ color: 'white', fontWeight: 'bold' }}>Search</span>
          </button>
        </div>

      </div>
    </div>
  );
};

// --- STYLES ---
const containerStyle = { display: 'flex', justifyContent: 'center', padding: '1rem 2rem', backgroundColor: '#fff', position: 'sticky', top: 0, zIndex: 100 };
const searchWrapperStyle = { display: 'flex', alignItems: 'center', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '40px', padding: '0.5rem 1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', gap: '0.5rem', transition: 'box-shadow 0.2s' };
const inputGroupStyle = { display: 'flex', flexDirection: 'column', padding: '0.4rem 1rem', gap: '0.2rem' };
const labelStyle = { fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: '#222', display: 'flex', alignItems: 'center', gap: '0.3rem' };
const inputStyle = { border: 'none', outline: 'none', fontSize: '0.9rem', color: '#222', backgroundColor: 'transparent', width: '140px' };
const dividerStyle = { width: '1px', height: '32px', backgroundColor: '#ddd' };
const buttonGroupStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '1rem' };
const searchButtonStyle = { backgroundColor: '#ff385c', border: 'none', borderRadius: '30px', padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', transition: 'background 0.2s' };
const clearButtonStyle = { backgroundColor: '#f7f7f7', border: 'none', borderRadius: '50%', padding: '0.6rem', cursor: 'pointer', color: '#717171', display: 'flex', alignItems: 'center', justifyContent: 'center' };

export default SearchBar;
