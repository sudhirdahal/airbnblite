import React, { useState, useEffect } from 'react';
import { User, Mail, ShieldCheck, MapPin, Calendar, Award, Star, Globe, Camera, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import API from '../services/api';
import PageHeader from '../components/layout/PageHeader';

const Profile = ({ user, setUser }) => {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user) setFormData({ name: user.name, email: user.email });
  }, [user]);

  // --- NEW: Avatar Upload Handler ---
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('avatar', file);

    setIsUploading(true);
    const uploadToast = toast.loading('Uploading avatar...');
    
    try {
      // 1. Upload to S3
      const response = await API.post('/auth/avatar', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // 2. Update user profile with new URL
      const updatedUserRes = await API.put('/auth/profile', { avatar: response.data.avatarUrl });
      
      // 3. Sync local state
      setUser(updatedUserRes.data);
      localStorage.setItem('user', JSON.stringify(updatedUserRes.data));
      
      toast.success('Avatar updated!', { id: uploadToast });
    } catch (err) {
      toast.error('Failed to upload avatar', { id: uploadToast });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const saveToast = toast.loading('Updating profile...');
    try {
      const response = await API.put('/auth/profile', formData);
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      toast.success('Profile updated!', { id: saveToast });
    } catch (err) {
      toast.error('Update failed', { id: saveToast });
    } finally { setLoading(false); }
  };

  if (!user) return <div style={{ textAlign: 'center', padding: '4rem' }}>Please log in to view profile.</div>;

  return (
    <div style={{ maxWidth: '2560px', width: '98%', margin: '3rem auto', padding: '0 2rem' }}>
      <PageHeader title="Personal Profile" subtitle="Manage your account details and view your traveler achievements." icon={User} />

      <div style={{ display: 'flex', gap: '4rem', marginTop: '2rem' }}>
        <div style={{ flex: 1 }}>
          <div style={sectionCardStyle}>
            
            {/* AVATAR MANAGEMENT SECTION */}
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <div style={avatarLargeStyle}>
                  {user.avatar ? (
                    <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} alt="Avatar" />
                  ) : user.name.charAt(0)}
                </div>
                <label style={cameraBtnStyle}>
                  <Camera size={18} color="white" />
                  <input type="file" onChange={handleAvatarUpload} style={{ display: 'none' }} accept="image/*" />
                </label>
              </div>
              <h3 style={{ marginTop: '1rem', marginBottom: '0.2rem' }}>{user.name}</h3>
              <p style={{ color: '#717171', fontSize: '0.9rem' }}>{user.email}</p>
            </div>

            <h3 style={{ marginBottom: '1.5rem' }}>Account Details</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Full Name</label>
                <div style={inputWrapperStyle}><User size={18} color="#717171" /><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={inputStyle} /></div>
              </div>
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Email Address</label>
                <div style={inputWrapperStyle}><Mail size={18} color="#717171" /><input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={inputStyle} /></div>
              </div>
              <button type="submit" disabled={loading} style={buttonStyle}>{loading ? 'Saving...' : 'Update Profile'}</button>
            </form>
          </div>
        </div>

        <div style={{ flex: 1.5 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={statCardStyle}><Award color="#ff385c" size={24} /><div><div style={statValue}>Verified User</div><div style={statLabel}>Trust Level: 100%</div></div></div>
            <div style={statCardStyle}><Globe color="#4f46e5" size={24} /><div><div style={statValue}>Frequent Traveler</div><div style={statLabel}>5+ Stays booked</div></div></div>
          </div>

          <div style={sectionCardStyle}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShieldCheck size={20} color="#ff385c" /> Traveler Achievements</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Badge icon={Star} label="Review Expert" color="#ffb400" />
              <Badge icon={Calendar} label="Early Adopter" color="#008489" />
              <Badge icon={MapPin} label="Local Guide" color="#ff385c" />
              <Badge icon={Globe} label="Explorer" color="#4f46e5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Badge = ({ icon: Icon, label, color }) => (
  <motion.div whileHover={{ scale: 1.05, backgroundColor: color, color: 'white' }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', borderRadius: '30px', border: `1px solid ${color}`, color: color, fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
    <Icon size={14} /> {label}
  </motion.div>
);

const sectionCardStyle = { padding: '2rem', border: '1px solid #eee', borderRadius: '24px', backgroundColor: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' };
const inputGroupStyle = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };
const labelStyle = { fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#717171', letterSpacing: '0.05em' };
const inputWrapperStyle = { display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem', border: '1px solid #ddd', borderRadius: '12px', backgroundColor: '#fcfcfc' };
const inputStyle = { border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '1rem', fontWeight: '500' };
const buttonStyle = { padding: '1rem', border: 'none', borderRadius: '12px', backgroundColor: '#222', color: 'white', fontWeight: '700', cursor: 'pointer', transition: 'background 0.2s' };
const statCardStyle = { padding: '1.5rem', border: '1px solid #eee', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#fff' };
const statValue = { fontSize: '1rem', fontWeight: '800', color: '#222' };
const statLabel = { fontSize: '0.75rem', color: '#717171', fontWeight: '600' };
const avatarLargeStyle = { width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#222', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 'bold', border: '4px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };
const cameraBtnStyle = { position: 'absolute', bottom: '5px', right: '5px', backgroundColor: '#222', padding: '0.6rem', borderRadius: '50%', border: '2px solid white', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', display: 'flex' };

export default Profile;
