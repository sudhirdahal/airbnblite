import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

/**
 * ============================================================================
 * HOME COMPONENT (The Interactive Discovery Layer)
 * ============================================================================
 * Manages the transition between Map and Grid view, and handles sorting.
 */
const Home = ({ user, listings, loading, onSearch, activeCategory, onCategorySelect, showMap, setShowMap, sort, onSortChange }) => {
  const userRole = user ? user.role : 'guest';
  return (
    <div style={{ position: 'relative' }}>
      <Hero user={user} />
      <SearchBar onSearch={onSearch} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4rem', maxWidth: '2560px', margin: '0 auto' }}>
        <CategoryBar activeCategory={activeCategory} onSelect={onCategorySelect} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', border: '1px solid #ddd', padding: '0.6rem 1rem', borderRadius: '12px', backgroundColor: '#fff' }}>
          <select value={sort} onChange={(e) => onSortChange(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', backgroundColor: 'transparent' }}>
            <option value="newest">Newest First</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option><option value="rating">Top Rated</option>
          </select>
        </div>
      </div>
      <div style={{ width: '100%', margin: '0 auto', padding: showMap ? '0' : '0 2rem' }}>
        {showMap ? <ListingMap listings={listings} /> : <ListingGrid listings={listings} userRole={userRole} loading={loading} onSearch={onSearch} />}
      </div>
    </div>
  );
};

/**
 * ============================================================================
 * MAIN APP COMPONENT (The Global State Authority)
 * ============================================================================
 * Initially just a routing container. It has evolved into the central 
 * synchronization hub for Auth, Real-time Alerts, and Global Search.
 */
const App = () => {
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

  /**
   * CENTRALIZED SYNC ENGINE (Phase 8 Scalability)
   * Fetches the latest global alerts from the database.
   */
  const syncUpdates = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const [inboxRes, notifRes] = await Promise.all([
        API.get('/auth/inbox'),
        API.get('/auth/notifications')
      ]);
      const totalUnread = inboxRes.data.reduce((acc, curr) => acc + curr.unreadCount, 0);
      setUnreadCount(totalUnread);
      setNotifications(notifRes.data);
    } catch (err) {}
  };

  /**
   * SOCKET NOTIFICATION LISTENER
   * Listen for 'Push' events from the server to avoid high-overhead polling.
   */
  useEffect(() => {
    if (!user) return;
    socket.emit('identify', user._id || user.id);
    syncUpdates(); // Initial sync

    const handleInstantUpdate = () => {
      syncUpdates(); // Re-sync on every server push
    };

    socket.on('new_notification', handleInstantUpdate);
    socket.on('new_message_alert', handleInstantUpdate);
    
    return () => {
      socket.off('new_notification', handleInstantUpdate);
      socket.off('new_message_alert', handleInstantUpdate);
    };
  }, [user]);

  // Auth Initialization logic
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      API.get('/auth/profile').then(r => { setUser(r.data); setIsAuthLoading(false); }).catch(() => { handleLogout(); setIsAuthLoading(false); });
    } else setIsAuthLoading(false);
    fetchListings();
  }, []);

  /**
   * GLOBAL API DISPATCHER
   * Formats complex search and sort queries into a unified backend request.
   */
  const fetchListings = async (p = searchParams, c = activeCategory, s = sort) => {
    setLoading(true);
    try {
      let url = `/listings?sort=${s}&`;
      if (p.location) url += `location=${p.location}&`;
      if (c) url += `category=${c}&`;
      if (p.guests) url += `guests=${p.guests}&`;
      if (p.checkInDate) url += `checkInDate=${p.checkInDate}&`;
      if (p.checkOutDate) url += `checkOutDate=${p.checkOutDate}&`;
      if (p.amenities) url += `amenities=${p.amenities}&`;
      const response = await API.get(url);
      setListings(response.data);
    } catch (err) {} finally { setTimeout(() => setLoading(false), 600); }
  };

  const handleSearch = (np) => { setSearchParams(p => ({...p, ...np})); fetchListings({...searchParams, ...np}, activeCategory, sort); };
  const handleCategorySelect = (c) => { const nc = activeCategory === c ? '' : c; setActiveCategory(nc); fetchListings(searchParams, nc, sort); };
  const handleSortChange = (ns) => { setSort(ns); fetchListings(searchParams, activeCategory, ns); };
  const handleLogout = async () => { try { await API.post('/auth/logout-all'); } catch (err) {} localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); };

  /**
   * ============================================================================
   * PROTECTED ROUTE ARCHITECTURE (The 404/Redirect Fix)
   * ============================================================================
   * HISTORICAL CONTEXT: Initially, routes were unprotected or used naive checks
   * like `user?.role === 'admin' ? ...`. This caused immediate redirects to "/" 
   * on page refreshes because 'user' was null for 100ms during API boot.
   */
  const ProtectedAdminRoute = ({ children }) => {
    if (isAuthLoading) return null; // Wait for the API to confirm user status
    return user?.role === 'admin' ? children : <Navigate to="/" replace />;
  };

  /* --- STAGE 1: PRIMITIVE ROUTING ---
   * <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
   */

  return (
    <Router>
      <div className="app" style={{ fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
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
          <Routes>
            <Route path="/" element={<Home user={user} listings={listings} loading={loading} onSearch={handleSearch} activeCategory={activeCategory} onCategorySelect={handleCategorySelect} showMap={showMap} setShowMap={setShowMap} sort={sort} onSortChange={handleSortChange} />} />
            <Route path="/listing/:id" element={<ListingDetail userRole={user ? user.role : 'guest'} user={user} onChatOpened={syncUpdates} />} />
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify/:token" element={<VerifyEmail setUser={setUser} />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
            <Route path="/wishlist" element={<Wishlist user={user} />} />
            <Route path="/inbox" element={<Inbox user={user} onThreadOpened={syncUpdates} />} />
            <Route path="/pay" element={<MockPayment />} />
            <Route path="/bookings" element={user ? <Bookings /> : <Navigate to="/login" replace />} />
            <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard user={user} refreshListings={fetchListings} /></ProtectedAdminRoute>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
