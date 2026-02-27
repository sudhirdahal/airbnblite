import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'; // --- UPDATED: Added useLocation ---
import { Toaster } from 'react-hot-toast'; 
import Navbar from './components/layout/Navbar';
import Hero from './components/layout/Hero'; 
import SearchBar from './components/layout/SearchBar';
import CategoryBar from './components/layout/CategoryBar';
import Footer from './components/layout/Footer';
import ListingGrid from './components/listings/ListingGrid';
import ListingMap from './components/listings/ListingMap';
import ListingDetail from './pages/ListingDetail';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Bookings from './pages/Bookings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import VerifyEmail from './pages/VerifyEmail';
import Wishlist from './pages/Wishlist';
import MockPayment from './pages/MockPayment';
import Inbox from './pages/Inbox';
import API from './services/api';
import socket from './services/socket';
import { motion, AnimatePresence } from 'framer-motion'; // --- NEW: ANIMATION HUB ---

/**
 * ============================================================================
 * ANIMATED CONTENT WRAPPER
 * ============================================================================
 * Logic: Wraps every route in a cinematic fade-in transition.
 * This establishes the 'Visual Continuity' pattern of high-end SaaS apps.
 */
const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    style={{ width: '100%' }}
  >
    {children}
  </motion.div>
);

const Home = ({ user, listings, loading, onSearch, activeCategory, onCategorySelect, showMap, setShowMap, sort, onSortChange, onHoverListing }) => {
  return (
    <PageWrapper>
      <div style={{ position: 'relative' }}>
        <Hero user={user} />
        <SearchBar onSearch={onSearch} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4rem', maxWidth: '2560px', margin: '0 auto' }}>
          <CategoryBar activeCategory={activeCategory} onSelect={onCategorySelect} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={() => setShowMap(!showMap)}
              style={{ padding: '0.6rem 1.2rem', borderRadius: '24px', border: '1px solid #ddd', backgroundColor: '#fff', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {showMap ? 'Show List' : 'Show Map'}
            </button>
            <select value={sort} onChange={(e) => onSortChange(e.target.value)} style={{ padding: '0.6rem', borderRadius: '12px', border: '1px solid #ddd' }}>
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
        
        {showMap ? (
          <ListingMap listings={listings} />
        ) : (
          <ListingGrid 
            listings={listings} userRole={user?.role} loading={loading} onSearch={handleSearch} user={user} 
            onHoverListing={onHoverListing}
          />
        )}
      </div>
    </PageWrapper>
  );
};

/**
 * ============================================================================
 * MAIN APP COMPONENT (V11 - THE CINEMATIC NAVIGATION UPDATE)
 * ============================================================================
 * OVERHAUL: Integrated 'AnimatePresence' for professional route transitions.
 * Every page transition now features a smooth fade-and-glide effect,
 * eliminating the jarring 'Snap' of traditional web navigation.
 */
const AppContent = () => {
  const location = useLocation(); // Track location for animation keys
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [searchParams, setSearchParams] = useState({ location: '', checkInDate: '', checkOutDate: '', guests: '', amenities: '' });
  const [hoveredListingId, setHoveredListingId] = useState(null);

  const syncUpdates = useCallback(async () => {
    if (!localStorage.getItem('token')) return;
    try {
      const [inboxRes, notifRes] = await Promise.all([
        API.get('/auth/inbox'),
        API.get('/auth/notifications')
      ]);
      setUnreadCount(inboxRes.data.reduce((acc, curr) => acc + curr.unreadCount, 0));
      setNotifications(notifRes.data);
    } catch (err) {}
  }, []);

  useEffect(() => {
    if (!user) return;
    socket.emit('identify', user._id || user.id);
    syncUpdates();
    const handleInstantAlert = () => { syncUpdates(); };
    socket.on('new_notification', handleInstantAlert);
    socket.on('new_message_alert', handleInstantAlert);
    return () => {
      socket.off('new_notification', handleInstantAlert);
      socket.off('new_message_alert', handleInstantAlert);
    };
  }, [user, syncUpdates]);

  useEffect(() => {
    const initAuth = async () => {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (savedUser && token) {
        try {
          const res = await API.get('/auth/profile');
          setUser(res.data);
        } catch (e) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setIsAuthLoading(false);
    };
    initAuth();
    fetchListings();
  }, []);

  const fetchListings = async (p = searchParams, c = activeCategory, s = sort) => {
    setLoading(true);
    try {
      let url = `/listings?sort=${s}&`;
      if (p.location) url += `location=${p.location}&`;
      if (c) url += `category=${c}&`;
      if (p.guests) url += `guests=${p.guests}&`;
      const response = await API.get(url);
      setListings(response.data);
    } catch (err) {} finally { setLoading(false); }
  };

  const handleSearch = (np) => { setSearchParams(p => ({...p, ...np})); fetchListings({...searchParams, ...np}, activeCategory, sort); };
  const handleCategorySelect = (c) => { const nc = activeCategory === c ? '' : c; setActiveCategory(nc); fetchListings(searchParams, nc, sort); };
  const handleSortChange = (ns) => { setSort(ns); fetchListings(searchParams, activeCategory, ns); };
  const handleLogout = async () => { try { await API.post('/auth/logout-all'); } catch (err) {} localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); };

  const ProtectedAdminRoute = ({ children }) => {
    if (isAuthLoading) return null; 
    return user?.role === 'admin' ? children : <Navigate to="/" replace />;
  };

  return (
    <div className="app" style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar 
        userRole={user ? user.role : 'guest'} 
        onLogout={handleLogout} 
        resetHomeView={() => { setShowMap(false); setActiveCategory(''); setSort('newest'); }} 
        unreadCount={unreadCount}
        notifications={notifications}
        onNotificationRead={syncUpdates}
        onInboxClick={syncUpdates}
      />
      
      <main style={{ flex: 1, width: '100%' }}>
        {/* --- CINEMATIC ROUTE ORCHESTRATOR --- */}
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home user={user} listings={listings} loading={loading} onSearch={handleSearch} activeCategory={activeCategory} onCategorySelect={handleCategorySelect} showMap={showMap} setShowMap={setShowMap} sort={sort} onSortChange={handleSortChange} onHoverListing={setHoveredListingId} />} />
            
            <Route path="/listing/:id" element={<PageWrapper><ListingDetail user={user} onChatOpened={syncUpdates} /></PageWrapper>} />
            <Route path="/login" element={<PageWrapper><Login setUser={setUser} /></PageWrapper>} />
            <Route path="/signup" element={<PageWrapper><Signup /></PageWrapper>} />
            <Route path="/verify/:token" element={<PageWrapper><VerifyEmail setUser={setUser} /></PageWrapper>} />
            <Route path="/forgot-password" element={<PageWrapper><ForgotPassword /></PageWrapper>} />
            <Route path="/reset-password" element={<PageWrapper><ResetPassword /></PageWrapper>} />
            <Route path="/profile" element={<PageWrapper><Profile user={user} setUser={setUser} /></PageWrapper>} />
            <Route path="/wishlist" element={<PageWrapper><Wishlist user={user} /></PageWrapper>} />
            <Route path="/inbox" element={<PageWrapper><Inbox user={user} onThreadOpened={syncUpdates} /></PageWrapper>} />
            <Route path="/pay" element={<PageWrapper><MockPayment /></PageWrapper>} />
            <Route path="/bookings" element={<PageWrapper><Bookings /></PageWrapper>} />
            <Route path="/admin" element={<ProtectedAdminRoute><PageWrapper><AdminDashboard user={user} refreshListings={fetchListings} /></PageWrapper></ProtectedAdminRoute>} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};

const App = () => (
  <Router>
    <AppContent />
  </Router>
);

/* --- HISTORICAL STAGE 1: STATIC NAVIGATION ---
 * return (
 *   <Routes>
 *     <Route path="/" element={<Home />} />
 *   </Routes>
 * );
 * // Problem: Instant snaps between pages felt jarring and amateur.
 */

export default App;
