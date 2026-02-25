import React from 'react';
import { Link } from 'react-router-dom';
import { Home, User, Settings, LogIn, LogOut, Heart } from 'lucide-react'; // Import icons

// Navbar Component: Provides primary navigation and displays user status.
// It adapts its links based on the user's role (guest, registered, admin).
const Navbar = ({ userRole, onLogout, resetHomeView }) => {
  return (
    <nav style={{ 
      padding: '1rem', 
      borderBottom: '1px solid #ddd', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      backgroundColor: 'white', 
      position: 'sticky', // Makes the navbar stick to the top when scrolling.
      top: 0, 
      zIndex: 1001 // Ensures navbar stays above other content like map popups.
    }}>
      {/* App Logo/Home Link */}
      <Link 
        to="/" 
        onClick={resetHomeView} // Resets filters and view mode when clicking logo.
        style={{ fontSize: '1.5rem', fontWeight: 'bold', textDecoration: 'none', color: '#ff385c', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <Home size={24} /> AirBnB Lite
      </Link>
      
      {/* Navigation Links */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {/* Browse Link (resets home view) */}
        <Link 
          to="/" 
          onClick={resetHomeView}
          style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}
        >
          Browse
        </Link>
        
        {/* Conditional Links based on user role */}
        {userRole === 'guest' ? (
          // Links for non-logged-in users
          <>
            <Link to="/login" style={{ textDecoration: 'none', color: '#333', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: '500' }}>
              <LogIn size={18} /> Login
            </Link>
            <Link to="/signup" style={{ 
              textDecoration: 'none', 
              color: 'white', 
              backgroundColor: '#ff385c', 
              padding: '0.5rem 1rem', 
              borderRadius: '8px',
              fontWeight: '500'
            }}>
              Sign Up
            </Link>
          </>
        ) : (
          // Links for logged-in users (registered or admin)
          <>
            <Link to="/wishlist" style={{ textDecoration: 'none', color: '#333', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Heart size={18} /> Wishlist
            </Link>

            {userRole === 'registered' && (
              <Link to="/bookings" style={{ textDecoration: 'none', color: '#333', fontWeight: '500' }}>My Bookings</Link>
            )}

            {userRole === 'admin' && (
              <Link to="/admin" style={{ textDecoration: 'none', color: '#333', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: '500' }}>
                <Settings size={18} /> Admin
              </Link>
            )}

            {/* Logout Button */}
            <button 
              onClick={onLogout} // Triggers global logout functionality.
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#333', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.3rem',
                fontWeight: '500',
                padding: 0,
                fontSize: '1rem'
              }}
            >
              <LogOut size={18} /> Logout
            </button>
          </>
        )}

        {/* User Role Display and Profile Link */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          color: '#717171',
          border: '1px solid #ddd',
          padding: '0.4rem 0.8rem',
          borderRadius: '20px',
          cursor: 'pointer'
        }}>
          <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}>
            <User size={20} />
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
              {userRole === 'guest' ? 'Guest' : userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
