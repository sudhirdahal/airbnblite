import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useSearchParams } from 'react-router-dom'; // --- UPDATED: Added useSearchParams ---
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
import { AnimatePresence } from 'framer-motion';

/**
 * ============================================================================
 * ANIMATED CONTENT WRAPPER
 * ============================================================================
 */
const PageWrapper = ({ children }) => (
  <div style={{ width: '100%' }}>
    {children}
  </div>
);

/**
 * ============================================================================
 * HOME COMPONENT (The URL-Aware Discovery Layer)
 * ============================================================================
 * UPDATED: Now reacts exclusively to SearchParams.
 * Logic: When the URL changes, the parent AppContent re-fetches data,
 * and this component renders the results.
 */
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
            listings={listings} userRole={user?.role} loading={loading} onSearch={onSearch} user={user} 
            onHoverListing={onHoverListing}
          />
        )}
      </div>
    </PageWrapper>
  );
};

/**
 * ============================================================================
 * MAIN APP CONTENT (The Stateless Search Authority)
 * ============================================================================
 * OVERHAUL: Migrated from Component State to URL State.
 * This component now uses 'useSearchParams' as the single source of truth
 * for all discovery filters, enabling Deep-Linking and Refresh Persistence.
 */
const AppContent = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams(); // --- THE URL ENGINE ---
  
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [hoveredListingId, setHoveredListingId] = useState(null);

  /**
   * EXTRACTOR LOGIC
   * Pulls current filter values directly from the URL.
   */
  const activeCategory = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const currentFilters = {
    location: searchParams.get('location') || '',
    guests: searchParams.get('guests') || '',
    amenities: searchParams.get('amenities') || ''
  };

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
  }, []);

  /**
   * DATA FETCHING ENGINE (V3 - URL Reactive)
   * This effect fires every time the searchParams change, 
   * ensuring the UI is always in sync with the URL.
   */
  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const paramsObj = Object.fromEntries([...searchParams]);
      const queryString = new URLSearchParams(paramsObj).toString();
      const response = await API.get(`/listings?${queryString}`);
      setListings(response.data);
    } catch (err) {
      console.error('Search Failure');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  /**
   * STATE MUTATORS (URL Directed)
   * These functions no longer set local state; they update the URL.
   */
  const handleSearch = (newParams) => {
    const current = Object.fromEntries([...searchParams]);
    setSearchParams({ ...current, ...newParams });
  };

  const handleCategorySelect = (categoryId) => {
    const current = Object.fromEntries([...searchParams]);
    if (current.category === categoryId) delete current.category;
    else current.category = categoryId;
    setSearchParams(current);
  };

  const handleSortChange = (newSort) => {
    const current = Object.fromEntries([...searchParams]);
    setSearchParams({ ...current, sort: newSort });
  };

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
        resetHomeView={() => setSearchParams({})} // Clear URL to reset home
        unreadCount={unreadCount}
        notifications={notifications}
        onNotificationRead={syncUpdates}
        onInboxClick={syncUpdates}
      />
      
      <main style={{ flex: 1, width: '100%' }}>
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

export default App;
