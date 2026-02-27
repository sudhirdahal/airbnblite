import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Menu, X, Heart, Briefcase, LayoutDashboard, MessageSquare, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../services/api';
import { theme } from '../../theme';
import { useAuth } from '../../context/AuthContext'; // --- NEW: CONTEXT HOOK ---

/**
 * ============================================================================
 * NAVBAR COMPONENT (The Context-Aware Navigation)
 * ============================================================================
 * UPDATED: Context API Refactor.
 * Instead of receiving props from App.jsx, this component now pulls 
 * 'user', 'unreadCount', and 'notifications' directly from the AuthContext.
 */
const Navbar = ({ onLogout, resetHomeView }) => {
  const { user, unreadCount, notifications, syncUpdates } = useAuth(); // CONSUME CONTEXT
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const navigate = useNavigate();

  const handleBrandClick = () => { resetHomeView(); navigate('/'); };

  const handleNotifClick = async () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen && notifications.some(n => !n.isRead)) {
      await API.put('/auth/notifications/read');
      syncUpdates(); // Clear unread dot instantly
    }
  };

  const NavLinks = () => (
    <>
      {!user ? (
        <>
          <Link to="/login" style={navLinkStyle}>Log in</Link>
          <Link to="/signup" style={{ ...navLinkStyle, ...signupBtnStyle }}>Sign up</Link>
        </>
      ) : (
        <>
          {user.role === 'admin' && <Link to="/admin" style={navLinkStyle}>Dashboard</Link>}
          <Link to="/inbox" style={navLinkStyle}><div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MessageSquare size={18} /> Inbox {unreadCount > 0 && <span style={badgeStyle}>{unreadCount}</span>}</div></Link>
          <Link to="/wishlist" style={navLinkStyle}><Heart size={18} /> Wishlist</Link>
          <Link to="/bookings" style={navLinkStyle}><Briefcase size={18} /> Trips</Link>
          <Link to="/profile" style={navLinkStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {user.avatar ? <img src={user.avatar} style={navAvatarStyle} /> : <div style={navAvatarPlaceholderStyle}>{user.name.charAt(0)}</div>}
              <span>Profile</span>
            </div>
          </Link>
          <button onClick={onLogout} style={logoutBtnStyle}><LogOut size={18} /> Logout</button>
        </>
      )}
    </>
  );

  return (
    <nav style={navbarContainerStyle}>
      <div className="navbar-inner" style={navbarInnerStyle}>
        <div onClick={handleBrandClick} style={logoStyle}>
          <div style={logoIconStyle}>A</div>
          <span style={logoTextStyle}>airnb<span style={{ color: theme.colors.brand }}>lite</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {user && (
            <div style={{ position: 'relative' }}>
              <button onClick={handleNotifClick} style={iconBtnStyle}>
                <Bell size={22} />
                {notifications.some(n => !n.isRead) && <div style={dotStyle} />}
              </button>
              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} style={notifDropdownStyle}>
                    <div style={{ padding: '1rem', borderBottom: `1px solid ${theme.colors.divider}`, fontWeight: 'bold' }}>Notifications</div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? <div style={{ padding: '2rem', textAlign: 'center' }}>No alerts</div> : notifications.map(n => (
                        <div key={n._id} onClick={() => { setIsNotifOpen(false); navigate(n.link || '/'); }} style={notifCardStyle(n.isRead)}>
                          <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{n.title}</div>
                          <div style={{ fontSize: '0.8rem', color: theme.colors.slate }}>{n.message}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          <div className="desktop-menu" style={desktopMenuStyle}><NavLinks /></div>
          <button className="mobile-trigger" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={mobileTriggerStyle}>{isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
        </div>
      </div>
    </nav>
  );
};

// --- STYLES ---
const navbarContainerStyle = { height: '80px', borderBottom: `1px solid ${theme.colors.lightGrey}`, backgroundColor: theme.colors.white, position: 'sticky', top: 0, zIndex: 1000, width: '100%' };
const navbarInnerStyle = { maxWidth: '2560px', margin: '0 auto', height: '100%', padding: '0 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const logoStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' };
const logoIconStyle = { width: '32px', height: '32px', backgroundColor: theme.colors.brand, color: theme.colors.white, borderRadius: theme.radius.sm, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' };
const logoTextStyle = { fontSize: '1.4rem', fontWeight: theme.typography.weights.extraBold, color: theme.colors.charcoal };
const desktopMenuStyle = { display: 'flex', alignItems: 'center', gap: '1.5rem' };
const navLinkStyle = { textDecoration: 'none', color: theme.colors.charcoal, fontSize: theme.typography.sizes.sm, fontWeight: theme.typography.weights.semibold, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: theme.radius.sm };
const signupBtnStyle = { backgroundColor: theme.colors.brand, color: theme.colors.white };
const logoutBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.brand, fontSize: theme.typography.sizes.sm, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' };
const mobileTriggerStyle = { display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' };
const badgeStyle = { backgroundColor: theme.colors.brand, color: theme.colors.white, fontSize: '0.65rem', fontWeight: 'bold', minWidth: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px' };
const iconBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.charcoal, display: 'flex', position: 'relative' };
const dotStyle = { position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px', backgroundColor: theme.colors.brand, borderRadius: '50%', border: `2px solid ${theme.colors.white}` };
const notifDropdownStyle = { position: 'absolute', top: 100, right: 0, width: '320px', backgroundColor: '#fff', border: `1px solid ${theme.colors.divider}`, borderRadius: theme.radius.md, boxShadow: theme.shadows.lg, zIndex: 1001, overflow: 'hidden' };
const notifCardStyle = (read) => ({ padding: '1rem', borderBottom: `1px solid ${theme.colors.lightGrey}`, cursor: 'pointer', backgroundColor: read ? '#fff' : '#fff1f2' });
const navAvatarStyle = { width: '28px', height: '28px', borderRadius: theme.radius.full, objectFit: 'cover' };
const navAvatarPlaceholderStyle = { width: '28px', height: '28px', borderRadius: theme.radius.full, backgroundColor: theme.colors.charcoal, color: theme.colors.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' };

export default Navbar;
