import React, { useState, useEffect } from 'react';
import { User, Mail, ShieldCheck, MapPin, Calendar, Award, Star, Globe, Camera, TrendingUp, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import API from '../services/api';
import PageHeader from '../components/layout/PageHeader';

/**
 * ============================================================================
 * PROFILE PAGE (The Traveler Identity Hub)
 * ============================================================================
 * Initially a simple <div> with two input fields.
 * It has evolved into a high-fidelity 'Identity Layer' that manages:
 * 1. Distributed Media (S3 Avatar streaming).
 * 2. Real-time Achievement Metrics (Stats Engine).
 * 3. Role-based status badges.
 */
const Profile = ({ user, setUser }) => {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [stats, setStats] = useState({ totalSpent: 0, upcoming: 0, completed: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({ name: user.name, email: user.email });
      fetchStats();
    }
  }, [user]);

  /**
   * REAL-TIME STATS ENGINE
   * This logic performs a client-side aggregation of the booking collection.
   * In a massive production app, this would be a backend aggregation pipeline,
   * but for 'Lite' speed, we calculate it here.
   */
  const fetchStats = async () => {
    try {
      const res = await API.get('/bookings/mybookings');
      const confirmed = res.data.filter(b => b.status === 'confirmed');
      const upcoming = confirmed.filter(b => new Date(b.checkIn) >= new Date()).length;
      const completed = confirmed.filter(b => new Date(b.checkIn) < new Date()).length;
      const spent = confirmed.reduce((acc, b) => acc + b.totalPrice, 0);
      setStats({ upcoming, completed, totalSpent: spent });
    } catch (err) { console.error('Stats Sync Failure:', err); }
  };

  /**
   * S3 MEDIA PIPELINE
   * Streams the file directly to the backend Multer-S3 handler.
   */
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const data = new FormData();
    data.append('avatar', file);
    const uploadToast = toast.loading('Streaming to S3...');
    try {
      const res = await API.post('/auth/avatar', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      const updated = await API.put('/auth/profile', { avatar: res.data.avatarUrl });
      setUser(updated.data);
      localStorage.setItem('user', JSON.stringify(updated.data));
      toast.success('Identity updated!', { id: uploadToast });
    } catch (err) { toast.error('Streaming failed', { id: uploadToast }); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.put('/auth/profile', formData);
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      toast.success('Settings saved.');
    } catch (err) { toast.error('Sync failed'); } finally { setLoading(false); }
  };

  /* --- HISTORICAL STAGE 1: PRIMITIVE SETTINGS ---
   * return (
   *   <form onSubmit={handleSubmit}>
   *     <input value={name} />
   *     <input value={email} />
   *     <button>Save</button>
   *   </form>
   * );
   */

  if (!user) return <div style={{ textAlign: 'center', padding: '4rem' }}>Synchronizing user context...</div>;

  return (
    <div style={{ maxWidth: '2560px', width: '98%', margin: '3rem auto', padding: '0 2rem' }}>
      <PageHeader title="Identity & Profile" subtitle="Manage your traveler metadata and achievements." icon={User} />

      {/* --- HIGH-FIDELITY KPI CARDS --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <StatCard icon={TrendingUp} label="Total Stays" value={stats.completed} color="#4f46e5" />
        <StatCard icon={Calendar} label="Upcoming" value={stats.upcoming} color="#ff385c" />
        <StatCard icon={CreditCard} label="Travel Spend" value={`$${stats.totalSpent.toLocaleString()}`} color="#16a34a" />
      </div>

      <div style={{ display: 'flex', gap: '4rem', marginTop: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '350px' }}>
          <div style={sectionCardStyle}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <div style={avatarLargeStyle}>
                  {user.avatar ? <img src={user.avatar} style={avatarImgStyle} /> : user.name.charAt(0)}
                </div>
                <label style={cameraBtnStyle}>
                  <Camera size={18} color="white" />
                  <input type="file" onChange={handleAvatarUpload} style={{ display: 'none' }} accept="image/*" />
                </label>
              </div>
              <h3 style={{ marginTop: '1.5rem', fontSize: '1.4rem' }}>{user.name}</h3>
              <div style={roleBadgeStyle}>{user.role === 'admin' ? 'Host' : 'Traveler'}</div>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={inputGroup}>
                <label style={labelStyle}>Full Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={inputStyle} />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Email Address</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={inputStyle} />
              </div>
              <button type="submit" disabled={loading} style={buttonStyle}>{loading ? 'Syncing...' : 'Update Settings'}</button>
            </form>
          </div>
        </div>

        <div style={{ flex: 1.5, minWidth: '350px' }}>
          <div style={sectionCardStyle}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Award size={22} color="#ff385c" /> Traveler Achievements
            </h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Badge label="Verified Identity" active={true} />
              <Badge label="Early Adopter" active={true} />
              <Badge label="Frequent Traveler" active={stats.completed > 5} />
              <Badge label="Big Spender" active={stats.totalSpent > 1000} />
            </div>
            
            <div style={{ marginTop: '3rem', padding: '1.5rem', backgroundColor: '#f9f9f9', borderRadius: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#717171' }}>PRO-TIP</h4>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', color: '#222' }}>
                Complete 5 stays to unlock the <b>'Frequent Traveler'</b> status and earn exclusive discounts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---
const StatCard = ({ icon: Icon, label, value, color }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={statCardStyle}>
    <div style={{ backgroundColor: `${color}15`, padding: '0.8rem', borderRadius: '12px' }}><Icon size={24} color={color} /></div>
    <div><div style={{ fontSize: '0.8rem', color: '#717171', fontWeight: '700', textTransform: 'uppercase' }}>{label}</div><div style={{ fontSize: '1.6rem', fontWeight: '800' }}>{value}</div></div>
  </motion.div>
);

const Badge = ({ label, active }) => (
  <div style={{ padding: '0.6rem 1.4rem', borderRadius: '30px', border: `1.5px solid ${active ? '#222' : '#eee'}`, color: active ? '#222' : '#ccc', fontSize: '0.8rem', fontWeight: '800', opacity: active ? 1 : 0.5, backgroundColor: active ? '#fff' : 'transparent' }}>{label}</div>
);

// --- STYLES ---
const sectionCardStyle = { padding: '2.5rem', border: '1px solid #eee', borderRadius: '28px', backgroundColor: '#fff', boxShadow: '0 8px 30px rgba(0,0,0,0.03)' };
const statCardStyle = { display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.8rem', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };
const labelStyle = { fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#717171' };
const inputStyle = { padding: '0.9rem 1.2rem', border: '1.5px solid #eee', borderRadius: '14px', fontSize: '1rem', outline: 'none', color: '#222' };
const buttonStyle = { padding: '1rem', border: 'none', borderRadius: '14px', backgroundColor: '#222', color: 'white', fontWeight: '800', cursor: 'pointer', transition: 'transform 0.2s', marginTop: '1rem' };
const avatarLargeStyle = { width: '140px', height: '140px', borderRadius: '50%', backgroundColor: '#222', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', fontWeight: 'bold', border: '4px solid #fff', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', overflow: 'hidden' };
const avatarImgStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const cameraBtnStyle = { position: 'absolute', bottom: '8px', right: '8px', backgroundColor: '#222', padding: '0.7rem', borderRadius: '50%', border: '3px solid white', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const roleBadgeStyle = { display: 'inline-block', marginTop: '0.8rem', padding: '0.3rem 1rem', backgroundColor: '#f7f7f7', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#717171' };

export default Profile;
