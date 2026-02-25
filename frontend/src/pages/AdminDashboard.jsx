import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Trash, Edit, Calendar, User as UserIcon, X, Upload, BarChart3, TrendingUp, DollarSign, LayoutDashboard, ListChecks } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Bar } from 'react-chartjs-2'; 
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import API from '../services/api';
import PageHeader from '../components/layout/PageHeader';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * AdminDashboard Component: A sophisticated management interface for property owners.
 * Features:
 * - Animated tab switching via AnimatePresence.
 * - Interactive tables with high-res thumbnails.
 * - Deep linking: Click properties to view details, click guests to view profiles.
 * - Revenue analytics via Chart.js.
 */
const AdminDashboard = ({ user, refreshListings }) => {
  const [activeTab, setActiveTab] = useState('listings');
  const [adminListings, setAdminListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    _id: null, title: '', location: '', description: '', fullDescription: '', 
    rate: '', category: 'pools', images: [], lat: '', lng: '', imageUrlInput: '' 
  });
  const [isUploading, setIsUploading] = useState(false);

  // Re-fetch data whenever the user toggles between 'Listings' and 'Bookings'
  useEffect(() => { fetchAdminData(); }, [activeTab]);

  /**
   * Data Fetcher: Segments API calls based on active tab context.
   */
  const fetchAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'listings') {
        // Fetch only listings owned by this specific admin
        const response = await API.get(`/listings?adminId=${user.id || user._id}`);
        setAdminListings(response.data);
      } else {
        // Fetch reservations made for any of this admin's listings
        const response = await API.get('/bookings/admin');
        setBookings(response.data);
      }
    } catch (err) {
      toast.error("Failed to load dashboard data");
    } finally { setLoading(false); }
  };

  /**
   * Analytics: Aggregates booking revenue by month for the chart.
   */
  const getChartData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const revenueByMonth = new Array(12).fill(0);
    bookings.forEach(booking => {
      const date = new Date(booking.createdAt);
      revenueByMonth[date.getMonth()] += booking.totalPrice;
    });
    return { 
      labels: months, 
      datasets: [{ 
        label: 'Revenue ($)', 
        data: revenueByMonth, 
        backgroundColor: '#ff385c', 
        borderRadius: 8 
      }] 
    };
  };

  const totalRevenue = bookings.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const totalBookings = bookings.length;

  // ... (Form handling logic with Toast integrations)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const data = new FormData(); data.append('image', file); 
    setIsUploading(true); 
    const uploadToast = toast.loading('Uploading...');
    try {
      const response = await API.post('/listings/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFormData(prev => ({ ...prev, images: [...prev.images, response.data.imageUrl] }));
      toast.success('Uploaded!', { id: uploadToast });
    } catch (err) { toast.error('Failed', { id: uploadToast }); } finally { setIsUploading(false); }
  };

  const toggleForm = () => {
    setShowForm(prev => {
      if (prev) setFormData({ _id: null, title: '', location: '', description: '', fullDescription: '', rate: '', category: 'pools', images: [], lat: '', lng: '', imageUrlInput: '' });
      return !prev;
    });
  };

  const handleEditClick = (listing) => {
    setFormData({ _id: listing._id, title: listing.title, location: listing.location, description: listing.description, fullDescription: listing.fullDescription, rate: listing.rate, category: listing.category, images: listing.images, lat: listing.coordinates.lat, lng: listing.coordinates.lng, imageUrlInput: '' });
    setShowForm(true); 
  };

  const handleCreateOrUpdateListing = async (e) => {
    e.preventDefault(); 
    const finalImages = [...formData.images];
    if (formData.imageUrlInput) finalImages.push(...formData.imageUrlInput.split(',').map(url => url.trim()).filter(url => url));
    if (finalImages.length === 0) return toast.error('Need at least one image');
    const saveToast = toast.loading('Saving...');
    try {
      const payload = { ...formData, images: finalImages, rate: Number(formData.rate), coordinates: { lat: Number(formData.lat || 0), lng: Number(formData.lng || 0) }, host: { name: user.name, avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80' } };
      if (formData._id) await API.put(`/listings/${formData._id}`, payload);
      else await API.post('/listings', payload);
      toast.success('Done!', { id: saveToast });
      toggleForm(); fetchAdminData(); refreshListings();   
    } catch (err) { toast.error('Error', { id: saveToast }); }
  };

  const handleDeleteListing = async (id) => {
    if (!window.confirm('Are you sure?')) return; 
    const deleteToast = toast.loading('Deleting...');
    try {
      await API.delete(`/listings/${id}`); 
      toast.success('Deleted', { id: deleteToast });
      fetchAdminData(); refreshListings();   
    } catch (err) { toast.error('Failed', { id: deleteToast }); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '2560px', width: '98%', margin: '2rem auto', padding: '0 2rem' }}>
      {/* PROFESSIONAL PAGE HEADER */}
      <PageHeader 
        title="Admin Dashboard" 
        subtitle={`Welcome, ${user.name}. You are managing ${adminListings.length} properties.`} 
        icon={LayoutDashboard}
      />
      
      {/* MODERN TAB NAVIGATION */}
      <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid #ddd', marginBottom: '2rem' }}>
        <button onClick={() => setActiveTab('listings')} style={tabButtonStyle(activeTab === 'listings')}>My Listings</button>
        <button onClick={() => setActiveTab('bookings')} style={tabButtonStyle(activeTab === 'bookings')}>Manage Bookings</button>
        <button onClick={() => setActiveTab('insights')} style={tabButtonStyle(activeTab === 'insights')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={18} /> Revenue Insights</div>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'insights' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {/* KPI Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
              <div style={statCardStyle}><DollarSign color="#4f46e5" /><div><p style={statLabelStyle}>Total Revenue</p><h3 style={statValueStyle}>${totalRevenue.toLocaleString()}</h3></div></div>
              <div style={statCardStyle}><Calendar color="#ff385c" /><div><p style={statLabelStyle}>Bookings</p><h3 style={statValueStyle}>{totalBookings}</h3></div></div>
            </div>
            {/* Revenue Chart Box */}
            <div style={chartBoxStyle}><h3>Monthly Performance</h3><div style={{ height: '350px' }}><Bar data={getChartData()} options={{ maintainAspectRatio: false }} /></div></div>
          </motion.div>
        )}

        {activeTab === 'listings' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ margin: 0 }}>Active Properties</h3>
              <button onClick={toggleForm} style={primaryButtonStyle}>{showForm ? 'Cancel' : 'Create New Listing'}</button>
            </div>
            
            {showForm && (
              <div style={formContainerStyle}>
                <form onSubmit={handleCreateOrUpdateListing} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <input type="text" name="title" placeholder="Title" value={formData.title} onChange={handleChange} style={inputStyle} required />
                  <input type="text" name="location" placeholder="Location" value={formData.location} onChange={handleChange} style={inputStyle} required />
                  <input type="number" name="rate" placeholder="Nightly Rate ($)" value={formData.rate} onChange={handleChange} style={inputStyle} required />
                  <select name="category" value={formData.category} onChange={handleChange} style={inputStyle}>
                    <option value="pools">Amazing Pools</option><option value="beach">Beachfront</option><option value="cabins">Cabins</option>
                  </select>
                  <button type="submit" style={{ ...primaryButtonStyle, gridColumn: 'span 2' }}>Save Property</button>
                </form>
              </div>
            )}

            {/* MODERNIZED LISTINGS TABLE */}
            <div style={tableWrapperStyle}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={tableHeaderRowStyle}>
                    <th style={thStyle}>Listing Details</th>
                    <th style={thStyle}>Category</th>
                    <th style={thStyle}>Nightly Rate</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminListings.map(l => (
                    <motion.tr key={l._id} whileHover={{ backgroundColor: '#fafafa' }} style={tableRowStyle}>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                          {/* CLICKABLE THUMBNAIL */}
                          <Link to={`/listing/${l._id}`}>
                            <img 
                              src={l.images[0]} 
                              alt={l.title} 
                              style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #eee', cursor: 'pointer' }} 
                            />
                          </Link>
                          <div>
                            {/* CLICKABLE TITLE */}
                            <Link to={`/listing/${l._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                              <div style={{ fontWeight: '700', color: '#222', cursor: 'pointer' }}>{l.title}</div>
                            </Link>
                            <div style={{ fontSize: '0.8rem', color: '#717171' }}>{l.location}</div>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}><span style={categoryBadgeStyle}>{l.category}</span></td>
                      <td style={tdStyle}><span style={{ fontWeight: '700' }}>${l.rate}</span></td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleEditClick(l)} style={actionButtonStyle}><Edit size={16} /></button>
                          <button onClick={() => handleDeleteListing(l._id)} style={{ ...actionButtonStyle, color: '#ff385c' }}><Trash size={16} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'bookings' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Upcoming Reservations</h3>
            <div style={tableWrapperStyle}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={tableHeaderRowStyle}>
                    <th style={thStyle}>Guest</th>
                    <th style={thStyle}>Reserved Stay</th>
                    <th style={thStyle}>Check-In/Out</th>
                    <th style={thStyle}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b._id} style={tableRowStyle}>
                      <td style={tdStyle}>
                        {/* CLICKABLE GUEST PROFILE */}
                        <Link to="/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                            <div style={avatarCircleStyle}>{b.userId?.name.charAt(0)}</div>
                            <div>
                              <div style={{ fontWeight: '700' }}>{b.userId?.name}</div>
                              <div style={{ fontSize: '0.75rem', color: '#717171' }}>{b.userId?.email}</div>
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td style={tdStyle}>
                        {/* CLICKABLE PROPERTY INFO WITH THUMBNAIL */}
                        <Link to={`/listing/${b.listingId?._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}>
                            <img src={b.listingId?.images?.[0]} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} alt="Listing" />
                            <span style={{ fontWeight: '500' }}>{b.listingId?.title}</span>
                          </div>
                        </Link>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: '0.85rem' }}>
                          {new Date(b.checkIn).toLocaleDateString()} - {new Date(b.checkOut).toLocaleDateString()}
                        </div>
                      </td>
                      <td style={tdStyle}><span style={{ color: '#1d7044', fontWeight: '700' }}>+${b.totalPrice}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- STYLES ---
