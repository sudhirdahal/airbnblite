import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Menu, X, Heart, Briefcase, LayoutDashboard, MessageSquare, Bell, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../services/api';
import { theme } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';

/**
 * ============================================================================
 * 🧭 NAVBAR COMPONENT (The Context-Aware Navigator)
 * ============================================================================
 * 
 * MASTERCLASS NOTES:
 * The Navbar is the "Control Tower" of the application. It must react instantly 
 * to changes in global state (Login/Logout) and real-time events (New Messages).
 * 
 * Evolution Timeline:
 * - Phase 1: Hardcoded links.
 * - Phase 14: Design Token Integration (Standardized colors and spacing).
 * - Phase 23: Context API Refactor (Removing props, consuming global state).
 * - Phase 25: Real-time Badge Hardening (Socket-driven unread counts).
 * - Phase 46: Mobile Convergence (Responsive Drawer & Adaptive Overlays).
 */

/* ============================================================================
 * 👻 HISTORICAL GHOST: PHASE 1-22 (The Prop-Heavy Navbar)
 * ============================================================================
 * Before the Context refactor, the Navbar was a "Dumb Component":
 * 
 * const Navbar = ({ user, unreadCount, notifications, onLogout }) => {
 *    // Every time the unreadCount changed in App.jsx, the entire Navbar 
 *    // had to re-render, even if only one link changed.
 * }
 * 
 * THE FLAW: It was impossible to use the Navbar outside of App.jsx without 
 * manually passing 4-5 props every time.
 * ============================================================================ */

