import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 
import { Map as MapIcon, List, ArrowUpDown } from 'lucide-react';
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
import Inbox from './pages/Inbox'; // --- NEW ---
import API from './services/api';

const Home = ({ user, listings, loading, onSearch, activeCategory, onCategorySelect, showMap, setShowMap, sort, onSortChange }) => {
  const userRole = user ? user.role : 'guest';
  return (
    <div style={{ position: 'relative' }}>
      <Hero user={user} />
      <SearchBar onSearch={onSearch} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4rem', maxWidth: '2560px', margin: '0 auto' }}>
        <CategoryBar activeCategory={activeCategory} onSelect={onCategorySelect} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', border: '1px solid #ddd', padding: '0.6rem 1rem', borderRadius: '12px', backgroundColor: '#fff' }}>
          <ArrowUpDown size={16} color="#717171" />
          <select value={sort} onChange={(e) => onSortChange(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', backgroundColor: 'transparent' }}>
            <option value="newest">Newest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>
      <div style={{ width: '100%', margin: '0 auto', padding: showMap ? '0' : '0 2rem' }}>
        {showMap ? <ListingMap listings={listings} /> : <ListingGrid listings={listings} userRole={userRole} loading={loading} onSearch={onSearch} />}
      </div>
      <div style={{ position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
        <button onClick={() => setShowMap(!showMap)} style={{ backgroundColor: '#222', color: 'white', border: 'none', borderRadius: '30px', padding: '0.8rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {showMap ? <><List size={18} /> Show list</> : <><MapIcon size={18} /> Show map</>}
        </button>
      </div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0); // --- NEW: Global Unread ---
  const [showMap, setShowMap] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [searchParams, setSearchParams] = useState({ location: '', checkInDate: '', checkOutDate: '', guests: '', amenities: '' });

  // Poll for messages every 60 seconds
  useEffect(() => {
    if (!user) return;
    const checkMessages = async () => {
      try {
        const res = await API.get('/auth/inbox');
        const count = res.data.reduce((acc, curr) => acc + curr.unreadCount, 0);
        setUnreadCount(count);
      } catch (err) {}
    };
    checkMessages();
    const interval = setInterval(checkMessages, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      API.get('/auth/profile').then(r => { setUser(r.data); setIsAuthLoading(false); }).catch(() => { handleLogout(); setIsAuthLoading(false); });
    } else setIsAuthLoading(false);
    fetchListings();
  }, []);

  const fetchListings = async (params = searchParams, category = activeCategory, currentSort = sort) => {
    setLoading(true);
    try {
      let url = `/listings?sort=${currentSort}&`;
      if (params.location) url += `location=${params.location}&`;
      if (category) url += `category=${category}&`;
      if (params.guests) url += `guests=${params.guests}&`;
      if (params.checkInDate) url += `checkInDate=${params.checkInDate}&`;
      if (params.checkOutDate) url += `checkOutDate=${params.checkOutDate}&`;
      if (params.amenities) url += `amenities=${params.amenities}&`;
      const response = await API.get(url);
      setListings(response.data);
    } catch (err) {} finally { setTimeout(() => setLoading(false), 600); }
  };

  const handleSearch = (newParams) => { setSearchParams(newParams); fetchListings(newParams, activeCategory, sort); };
  const handleCategorySelect = (category) => { const newCategory = activeCategory === category ? '' : category; setActiveCategory(newCategory); fetchListings(searchParams, newCategory, sort); };
  const handleSortChange = (newSort) => { setSort(newSort); fetchListings(searchParams, activeCategory, newSort); };
  const handleLogout = async () => { try { await API.post('/auth/logout-all'); } catch (err) {} localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); };
  const resetHome = () => { setShowMap(false); setActiveCategory(''); setSort('newest'); setSearchParams({ location: '', checkInDate: '', checkOutDate: '', guests: '', amenities: '' }); fetchListings({ location: '', checkInDate: '', checkOutDate: '', guests: '', amenities: '' }, '', 'newest'); };

  const ProtectedAdminRoute = ({ children }) => {
    if (isAuthLoading) return null;
    return user?.role === 'admin' ? children : <Navigate to="/" replace />;
  };

  return (
    <Router>
      <div className="app" style={{ fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Toaster position="top-center" reverseOrder={false} />
        {/* Pass unreadCount to Navbar */}
        <Navbar userRole={user ? user.role : 'guest'} onLogout={handleLogout} resetHomeView={resetHome} unreadCount={unreadCount} />
        <main style={{ flex: 1, width: '100%' }}>
          <Routes>
            <Route path="/" element={<Home user={user} listings={listings} loading={loading} onSearch={handleSearch} activeCategory={activeCategory} onCategorySelect={handleCategorySelect} showMap={showMap} setShowMap={setShowMap} sort={sort} onSortChange={handleSortChange} />} />
            <Route path="/listing/:id" element={<ListingDetail userRole={user ? user.role : 'guest'} user={user} />} />
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify/:token" element={<VerifyEmail setUser={setUser} />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
            <Route path="/wishlist" element={<Wishlist user={user} />} />
            <Route path="/inbox" element={<Inbox />} />
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