const tabButtonStyle = (isActive) => ({ padding: '1rem 0', background: 'none', border: 'none', borderBottom: isActive ? '3px solid #ff385c' : '3px solid transparent', color: isActive ? '#000' : '#717171', fontWeight: isActive ? 'bold' : '600', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.3s' });
const primaryButtonStyle = { backgroundColor: '#222', color: 'white', border: 'none', padding: '0.7rem 1.4rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem' };
const inputStyle = { padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' };
const formContainerStyle = { border: '1px solid #eee', padding: '2rem', borderRadius: '16px', marginBottom: '2.5rem', backgroundColor: '#f9f9f9', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' };
const tableWrapperStyle = { border: '1px solid #eee', borderRadius: '16px', overflow: 'hidden', backgroundColor: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' };
const tableHeaderRowStyle = { borderBottom: '1px solid #eee', backgroundColor: '#fcfcfc', textAlign: 'left' };
const tableRowStyle = { borderBottom: '1px solid #eee', transition: 'background 0.2s' };
const thStyle = { padding: '1.2rem', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#717171', fontWeight: '700' };
const tdStyle = { padding: '1.2rem', verticalAlign: 'middle' };
const categoryBadgeStyle = { backgroundColor: '#f7f7f7', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#444' };
const actionButtonStyle = { padding: '0.6rem', borderRadius: '8px', border: '1px solid #eee', backgroundColor: 'white', cursor: 'pointer', transition: 'all 0.2s' };
const statCardStyle = { display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', backgroundColor: 'white', borderRadius: '20px', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' };
const statLabelStyle = { color: '#717171', fontSize: '0.85rem', margin: 0, fontWeight: '600' };
const statValueStyle = { fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#222' };
const chartBoxStyle = { padding: '2rem', border: '1px solid #eee', borderRadius: '24px', backgroundColor: 'white', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' };
const avatarCircleStyle = { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' };

export default AdminDashboard;
