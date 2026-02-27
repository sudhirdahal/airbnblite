import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useSearchParams } from 'react-router-dom';
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
import { AuthProvider, useAuth } from './context/AuthContext'; // --- NEW: CONTEXT IMPORT ---
import { AnimatePresence } from 'framer-motion';

const PageWrapper = ({ children }) => (<div style={{ width: '100%' }}>{children}</div>);

/**
 * ============================================================================
 * HOME COMPONENT (The Discovery Layer)
 * ============================================================================
 */
const Home = ({ listings, loading, onSearch, activeCategory, onCategorySelect, showMap, setShowMap, sort, onSortChange, onHoverListing }) => {
  const { user } = useAuth(); // Consume Global Context
  return (
    <PageWrapper>
      <div style={{ position: 'relative' }}>
        <Hero user={user} />
        <SearchBar onSearch={onSearch} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4rem', maxWidth: '2560px', margin: '0 auto' }}>
          <CategoryBar activeCategory={activeCategory} onSelect={onCategorySelect} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => setShowMap(!showMap)} style={mapToggleStyle}>{showMap ? 'Show List' : 'Show Map'}</button>
            <select value={sort} onChange={(e) => onSortChange(e.target.value)} style={sortSelectStyle}>
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
        {showMap ? <ListingMap listings={listings} /> : <ListingGrid listings={listings} loading={loading} onSearch={onSearch} onHoverListing={onHoverListing} />}
      </div>
    </PageWrapper>
  );
};

/**
 * ============================================================================
 * APP CONTENT (The Route & Sync Orchestrator)
 * ============================================================================
 * UPDATED: Context API Refactor.
 * State for 'user', 'unreadCount', and 'sync' has been lifted to AuthContext.
 */
const AppContent = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthLoading, syncUpdates, logout } = useAuth(); // CONSUME CONTEXT
  
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [hoveredListingId, setHoveredListingId] = useState(null);

  const activeCategory = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const paramsObj = Object.fromEntries([...searchParams]);
      const response = await API.get(`/listings?${new URLSearchParams(paramsObj).toString()}`);
      setListings(response.data);
    } catch (err) {} finally { setLoading(false); }
  }, [searchParams]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleSearch = (np) => { const c = Object.fromEntries([...searchParams]); setSearchParams({ ...c, ...np }); };
  const handleCategorySelect = (id) => { const c = Object.fromEntries([...searchParams]); if (c.category === id) delete c.category; else c.category = id; setSearchParams(c); };
  const handleSortChange = (s) => { const c = Object.fromEntries([...searchParams]); setSearchParams({ ...c, sort: s }); };

  const ProtectedAdminRoute = ({ children }) => {
    if (isAuthLoading) return null; 
    return user?.role === 'admin' ? children : <Navigate to="/" replace />;
  };

  return (
    <div className="app" style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Toaster position="top-center" reverseOrder={false} />
      
      {/* NO MORE PROP DRILLING: Navbar consumes context internally */}
      <Navbar onLogout={logout} resetHomeView={() => setSearchParams({})} />
      
      <main style={{ flex: 1, width: '100%' }}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home listings={listings} loading={loading} onSearch={handleSearch} activeCategory={activeCategory} onCategorySelect={handleCategorySelect} showMap={showMap} setShowMap={setShowMap} sort={sort} onSortChange={handleSortChange} onHoverListing={setHoveredListingId} />} />
            <Route path="/listing/:id" element={<PageWrapper><ListingDetail onChatOpened={syncUpdates} /></PageWrapper>} />
            <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
            <Route path="/signup" element={<PageWrapper><Signup /></PageWrapper>} />
            <Route path="/verify/:token" element={<PageWrapper><VerifyEmail /></PageWrapper>} />
            <Route path="/forgot-password" element={<PageWrapper><ForgotPassword /></PageWrapper>} />
            <Route path="/reset-password" element={<PageWrapper><ResetPassword /></PageWrapper>} />
            <Route path="/profile" element={<PageWrapper><Profile /></PageWrapper>} />
            <Route path="/wishlist" element={<PageWrapper><Wishlist /></PageWrapper>} />
            <Route path="/inbox" element={<PageWrapper><Inbox onThreadOpened={syncUpdates} /></PageWrapper>} />
            <Route path="/pay" element={<PageWrapper><MockPayment /></PageWrapper>} />
            <Route path="/bookings" element={<PageWrapper><Bookings /></PageWrapper>} />
            <Route path="/admin" element={<ProtectedAdminRoute><PageWrapper><AdminDashboard refreshListings={fetchListings} /></PageWrapper></ProtectedAdminRoute>} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <Router>
      <AppContent />
    </Router>
  </AuthProvider>
);

const mapToggleStyle = { padding: '0.6rem 1.2rem', borderRadius: '24px', border: '1px solid #ddd', backgroundColor: '#fff', fontWeight: 'bold', cursor: 'pointer' };
const sortSelectStyle = { padding: '0.6rem', borderRadius: '12px', border: '1px solid #ddd' };

export default App;