const Navbar = ({ onLogout, resetHomeView }) => {
  // CONSUME GLOBAL BRAIN (Phase 23)
  const { user, unreadCount, notifications, syncUpdates } = useAuth(); 
  const { isMobile } = useResponsive();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [inboxThreads, setInboxThreads] = useState([]);
  const navigate = useNavigate();

  // Close overlays when switching routes or resizing
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsNotifOpen(false);
    setIsInboxOpen(false);
  }, [navigate]);

  const handleBrandClick = () => { 
    resetHomeView(); // Cinematic logic: Reset filters when clicking the logo
    navigate('/'); 
  };

  /**
   * NOTIFICATION HANDSHAKE
   * Logic: When the user opens the bell dropdown, we proactively tell the 
   * backend to mark all system notifications as read.
   */
  const handleNotifClick = async () => {
    setIsNotifOpen(!isNotifOpen);
    setIsInboxOpen(false); // Close other dropdowns
    if (!isNotifOpen && notifications.some(n => !n.isRead)) {
      await API.put('/auth/notifications/read');
      syncUpdates(); // Instantly wipe the red dot for a smooth UX
    }
  };

  /**
   * INBOX QUICK-VIEW (Phase 44)
   * Logic: Fetches the latest threads when the dropdown is opened.
   */
  const handleInboxClick = async () => {
    setIsInboxOpen(!isInboxOpen);
    setIsNotifOpen(false); // Close notifications
    if (!isInboxOpen) {
      try {
        const res = await API.get('/auth/inbox');
        setInboxThreads(res.data.slice(0, 5)); // Show top 5 recent
      } catch (err) { console.error("Inbox Peek Failure"); }
    }
  };

  const NavLinks = ({ isMobileView }) => (
    <div style={isMobileView ? mobileStackStyle : desktopMenuStyle}>
      {!user ? (
        <>
          <Link to="/login" style={navLinkStyle(isMobileView)}>Log in</Link>
          <Link to="/signup" style={{ ...navLinkStyle(isMobileView), ...signupBtnStyle(isMobileView) }}>Sign up</Link>
        </>
      ) : (
        <>
          {/* RBAC Visibility: Only show Dashboard link to Hosts */}
          {user.role === 'admin' && (
            <Link to="/admin" style={navLinkStyle(isMobileView)}>
              <LayoutDashboard size={isMobileView ? 20 : 18} /> Dashboard
            </Link>
          )}
          
          {/* Inbox remains a dropdown on desktop, but a flat link in mobile drawer */}
          {isMobileView ? (
            <Link to="/inbox" style={navLinkStyle(true)}>
              <MessageSquare size={20} /> Inbox {unreadCount > 0 && <span style={badgeStyle}>{unreadCount}</span>}
            </Link>
          ) : (
            <div style={{ position: 'relative' }}>
              <button onClick={handleInboxClick} style={navLinkBtnStyle}>
                <MessageSquare size={18} /> Inbox {unreadCount > 0 && <span style={badgeStyle}>{unreadCount}</span>}
              </button>
              <AnimatePresence>
                {isInboxOpen && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} style={notifDropdownStyle(isMobile)}>
                    <div style={dropdownHeaderStyle}>
                      <span>Recent Messages</span>
                      <Link to="/inbox" onClick={() => setIsInboxOpen(false)} style={viewAllLink}>View all</Link>
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {inboxThreads.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: theme.colors.slate }}>No messages yet</div>
                      ) : (
                        inboxThreads.map(t => (
                          <div 
                            key={`${t.listing._id}-${t.guest?._id}`} 
                            onClick={() => { 
                              setIsInboxOpen(false); 
                              navigate(`/listing/${t.listing._id}?guest=${t.guest?._id || user._id}`); 
                            }} 
                            style={notifCardStyle(t.unreadCount === 0)}
                          >
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                              <img src={t.listing.images[0]} style={peekThumbStyle} alt="Listing" />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{t.listing.title}</div>
                                <div style={{ fontSize: '0.75rem', color: theme.colors.slate, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                                  {t.lastMessage.content}
                                </div>
                              </div>
                              {t.unreadCount > 0 && <div style={dotSmall} />}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          
          <Link to="/wishlist" style={navLinkStyle(isMobileView)}><Heart size={isMobileView ? 20 : 18} /> Wishlist</Link>
          <Link to="/bookings" style={navLinkStyle(isMobileView)}><Briefcase size={isMobileView ? 20 : 18} /> Trips</Link>
          
          <Link to="/profile" style={navLinkStyle(isMobileView)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {/* Conditional Avatar Rendering */}
              {user.avatar ? (
                <img src={user.avatar} style={navAvatarStyle} alt="Me" />
              ) : (
                <div style={navAvatarPlaceholderStyle}>{user.name.charAt(0)}</div>
              )}
              <span>Profile</span>
            </div>
          </Link>
          <button onClick={onLogout} style={isMobileView ? mobileLogoutBtn : logoutBtnStyle}><LogOut size={18} /> Logout</button>
        </>
      )}
    </div>
  );

  return (
    <nav style={navbarContainerStyle}>
      <div className="navbar-inner" style={navbarInnerStyle(isMobile)}>
        
        {/* BRAND IDENTITY */}
        <div onClick={handleBrandClick} style={logoStyle}>
          <div style={logoIconStyle}>A</div>
          {!isMobile && <span style={logoTextStyle}>airnb<span style={{ color: theme.colors.brand }}>lite</span></span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.8rem' : '1.5rem' }}>
          
          {/* 🔔 SYSTEM NOTIFICATIONS (Phase 15) */}
          {user && (
            <div style={{ position: 'relative' }}>
              <button onClick={handleNotifClick} style={iconBtnStyle}>
                <Bell size={isMobile ? 24 : 22} />
                {notifications.some(n => !n.isRead) && (
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    style={dotStyle} 
                  />
                )}
              </button>
              
              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: 10 }} 
                    style={notifDropdownStyle(isMobile)}
                  >
                    <div style={dropdownHeaderStyle}>Notifications</div>
                    <div style={{ maxHeight: isMobile ? '60vh' : '400px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: theme.colors.slate }}>No new alerts</div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n._id} 
                            onClick={() => { setIsNotifOpen(false); navigate(n.link || '/'); }} 
                            style={notifCardStyle(n.isRead)}
                          >
                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{n.title}</div>
                            <div style={{ fontSize: '0.8rem', color: theme.colors.slate }}>{n.message}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {!isMobile ? <NavLinks isMobileView={false} /> : (
            <>
              <button onClick={() => setIsMobileMenuOpen(true)} style={mobileTriggerStyle}>
                <Menu size={28} color={theme.colors.charcoal} />
              </button>

              <AnimatePresence>
                {isMobileMenuOpen && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }} 
                      onClick={() => setIsMobileMenuOpen(false)} 
                      style={mobileOverlay} 
                    />
                    <motion.div 
                      initial={{ x: '100%' }} 
                      animate={{ x: 0 }} 
                      exit={{ x: '100%' }} 
                      transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
                      style={mobileDrawer}
                    >
                      <div style={drawerHeader}>
                        <div style={logoStyle} onClick={handleBrandClick}>
                          <div style={logoIconStyle}>A</div>
                          <span style={logoTextStyle}>airnb<span style={{ color: theme.colors.brand }}>lite</span></span>
                        </div>
                        <button onClick={() => setIsMobileMenuOpen(false)} style={closeDrawerBtn}><X size={28} /></button>
                      </div>
                      <div style={{ padding: '1rem' }}>
                        <NavLinks isMobileView={true} />
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

// --- DESIGN TOKEN STYLES ---
const navbarContainerStyle = { height: '80px', borderBottom: `1px solid ${theme.colors.lightGrey}`, backgroundColor: theme.colors.white, position: 'sticky', top: 0, zIndex: 1000, width: '100%' };
const navbarInnerStyle = (isMobile) => ({ maxWidth: '2560px', margin: '0 auto', height: '100%', padding: isMobile ? '0 1.5rem' : '0 4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' });
const logoStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' };
const logoIconStyle = { width: '32px', height: '32px', backgroundColor: theme.colors.brand, color: theme.colors.white, borderRadius: theme.radius.sm, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' };
const logoTextStyle = { fontSize: '1.4rem', fontWeight: theme.typography.weights.extraBold, color: theme.colors.charcoal };
const desktopMenuStyle = { display: 'flex', alignItems: 'center', gap: '1.5rem' };
const navLinkStyle = (isMobile) => ({ textDecoration: 'none', color: theme.colors.charcoal, fontSize: isMobile ? '1.1rem' : theme.typography.sizes.sm, fontWeight: theme.typography.weights.semibold, display: 'flex', alignItems: 'center', gap: '1rem', padding: isMobile ? '1.2rem 1.5rem' : '0.5rem 1rem', borderRadius: theme.radius.sm, borderBottom: isMobile ? `1px solid ${theme.colors.lightGrey}` : 'none' });
const navLinkBtnStyle = { ...navLinkStyle, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' };
const signupBtnStyle = (isMobile) => ({ backgroundColor: isMobile ? 'transparent' : theme.colors.brand, color: isMobile ? theme.colors.brand : theme.colors.white });
const logoutBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.brand, fontSize: theme.typography.sizes.sm, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' };
const mobileTriggerStyle = { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const badgeStyle = { backgroundColor: theme.colors.brand, color: theme.colors.white, fontSize: '0.65rem', fontWeight: 'bold', minWidth: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px' };
const iconBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.charcoal, display: 'flex', position: 'relative' };
const dotStyle = { position: 'absolute', top: '-2px', right: '-2px', width: '12px', height: '12px', backgroundColor: theme.colors.brand, borderRadius: '50%', border: `2.5px solid ${theme.colors.white}`, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' };
const dotSmall = { width: '8px', height: '8px', backgroundColor: theme.colors.brand, borderRadius: '50%' };
const dropdownHeaderStyle = { padding: '1rem 1.5rem', borderBottom: `1px solid ${theme.colors.divider}`, fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const viewAllLink = { fontSize: '0.75rem', color: theme.colors.brand, textDecoration: 'underline', fontWeight: 'bold' };
const peekThumbStyle = { width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' };
const notifDropdownStyle = (isMobile) => ({ position: 'absolute', top: 60, right: isMobile ? '-1.5rem' : 0, width: isMobile ? '100vw' : '320px', backgroundColor: '#fff', border: isMobile ? 'none' : `1px solid ${theme.colors.divider}`, borderRadius: isMobile ? 0 : theme.radius.md, boxShadow: theme.shadows.lg, zIndex: 1001, overflow: 'hidden' });
const notifCardStyle = (read) => ({ padding: '1.2rem', borderBottom: `1px solid ${theme.colors.lightGrey}`, cursor: 'pointer', backgroundColor: read ? '#fff' : '#fff1f2' });
const navAvatarStyle = { width: '28px', height: '28px', borderRadius: theme.radius.full, objectFit: 'cover' };
const navAvatarPlaceholderStyle = { width: '28px', height: '28px', borderRadius: theme.radius.full, backgroundColor: theme.colors.charcoal, color: theme.colors.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' };

// --- MOBILE DRAWER STYLES ---
const mobileOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', zIndex: 1999 };
const mobileDrawer = { position: 'fixed', top: 0, right: 0, bottom: 0, width: '85%', maxWidth: '360px', backgroundColor: 'white', zIndex: 2000, boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' };
const drawerHeader = { padding: '1.5rem', borderBottom: `1px solid ${theme.colors.lightGrey}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const closeDrawerBtn = { background: 'none', border: 'none', cursor: 'pointer' };
const mobileStackStyle = { display: 'flex', flexDirection: 'column' };
const mobileLogoutBtn = { ...navLinkStyle(true), border: 'none', color: theme.colors.brand, marginTop: '1rem', backgroundColor: 'transparent', textAlign: 'left', width: '100%', cursor: 'pointer' };

export default Navbar;
