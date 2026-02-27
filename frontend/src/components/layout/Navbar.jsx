import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Menu, X, Heart, Briefcase, LayoutDashboard, MessageSquare, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../services/api';

/**
 * DEPLOYMENT PING: v1.0.5
 */

const Navbar = ({ userRole, onLogout, resetHomeView, unreadCount, notifications = [], onNotificationRead, onInboxClick }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const navigate = useNavigate();

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
          <Link to="/inbox" style={navLinkStyle} onClick={() => onInboxClick && onInboxClick()}><div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MessageSquare size={18} /> Inbox {unreadCount > 0 && <span style={badgeStyle}>{unreadCount}</span>}</div></Link>
          <Link to="/wishlist" style={navLinkStyle}><Heart size={18} /> Wishlist</Link>
          <Link to="/bookings" style={navLinkStyle}><Briefcase size={18} /> Trips</Link>
          <Link to="/profile" style={navLinkStyle}><User size={18} /> Profile</Link>
          <button onClick={onLogout} style={logoutBtnStyle}><LogOut size={18} /> Logout</button>
        </>
      )}
    </>
  );

  return (
    <nav style={navbarContainerStyle}>
      <div className="navbar-inner" style={navbarInnerStyle}>
        <div onClick={handleBrandClick} style={logoStyle}>
          {/* --- THE VISUAL PING --- */}
          <div style={logoIconStyle}>LIVE</div>
          <span style={logoTextStyle}>airnb<span style={{ color: '#ff385c' }}>LITE</span></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {userRole !== 'guest' && (
            <div style={{ position: 'relative' }}>
              <button onClick={handleNotifClick} style={iconBtnStyle}>
                <Bell size={22} />
                {notifications.some(n => !n.isRead) && <div style={dotStyle} />}
              </button>
              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} style={notifDropdownStyle}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>Notifications</div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? <div style={{ padding: '2rem', textAlign: 'center' }}>No alerts</div> : notifications.map(n => (
                        <div key={n._id} onClick={() => { setIsNotifOpen(false); navigate(n.link || '/'); }} style={notifCardStyle(n.isRead)}>
                          <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{n.title}</div>
                          <div style={{ fontSize: '0.8rem', color: '#717171' }}>{n.message}</div>
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

const navbarContainerStyle = { height: '80px', borderBottom: '1px solid #f0f0f0', backgroundColor: '#fff', position: 'sticky', top: 0, zIndex: 1000, width: '100%' };
const navbarInnerStyle = { maxWidth: '2560px', margin: '0 auto', height: '100%', padding: '0 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const logoStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' };
const logoIconStyle = { minWidth: '40px', padding: '0 8px', height: '32px', backgroundColor: '#ff385c', color: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' };
const logoTextStyle = { fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.03em', color: '#222' };
const desktopMenuStyle = { display: 'flex', alignItems: 'center', gap: '1.5rem' };
const navLinkStyle = { textDecoration: 'none', color: '#222', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px' };
const signupBtnStyle = { backgroundColor: '#ff385c', color: '#fff' };
const logoutBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: '#ff385c', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' };
const mobileTriggerStyle = { display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' };
const badgeStyle = { backgroundColor: '#ff385c', color: 'white', fontSize: '0.6rem', fontWeight: 'bold', minWidth: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px' };
const iconBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: '#222', display: 'flex', position: 'relative' };
const dotStyle = { position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px', backgroundColor: '#ff385c', borderRadius: '50%', border: '2px solid white' };
const notifDropdownStyle = { position: 'absolute', top: '100%', right: 0, marginTop: '1rem', width: '320px', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', zIndex: 1001, overflow: 'hidden' };
const notifCardStyle = (read) => ({ padding: '1rem', borderBottom: '1px solid #f7f7f7', cursor: 'pointer', backgroundColor: read ? '#fff' : '#fff1f2' });

export default Navbar;
