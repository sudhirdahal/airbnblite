import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Menu, X, Heart, Briefcase, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = ({ userRole, onLogout, resetHomeView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleBrandClick = () => {
    resetHomeView();
    navigate('/');
  };

  const NavLinks = () => (
    <>
      {userRole === 'guest' ? (
        <>
          <Link to="/login" style={navLinkStyle} onClick={() => setIsMobileMenuOpen(false)}>Log in</Link>
          <Link to="/signup" style={{ ...navLinkStyle, ...signupBtnStyle }} onClick={() => setIsMobileMenuOpen(false)}>Sign up</Link>
        </>
      ) : (
        <>
          {userRole === 'admin' && <Link to="/admin" style={navLinkStyle} onClick={() => setIsMobileMenuOpen(false)}><LayoutDashboard size={18} /> Dashboard</Link>}
          <Link to="/wishlist" style={navLinkStyle} onClick={() => setIsMobileMenuOpen(false)}><Heart size={18} /> Wishlist</Link>
          <Link to="/bookings" style={navLinkStyle} onClick={() => setIsMobileMenuOpen(false)}><Briefcase size={18} /> Trips</Link>
          <Link to="/profile" style={navLinkStyle} onClick={() => setIsMobileMenuOpen(false)}><User size={18} /> Profile</Link>
          <button onClick={() => { onLogout(); setIsMobileMenuOpen(false); }} style={logoutBtnStyle}><LogOut size={18} /> Logout</button>
        </>
      )}
    </>
  );

  return (
    <nav style={navbarContainerStyle}>
      {/* ADDED CLASS: navbar-inner */}
      <div className="navbar-inner" style={navbarInnerStyle}>
        
        <div onClick={handleBrandClick} style={logoStyle}>
          <div style={logoIconStyle}>A</div>
          <span style={logoTextStyle}>airnb<span style={{ color: '#ff385c' }}>lite</span></span>
        </div>

        {/* ADDED CLASS: desktop-menu */}
        <div className="desktop-menu" style={desktopMenuStyle}>
          <NavLinks />
        </div>

        {/* ADDED CLASS: mobile-trigger */}
        <button className="mobile-trigger" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={mobileTriggerStyle}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} style={mobileDrawerStyle}>
            <div style={mobileMenuContentStyle}><NavLinks /></div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const navbarContainerStyle = { height: '80px', borderBottom: '1px solid #f0f0f0', backgroundColor: '#fff', position: 'sticky', top: 0, zIndex: 1000, width: '100%' };
const navbarInnerStyle = { maxWidth: '2560px', margin: '0 auto', height: '100%', padding: '0 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const logoStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' };
const logoIconStyle = { width: '32px', height: '32px', backgroundColor: '#ff385c', color: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' };
const logoTextStyle = { fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.03em', color: '#222' };
const desktopMenuStyle = { display: 'flex', alignItems: 'center', gap: '1.5rem' };
const navLinkStyle = { textDecoration: 'none', color: '#222', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px' };
const signupBtnStyle = { backgroundColor: '#ff385c', color: '#fff' };
const logoutBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: '#ff385c', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' };
const mobileTriggerStyle = { display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' };
const mobileDrawerStyle = { position: 'fixed', top: '80px', right: 0, bottom: 0, width: '280px', backgroundColor: '#fff', boxShadow: '-10px 0 30px rgba(0,0,0,0.05)', zIndex: 999, borderLeft: '1px solid #f0f0f0' };
const mobileMenuContentStyle = { display: 'flex', flexDirection: 'column', padding: '2rem', gap: '1.5rem' };

export default Navbar;
