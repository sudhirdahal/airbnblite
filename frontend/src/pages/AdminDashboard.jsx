import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Trash, Edit, Calendar, User as UserIcon, X, Upload, BarChart3, TrendingUp, DollarSign, LayoutDashboard, ListChecks, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Bar } from 'react-chartjs-2'; 
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import API from '../services/api';
import PageHeader from '../components/layout/PageHeader';

// Chart.js Registration
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * ============================================================================
 * ADMIN DASHBOARD (The Host Management Suite)
 * ============================================================================
 * This component acts as the control center for 'admin' users.
 * It has evolved from a basic CRUD list into a professional analytics
 * and management suite with deep-linking and real-time feedback.
 */
const AdminDashboard = ({ user, refreshListings }) => {
  const [activeTab, setActiveTab] = useState('listings');
  const [adminListings, setAdminListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Management Form State
  const [formData, setFormData] = useState({
    _id: null, title: '', location: '', description: '', fullDescription: '', 
    rate: '', category: 'pools', images: [], lat: '', lng: '', imageUrlInput: '',
    maxGuests: 2, bedrooms: 1, beds: 1
  });
  const [isUploading, setIsUploading] = useState(false);

  // Re-fetch data on context change (tab switch)
  useEffect(() => { fetchAdminData(); }, [activeTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'listings') {
        const response = await API.get(`/listings?adminId=${user.id || user._id}`);
        setAdminListings(response.data);
      } else {
        const response = await API.get('/bookings/admin');
        setBookings(response.data);
      }
    } catch (err) {
      toast.error("Failed to load dashboard data");
    } finally { setLoading(false); }
  };

  /**
   * REVENUE INSIGHTS CALCULATOR
   * Dynamically aggregates database results into a time-series dataset.
   */
  const getChartData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const revenueByMonth = new Array(12).fill(0);
    
    // Only aggregate revenue from non-cancelled bookings
    bookings.filter(b => b.status === 'confirmed').forEach(booking => {
      const date = new Date(booking.createdAt);
      revenueByMonth[date.getMonth()] += booking.totalPrice;
    });
    
    return { 
      labels: months, 
      datasets: [{ 
        label: 'Confirmed Revenue ($)', 
        data: revenueByMonth, 
        backgroundColor: '#ff385c', 
        borderRadius: 8 
      }] 
    };
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm("As a host, are you sure?")) return;
    const cancelToast = toast.loading('Cancelling...');
    try {
      await API.put(`/bookings/${id}/cancel`);
      toast.success('Reservation cancelled.', { id: cancelToast });
      fetchAdminData(); // Refresh list to reflect 'cancelled' status
    } catch (err) { toast.error('Error', { id: cancelToast }); }
  };

  const totalRevenue = bookings.filter(b => b.status === 'confirmed').reduce((acc, curr) => acc + curr.totalPrice, 0);
  const totalBookings = bookings.filter(b => b.status === 'confirmed').length;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * DIRECT S3 UPLOAD
   * Phase 7 implementation: Bypasses local disk entirely.
   */
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const data = new FormData(); data.append('image', file); 
    setIsUploading(true); 
    const uploadToast = toast.loading('Uploading to S3...');
    try {
      const response = await API.post('/listings/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFormData(prev => ({ ...prev, images: [...prev.images, response.data.imageUrl] }));
      toast.success('Done!', { id: uploadToast });
    } catch (err) { toast.error('Failed', { id: uploadToast }); } finally { setIsUploading(false); }
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, index) => index !== indexToRemove) }));
  };

  const toggleForm = () => {
    setShowForm(prev => {
      if (prev) setFormData({ _id: null, title: '', location: '', description: '', fullDescription: '', rate: '', category: 'pools', images: [], lat: '', lng: '', imageUrlInput: '', maxGuests: 2, bedrooms: 1, beds: 1 });
      return !prev;
    });
  };

  const handleEditClick = (listing) => {
    setFormData({ _id: listing._id, title: listing.title, location: listing.location, description: listing.description, fullDescription: listing.fullDescription, rate: listing.rate, category: listing.category, images: listing.images, lat: listing.coordinates?.lat || '', lng: listing.coordinates?.lng || '', imageUrlInput: '', maxGuests: listing.maxGuests, bedrooms: listing.bedrooms, beds: listing.beds });
    setShowForm(true); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateOrUpdateListing = async (e) => {
    e.preventDefault(); 
    const finalImages = [...formData.images];
    if (formData.imageUrlInput) finalImages.push(...formData.imageUrlInput.split(',').map(url => url.trim()).filter(url => url));
    if (finalImages.length === 0) return toast.error('At least one image is required.');
    
    const saveToast = toast.loading('Saving...');
    try {
      const payload = { ...formData, images: finalImages, rate: Number(formData.rate), coordinates: { lat: Number(formData.lat || 0), lng: Number(formData.lng || 0) }, host: { name: user.name, avatar: user.avatar } };
      if (formData._id) await API.put(`/listings/${formData._id}`, payload);
      else await API.post('/listings', payload);
      toast.success('Successfully saved!', { id: saveToast });
      toggleForm(); fetchAdminData(); refreshListings();   
    } catch (err) { toast.error('Failed', { id: saveToast }); }
  };

  const handleDeleteListing = async (id) => {
    if (!window.confirm("Delete listing?")) return; 
    const deleteToast = toast.loading('Deleting...');
    try {
      await API.delete(`/listings/${id}`); 
      toast.success('Deleted', { id: deleteToast });
      fetchAdminData(); refreshListings();   
    } catch (err) { toast.error('Failed', { id: deleteToast }); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading Dashboard...</div>;

  return (
    <div style={{ maxWidth: '2560px', width: '98%', margin: '2rem auto', padding: '0 2rem' }}>
      <PageHeader title="Admin Dashboard" subtitle="Control center for your high-fidelity properties." icon={LayoutDashboard} />
      
      <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid #ddd', marginBottom: '2rem' }}>
        <button onClick={() => setActiveTab('listings')} style={tabButtonStyle(activeTab === 'listings')}>My Listings</button>
        <button onClick={() => setActiveTab('bookings')} style={tabButtonStyle(activeTab === 'bookings')}>Manage Bookings</button>
        <button onClick={() => setActiveTab('insights')} style={tabButtonStyle(activeTab === 'insights')}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={18} /> Revenue Insights</div></button>
      </div>

      <AnimatePresence mode="wait">
        
        {/* INSIGHTS TAB */}
        {activeTab === 'insights' && (
          <motion.div key="insights" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
              <div style={statCardStyle}><DollarSign color="#4f46e5" /><div><p style={statLabelStyle}>Total Revenue</p><h3 style={statValueStyle}>${totalRevenue.toLocaleString()}</h3></div></div>
              <div style={statCardStyle}><Calendar color="#ff385c" /><div><p style={statLabelStyle}>Confirmed Stays</p><h3 style={statValueStyle}>{totalBookings}</h3></div></div>
            </div>
            <div style={chartBoxStyle}><h3>Earnings Overview</h3><div style={{ height: '350px' }}><Bar data={getChartData()} options={{ maintainAspectRatio: false }} /></div></div>
          </motion.div>
        )}

        {/* LISTINGS TAB */}
        {activeTab === 'listings' && (
          <motion.div key="listings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ margin: 0 }}>Active Properties</h3>
              <button onClick={toggleForm} style={primaryButtonStyle}>{showForm ? <><X size={18} /> Cancel</> : <><PlusCircle size={18} /> Add New Listing</>}</button>
            </div>
            {showForm && (
              <div style={formContainerStyle}>
                <form onSubmit={handleCreateOrUpdateListing} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                  <input type="text" name="title" placeholder="Listing Title" value={formData.title} onChange={handleChange} style={inputStyle} required />
                  <input type="text" name="location" placeholder="City, Country" value={formData.location} onChange={handleChange} style={inputStyle} required />
                  <input type="number" name="rate" placeholder="Rate ($)" value={formData.rate} onChange={handleChange} style={inputStyle} required />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="number" name="maxGuests" placeholder="Guests" value={formData.maxGuests} onChange={handleChange} style={{ ...inputStyle, flex: 1 }} required />
                    <input type="number" name="beds" placeholder="Beds" value={formData.beds} onChange={handleChange} style={{ ...inputStyle, flex: 1 }} required />
                  </div>
                  <select name="category" value={formData.category} onChange={handleChange} style={inputStyle}>
                    <option value="pools">Amazing Pools</option><option value="beach">Beachfront</option><option value="cabins">Cabins</option><option value="arctic">Arctic</option>
                  </select>
                  <div style={{ gridColumn: 'span 2', padding: '1.5rem', border: '2px dashed #ddd', borderRadius: '16px', textAlign: 'center' }}>
                    <label style={{ cursor: 'pointer' }}><Upload size={32} /><div>{isUploading ? 'Uploading...' : 'Upload Property Photo'}</div><input type="file" onChange={handleFileUpload} style={{ display: 'none' }} /></label>
                    <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem', justifyContent: 'center' }}>
                      {formData.images.map((url, i) => (<div key={i} style={{ position: 'relative' }}><img src={url} style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} /><button type="button" onClick={() => handleRemoveImage(i)} style={removeImgBtnStyle}>X</button></div>))}
                    </div>
                  </div>
                  <textarea name="fullDescription" placeholder="Property Details..." value={formData.fullDescription} onChange={handleChange} style={{ ...inputStyle, gridColumn: 'span 2', height: '100px' }} required />
                  <button type="submit" style={{ ...primaryButtonStyle, gridColumn: 'span 2' }}>Save Property</button>
                </form>
              </div>
            )}
            <div style={tableWrapperStyle}><table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={tableHeaderRowStyle}><th style={thStyle}>Listing</th><th style={thStyle}>Rate</th><th style={thStyle}>Actions</th></tr></thead>
              <tbody>{adminListings.map(l => (
                <tr key={l._id} style={tableRowStyle}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                      {/* INTERACTIVE THUMBNAIL (Phase 4) */}
                      <Link to={`/listing/${l._id}`}><img src={l.images[0]} style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' }} alt="Thumb" /></Link>
                      <div>
                        <Link to={`/listing/${l._id}`} style={{ textDecoration: 'none', color: 'inherit', fontWeight: '700' }}>{l.title}</Link>
                        <div style={{ fontSize: '0.8rem', color: '#717171' }}>{l.location}</div>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}><span style={{ fontWeight: '700' }}>${l.rate}</span></td>
                  <td style={tdStyle}><div style={{ display: 'flex', gap: '0.5rem' }}><button onClick={() => handleEditClick(l)} style={actionButtonStyle}><Edit size={16} /></button><button onClick={() => handleDeleteListing(l._id)} style={{ ...actionButtonStyle, color: '#ff385c' }}><Trash size={16} /></button></div></td>
                </tr>
              ))}</tbody>
            </table></div>
          </motion.div>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <motion.div key="bookings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Guest Reservations</h3>
            <div style={tableWrapperStyle}><table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={tableHeaderRowStyle}><th style={thStyle}>Guest</th><th style={thStyle}>Stay</th><th style={thStyle}>Revenue</th><th style={thStyle}>Actions</th></tr></thead>
              <tbody>{bookings.map(b => (
                <tr key={b._id} style={{ ...tableRowStyle, opacity: b.status === 'cancelled' ? 0.6 : 1 }}>
                  <td style={tdStyle}><Link to="/profile" style={{ textDecoration: 'none', color: 'inherit' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><div style={avatarCircleStyle}>{b.userId?.name.charAt(0)}</div><div><div style={{ fontWeight: '700' }}>{b.userId?.name}</div></div></div></Link></td>
                  <td style={tdStyle}><Link to={`/listing/${b.listingId?._id}`} style={{ textDecoration: 'none', color: 'inherit' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><img src={b.listingId?.images?.[0]} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} alt="Listing" /><span style={{ fontWeight: '500' }}>{b.listingId?.title}</span></div></Link></td>
                  <td style={tdStyle}><span style={{ fontWeight: '700' }}>${b.totalPrice}</span><div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: b.status === 'confirmed' ? 'green' : 'red' }}>{b.status}</div></td>
                  <td style={tdStyle}>
                    {b.status === 'confirmed' && (
                      <button onClick={() => handleCancelBooking(b._id)} style={{ ...actionButtonStyle, color: '#ff385c' }} title="Cancel Booking"><XCircle size={18} /></button>
                    )}
                  </td>
                </tr>
              ))}</tbody>
            </table></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Styles (Omitted for brevity, matching previous high-fidelity layout)
const tabButtonStyle = (isActive) => ({ padding: '1rem 0', background: 'none', border: 'none', borderBottom: isActive ? '3px solid #ff385c' : '3px solid transparent', color: isActive ? '#000' : '#717171', fontWeight: isActive ? 'bold' : '600', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.3s' });
const primaryButtonStyle = { backgroundColor: '#222', color: 'white', border: 'none', padding: '0.7rem 1.4rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' };
const inputStyle = { padding: '0.8rem', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem', outline: 'none', backgroundColor: '#fff' };
const formContainerStyle = { border: '1px solid #eee', padding: '2.5rem', borderRadius: '24px', marginBottom: '2.5rem', backgroundColor: '#fff', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' };
const tableWrapperStyle = { border: '1px solid #eee', borderRadius: '20px', overflow: 'hidden', backgroundColor: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' };
const tableHeaderRowStyle = { borderBottom: '1px solid #eee', backgroundColor: '#fcfcfc', textAlign: 'left' };
const tableRowStyle = { borderBottom: '1px solid #eee', transition: 'background 0.2s' };
const thStyle = { padding: '1.2rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#717171', fontWeight: '800' };
const tdStyle = { padding: '1.2rem', verticalAlign: 'middle' };
const categoryBadgeStyle = { backgroundColor: '#f7f7f7', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#444' };
const actionButtonStyle = { padding: '0.6rem', borderRadius: '8px', border: '1px solid #eee', backgroundColor: 'white', cursor: 'pointer', transition: 'all 0.2s' };
const statCardStyle = { display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', backgroundColor: 'white', borderRadius: '24px', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' };
const statLabelStyle = { color: '#717171', fontSize: '0.85rem', margin: 0, fontWeight: '600' };
const statValueStyle = { fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#222' };
const chartBoxStyle = { padding: '2.5rem', border: '1px solid #eee', borderRadius: '28px', backgroundColor: 'white', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' };
const avatarCircleStyle = { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#222', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' };
const removeImgBtnStyle = { position: 'absolute', top: -8, right: -8, background: '#ff385c', color: 'white', borderRadius: '50%', border: '2px solid white', width: '24px', height: '24px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' };

export default AdminDashboard;
