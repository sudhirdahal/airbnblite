import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import API from '../services/api';

/**
 * ============================================================================
 * FORGOT PASSWORD PAGE (The Security Request Layer)
 * ============================================================================
 * Stage 1 of the account recovery handshake.
 * Logic: Validates the existence of an email and triggers a cryptographically
 * secure 6-digit code via the backend email service.
 */
const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Generating secure code...');

    try {
      // API call to trigger backend OTP (One-Time Password) generation
      await API.post('/auth/forgot-password', { email });
      toast.success('Check your email for the reset code.', { id: toastId });
      
      // Pivot to Stage 2 (Reset) and pass the email in state for UX
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Email not found.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  /* --- HISTORICAL STAGE 1: PRIMITIVE FORM ---
   * return (
   *   <form onSubmit={handleSubmit}>
   *     <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
   *     <button type="submit">Submit</button>
   *   </form>
   * );
   */

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={containerStyle}>
      <div style={cardStyle}>
        <div style={iconWrapperStyle}><Key size={32} color="#ff385c" /></div>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Forgot password?</h2>
        <p style={{ color: '#717171', marginBottom: '2rem', textAlign: 'center' }}>No worries, we'll send you reset instructions.</p>
        
        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={inputGroup}>
            <label style={labelStyle}>Email Address</label>
            <input 
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} 
              placeholder="Enter your email" style={inputStyle} required 
            />
          </div>
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Processing...' : 'Reset password'}
          </button>
        </form>

        <Link to="/login" style={backLinkStyle}><ArrowLeft size={16} /> Back to log in</Link>
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
const buttonStyle = { padding: '1rem', border: 'none', borderRadius: '12px', backgroundColor: '#222', color: 'white', fontWeight: 'bold', cursor: 'pointer', transition: 'opacity 0.2s' };
const backLinkStyle = { marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#717171', fontSize: '0.9rem', fontWeight: '600' };

export default ForgotPassword;
