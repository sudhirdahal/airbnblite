import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Menu, X, Heart, Briefcase, LayoutDashboard, MessageSquare, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../services/api';
import { theme } from '../../theme'; // --- NEW: THEME AUTHORITY ---

/**
 * ============================================================================
 * NAVBAR COMPONENT (V7 - THE DESIGN TOKEN UPDATE)
 * ============================================================================
 * OVERHAUL: Refactored to consume the centralized Design Token system.
 * This ensures that global navigation elements (brand colors, shadows, 
 * and typography) are managed by the theme.js authority.
 */
const Navbar = ({ userRole, onLogout, resetHomeView, unreadCount, notifications = [], onNotificationRead, onInboxClick }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [user, setUser] = useState(null); 
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleBrandClick = () => { resetHomeView(); navigate('/'); };

  const handleNotifClick = async () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen && notifications.some(n => !n.isRead)) {
      await API.put('/auth/notifications/read');
      onNotificationRead(); 
    }
  };

  const NavLinks = () => (
    <>
      {userRole === 'guest' ? (
        <>
          <Link to="/login" style={navLinkStyle}>Log in</Link>
          <Link to="/signup" style={{ ...navLinkStyle, ...signupBtnStyle }}>Sign up</Link>
        </>
      ) : (
        <>
          {userRole === 'admin' && <Link to="/admin" style={navLinkStyle}>Dashboard</Link>}
          
          <Link to="/inbox" style={navLinkStyle} onClick={() => onInboxClick && onInboxClick()}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={18} /> Inbox 
              {unreadCount > 0 && (
                <span style={badgeStyle}>{unreadCount}</span>
              )}
            </div>
          </Link>

          <Link to="/wishlist" style={navLinkStyle}><Heart size={18} /> Wishlist</Link>
          <Link to="/bookings" style={navLinkStyle}><Briefcase size={18} /> Trips</Link>
          
          <Link to="/profile" style={navLinkStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {user?.avatar ? (
                <img src={user.avatar} style={navAvatarStyle} alt="Profile" />
              ) : (
                <div style={navAvatarPlaceholderStyle}>{user?.name?.charAt(0) || 'U'}</div>
              )}
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
          {userRole !== 'guest' && (
            <div style={{ position: 'relative' }}>
              <button onClick={handleNotifClick} style={iconBtnStyle}>
                <Bell size={22} />
                {notifications.some(n => !n.isRead) && (
                  <div style={dotStyle} />
                )}
              </button>
              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} style={notifDropdownStyle}>
                    <div style={{ padding: '1rem', borderBottom: `1px solid ${theme.colors.divider}`, fontWeight: theme.typography.weights.bold }}>Notifications</div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? <div style={{ padding: '2rem', textAlign: 'center' }}>No alerts</div> : notifications.map(n => (
                        <div key={n._id} onClick={() => { setIsNotifOpen(false); navigate(n.link || '/'); }} style={notifCardStyle(n.isRead)}>
                          <div style={{ fontWeight: theme.typography.weights.bold, fontSize: theme.typography.sizes.sm }}>{n.title}</div>
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

// --- TOKEN-BASED STYLES ---
const navbarContainerStyle = { 
  height: '80px', 
  borderBottom: `1px solid ${theme.colors.lightGrey}`, 
  backgroundColor: theme.colors.white, 
  position: 'sticky', 
  top: 0, 
  zIndex: 1000, 
  width: '100%' 
};

const navbarInnerStyle = { 
  maxWidth: '2560px', 
  margin: '0 auto', 
  height: '100%', 
  padding: '0 4rem', 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center' 
};

const logoStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' };
const logoIconStyle = { 
  width: '32px', 
  height: '32px', 
  backgroundColor: theme.colors.brand, 
  color: theme.colors.white, 
  borderRadius: theme.radius.sm, 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  fontWeight: theme.typography.weights.bold, 
  fontSize: '1.2rem' 
};

const logoTextStyle = { 
  fontSize: '1.4rem', 
  fontWeight: theme.typography.weights.extraBold, 
  letterSpacing: '-0.03em', 
  color: theme.colors.charcoal 
};

const desktopMenuStyle = { display: 'flex', alignItems: 'center', gap: '1.5rem' };

const navLinkStyle = { 
  textDecoration: 'none', 
  color: theme.colors.charcoal, 
  fontSize: theme.typography.sizes.sm, 
  fontWeight: theme.typography.weights.semibold, 
  display: 'flex', 
  alignItems: 'center', 
  gap: '0.5rem', 
  padding: '0.5rem 1rem', 
  borderRadius: theme.radius.sm 
};

const signupBtnStyle = { 
  backgroundColor: theme.colors.brand, 
  color: theme.colors.white 
};

const logoutBtnStyle = { 
  background: 'none', 
  border: 'none', 
  cursor: 'pointer', 
  color: theme.colors.brand, 
  fontSize: theme.typography.sizes.sm, 
  fontWeight: theme.typography.weights.semibold, 
  display: 'flex', 
  alignItems: 'center', 
  gap: '0.5rem', 
  padding: '0.5rem 1rem' 
};

const mobileTriggerStyle = { display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' };

const badgeStyle = { 
  backgroundColor: theme.colors.brand, 
  color: theme.colors.white, 
  fontSize: '0.65rem', 
  fontWeight: theme.typography.weights.bold, 
  minWidth: '18px', 
  height: '18px', 
  borderRadius: theme.radius.full, 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  padding: '2px' 
};

const iconBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.charcoal, display: 'flex', position: 'relative' };
const dotStyle = { position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px', backgroundColor: theme.colors.brand, borderRadius: theme.radius.full, border: `2px solid ${theme.colors.white}` };

const notifDropdownStyle = { 
  position: 'absolute', 
  top: '100%', 
  right: 0, 
  marginTop: '1rem', 
  width: '320px', 
  backgroundColor: theme.colors.white, 
  border: `1px solid ${theme.colors.divider}`, 
  borderRadius: theme.radius.md, 
  boxShadow: theme.shadows.lg, 
  zIndex: 1001, 
  overflow: 'hidden' 
};

const notifCardStyle = (read) => ({ 
  padding: '1rem', 
  borderBottom: `1px solid ${theme.colors.lightGrey}`, 
  cursor: 'pointer', 
  backgroundColor: read ? theme.colors.white : '#fff1f2' 
});

const navAvatarStyle = { width: '28px', height: '28px', borderRadius: theme.radius.full, objectFit: 'cover', border: `1px solid ${theme.colors.lightGrey}` };
const navAvatarPlaceholderStyle = { width: '28px', height: '28px', borderRadius: theme.radius.full, backgroundColor: theme.colors.charcoal, color: theme.colors.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: theme.typography.weights.bold };

export default Navbar;
