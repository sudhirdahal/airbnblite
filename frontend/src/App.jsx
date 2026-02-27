import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 
import Navbar from './components/layout/Navbar';
import Hero from './components/layout/Hero'; 
import SearchBar from './components/layout/SearchBar';
import CategoryBar from './components/layout/CategoryBar';
import Footer from './components/layout/Footer';
import ListingGrid from './components/listings/ListingGrid';
import ListingMap from './components/listings/ListingMap';
import API from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext'; 
import { AnimatePresence } from 'framer-motion';

/**
 * ============================================================================
 * PHASE 24: DYNAMIC IMPORT ORCHESTRATION (Lazy Loading)
 * ============================================================================
 * Logic: We utilize React.lazy to split the application into 'Chunks'.
 * Instead of one massive JS file, the browser now downloads small, 
 * page-specific files only when needed.
 */
const ListingDetail = lazy(() => import('./pages/ListingDetail'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Bookings = lazy(() => import('./pages/Bookings'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Profile = lazy(() => import('./pages/Profile'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const MockPayment = lazy(() => import('./pages/MockPayment'));
const Inbox = lazy(() => import('./pages/Inbox'));

/* --- HISTORICAL STAGE 1: STATIC IMPORTS ---
 * import ListingDetail from './pages/ListingDetail';
 * import AdminDashboard from './pages/AdminDashboard';
 * // Problem: The user had to download the Admin code even if they were a Guest!
 */

const PageWrapper = ({ children }) => (<div style={{ width: '100%' }}>{children}</div>);

/**
 * LOADING FALLBACK
 * A high-fidelity structural placeholder for lazy components.
 */
const PageLoader = () => (
  <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="spin" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #ff385c', borderRadius: '50%' }} />
  </div>
);

const Home = ({ listings, loading, onSearch, activeCategory, onCategorySelect, showMap, setShowMap, sort, onSortChange, onHoverListing }) => {
  const { user } = useAuth();
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

const AppContent = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthLoading, syncUpdates, logout } = useAuth();
  
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
      <Navbar onLogout={logout} resetHomeView={() => setSearchParams({})} />
      
      <main style={{ flex: 1, width: '100%' }}>
        {/* --- SUSPENSE BOUNDARY --- 
            Wraps lazy components to handle the loading transition. */}
        <Suspense fallback={<PageLoader />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Home listings={listings} loading={loading} onSearch={handleSearch} activeCategory={activeCategory} onCategorySelect={handleCategorySelect} showMap={showMap} setShowMap={setShowMap} sort={sort} onSortChange={handleSortChange} onHoverListing={setHoveredListingId} />} />
              <Route path="/listing/:id" element={<PageWrapper><ListingDetail user={user} onChatOpened={syncUpdates} /></PageWrapper>} />
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
              <Route path="/admin" element={<ProtectedAdminRoute><PageWrapper><AdminDashboard user={user} refreshListings={fetchListings} /></PageWrapper></ProtectedAdminRoute>} />
            </Routes>
          </AnimatePresence>
        </Suspense>
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
