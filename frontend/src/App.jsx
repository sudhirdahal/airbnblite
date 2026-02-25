import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 
import Navbar from './components/layout/Navbar';
import Hero from './components/layout/Hero'; // --- NEW: Hero Component ---
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
import API from './services/api';
import { Map as MapIcon, List } from 'lucide-react';

const Home = ({ user, listings, loading, onSearch, activeCategory, onCategorySelect, showMap, setShowMap }) => {
  const userRole = user ? user.role : 'guest';
  
  return (
    <div style={{ position: 'relative' }}>
      {/* --- NEW: Modern Hero Section --- */}
      <Hero user={user} />

      {/* OLD CODE (Commented out as requested):
      <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#fff' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
          {user?.role === 'admin' ? "Manage your properties or explore stays" : 
           user ? `Where to next, ${user.name.split(' ')[0]}?` : 
           "Find your next adventure"}
        </h2>
        {user ? (
          <p style={{ color: '#717171' }}>Logged in as <strong>{user.name}</strong> ({user.role})</p>
        ) : (
          <p style={{ color: '#717171' }}>Log in to experience full features of AirBnB Lite.</p>
        )}
      </div>
      */}

      <SearchBar onSearch={onSearch} />
      <CategoryBar activeCategory={activeCategory} onSelect={onCategorySelect} />
      
      <div style={{ width: '100%', margin: '0 auto', padding: showMap ? '0' : '0 2rem' }}>
        {showMap ? (
          <ListingMap listings={listings} />
        ) : (
          <ListingGrid listings={listings} userRole={userRole} loading={loading} />
        )}
      </div>
      
      <div style={{ position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
        <button 
          onClick={() => setShowMap(!showMap)}
          style={{
            backgroundColor: '#222', color: 'white', border: 'none', borderRadius: '30px', padding: '0.8rem 1.2rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'transform 0.2s'
          }}
        >
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
  const [showMap, setShowMap] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [searchParams, setSearchParams] = useState({
    location: '', checkInDate: '', checkOutDate: '', guests: '', minPrice: '', maxPrice: ''
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      API.get('/auth/profile')
        .then(response => setUser(response.data))
        .catch(() => handleLogout());
    }
    
    fetchListings();
  }, []);

  const fetchListings = async (params = searchParams, category = activeCategory) => {
    setLoading(true);
    try {
      let url = '/listings?';
      if (params.location) url += `location=${params.location}&`;
      if (category) url += `category=${category}&`;
      if (params.minPrice) url += `minPrice=${params.minPrice}&`;
      if (params.maxPrice) url += `maxPrice=${params.maxPrice}&`;
      if (params.guests) url += `guests=${params.guests}&`;
      if (params.checkInDate) url += `checkInDate=${params.checkInDate}&`;
      if (params.checkOutDate) url += `checkOutDate=${params.checkOutDate}&`;

      if (url.endsWith('&')) url = url.slice(0, -1);
      if (url.endsWith('?')) url = url.slice(0, -1);
      
      const response = await API.get(url);
      setListings(response.data);
    } catch (err) {
      console.error('Error fetching listings:', err);
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  const handleSearch = (newParams) => {
    setSearchParams(newParams);
    fetchListings(newParams, activeCategory);
  };

  const handleCategorySelect = (category) => {
    const newCategory = activeCategory === category ? '' : category;
    setActiveCategory(newCategory);
    fetchListings(searchParams, newCategory);
  };

  const handleLogout = async () => {
    try {
      await API.post('/auth/logout-all');
    } catch (err) {
      console.error('Global logout failed', err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const resetHome = () => {
    setShowMap(false);
    setActiveCategory('');
    setSearchParams({ location: '', checkInDate: '', checkOutDate: '', guests: '', minPrice: '', maxPrice: '' });
    fetchListings({ location: '', checkInDate: '', checkOutDate: '', guests: '', minPrice: '', maxPrice: '' }, '');
  };

  return (
    <Router>
      <div className="app" style={{ fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Toaster position="top-center" reverseOrder={false} />
        <Navbar userRole={user ? user.role : 'guest'} onLogout={handleLogout} resetHomeView={resetHome} />
        <main style={{ flex: 1, width: '100%' }}>
          <Routes>
            <Route path="/" element={<Home user={user} listings={listings} loading={loading} onSearch={handleSearch} activeCategory={activeCategory} onCategorySelect={handleCategorySelect} showMap={showMap} setShowMap={setShowMap} />} />
            <Route path="/listing/:id" element={<ListingDetail userRole={user ? user.role : 'guest'} user={user} />} />
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify/:token" element={<VerifyEmail setUser={setUser} />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
            <Route path="/wishlist" element={<Wishlist user={user} />} />
            <Route path="/pay" element={<MockPayment />} />
            <Route path="/bookings" element={user ? <Bookings /> : <Navigate to="/login" replace />} />
            <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard user={user} refreshListings={fetchListings} /> : <Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
