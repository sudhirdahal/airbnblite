import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import API from '../services/api';

/**
 * ============================================================================
 * RESET PASSWORD PAGE (The Final Security Handshake)
 * ============================================================================
 * Stage 2 of account recovery.
 * Logic: Validates the 6-digit OTP against the database and allows the 
 * user to define a new password. 
 * Security: This action automatically triggers a 'tokenVersion' increment 
 * on the backend to invalidate all current active sessions globally.
 */
const ResetPassword = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  
  // State initialization with UX-fallback for email
  const [formData, setFormData] = useState({
    email: state?.email || '',
    token: '',
    newPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Securing your account...');

    try {
      // API call to finalize the password rotation
      await API.post('/auth/reset-password', formData);
      toast.success('Password updated successfully!', { id: toastId });
      
      // Pivot to login after successful rotation
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  /* --- HISTORICAL STAGE 1: PRIMITIVE RESET ---
   * return (
   *   <form onSubmit={handleSubmit}>
   *     <input type="text" placeholder="Code" onChange={e => setFormData({...formData, token: e.target.value})} />
   *     <input type="password" placeholder="New PW" onChange={e => setFormData({...formData, newPassword: e.target.value})} />
   *     <button type="submit">Reset</button>
   *   </form>
   * );
   */

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={containerStyle}>
      <div style={cardStyle}>
        <div style={iconWrapperStyle}><ShieldCheck size={32} color="#ff385c" /></div>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Set new password</h2>
        <p style={{ color: '#717171', marginBottom: '2rem', textAlign: 'center' }}>Enter the 6-digit code we sent to your email.</p>
        
        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={inputGroup}>
            <label style={labelStyle}>Reset Code</label>
            <input 
              type="text" value={formData.token} onChange={(e) => setFormData({...formData, token: e.target.value})} 
              placeholder="000000" style={inputStyle} required 
            />
          </div>
          <div style={inputGroup}>
            <label style={labelStyle}>New Password</label>
            <input 
              type="password" value={formData.newPassword} onChange={(e) => setFormData({...formData, newPassword: e.target.value})} 
              placeholder="••••••••" style={inputStyle} required 
            />
          </div>
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Updating...' : 'Set new password'}
          </button>
        </form>

        <Link to="/forgot-password" style={backLinkStyle}><ArrowLeft size={16} /> Back to email entry</Link>
      </div>
    </motion.div>
  );
};

// --- STYLES ---
const containerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '2rem' };
const cardStyle = { width: '100%', maxWidth: '450px', padding: '3rem', border: '1px solid #eee', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' };
const iconWrapperStyle = { width: '64px', height: '64px', backgroundColor: '#fff1f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' };
const formStyle = { width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };
const labelStyle = { fontSize: '0.8rem', fontWeight: 'bold', color: '#222' };
const inputStyle = { padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem', outline: 'none' };
const buttonStyle = { padding: '1rem', border: 'none', borderRadius: '12px', backgroundColor: '#222', color: 'white', fontWeight: 'bold', cursor: 'pointer' };
const backLinkStyle = { marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#717171', fontSize: '0.9rem', fontWeight: '600' };

export default ResetPassword;
