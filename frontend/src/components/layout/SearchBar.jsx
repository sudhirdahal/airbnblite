import React, { useState } from 'react';
import { Search } from 'lucide-react';

// SearchBar Component: Provides input fields for filtering listings by location, dates, guests, and price range.
// It uses internal state to manage input values and triggers a search callback on submission.
const SearchBar = ({ onSearch }) => {
  // Internal state for all search parameters.
  const [searchParams, setSearchParams] = useState({
    location: '',
    checkInDate: '',
    checkOutDate: '',
    guests: '',
    minPrice: '',
    maxPrice: ''
  });

  // Handles changes to any input field, updating the corresponding state.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value }));
  };

  // Handles form submission, triggering the 'onSearch' callback with current parameters.
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default browser form submission.
    onSearch(searchParams); // Pass all collected search parameters.
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '2rem 1rem',
      backgroundColor: '#f7f7f7'
    }}>
      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '32px',
        padding: '0.5rem 1.5rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)',
        width: '100%',
        maxWidth: '850px', // Wider search bar to accommodate new fields.
        flexWrap: 'wrap', // Allow wrapping on smaller screens.
        gap: '0.5rem 1rem' // Gap between elements.
      }}>
        {/* Location Input */}
        <div style={{ flex: '1 1 20%', minWidth: '120px', padding: '0 0.5rem', borderRight: '1px solid #ddd' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 'bold', display: 'block' }}>Location</label>
          <input 
            type="text" 
            name="location"
            placeholder="Where are you going?" 
            value={searchParams.location}
            onChange={handleChange}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }} 
          />
        </div>
        
        {/* Check-in Date Input */}
        <div style={{ flex: '1 1 15%', minWidth: '100px', padding: '0 0.5rem', borderRight: '1px solid #ddd' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 'bold', display: 'block' }}>Check-in</label>
          <input 
            type="date" 
            name="checkInDate"
            value={searchParams.checkInDate}
            onChange={handleChange}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }} 
          />
        </div>

        {/* Check-out Date Input */}
        <div style={{ flex: '1 1 15%', minWidth: '100px', padding: '0 0.5rem', borderRight: '1px solid #ddd' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 'bold', display: 'block' }}>Check-out</label>
          <input 
            type="date" 
            name="checkOutDate"
            value={searchParams.checkOutDate}
            onChange={handleChange}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }} 
          />
        </div>

        {/* Guests Input */}
        <div style={{ flex: '1 1 10%', minWidth: '80px', padding: '0 0.5rem', borderRight: '1px solid #ddd' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 'bold', display: 'block' }}>Guests</label>
          <input 
            type="number" 
            name="guests"
            placeholder="Add" 
            value={searchParams.guests}
            onChange={handleChange}
            min="1"
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }} 
          />
        </div>

        {/* Min Price Input */}
        <div style={{ flex: '1 1 10%', minWidth: '80px', padding: '0 0.5rem', borderRight: '1px solid #ddd' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 'bold', display: 'block' }}>Min Price</label>
          <input 
            type="number" 
            name="minPrice"
            placeholder="$0" 
            value={searchParams.minPrice}
            onChange={handleChange}
            min="0"
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }} 
          />
        </div>

        {/* Max Price Input */}
        <div style={{ flex: '1 1 10%', minWidth: '80px', padding: '0 0.5rem' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 'bold', display: 'block' }}>Max Price</label>
          <input 
            type="number" 
            name="maxPrice"
            placeholder="$1000+" 
            value={searchParams.maxPrice}
            onChange={handleChange}
            min="0"
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }} 
          />
        </div>

        {/* Search Button */}
        <button type="submit" style={{
          backgroundColor: '#ff385c',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          padding: '0.8rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0 // Prevent button from shrinking.
        }}>
          <Search size={20} />
        </button>
      </form>
    </div>
  );
};

export default SearchBar;
