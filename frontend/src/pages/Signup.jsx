import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Shield, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import API from '../services/api';

/**
 * ============================================================================
 * SIGNUP PAGE (The Account Provisioning Layer)
 * ============================================================================
 * This component manages the creation of new identities in the database.
 * Logic: Handles user metadata, password hashing (via backend), and role 
 * assignment (Registered vs Admin).
 * Stage 2 UX: Now includes a high-fidelity 'Password Peek' toggle.
 */
const Signup = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'registered' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const signupToast = toast.loading('Creating your profile...');

    try {
      // API call to backend /auth/register
      await API.post('/auth/register', formData);
      toast.success('Registration successful! Please check your email.', { id: signupToast });
      
      // Pivot to login to await email verification completion
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed', { id: signupToast });
    } finally {
      setLoading(false);
    }
  };

  /* --- HISTORICAL STAGE 1: BARE-BONES SIGNUP ---
   * return (
   *   <form onSubmit={handleSubmit}>
   *     <input type="text" placeholder="Name" />
   *     <input type="email" placeholder="Email" />
   *     <button type="submit">Join</button>
   *   </form>
   * );
   */

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={containerStyle}>
      <div style={cardStyle}>
        <div style={iconWrapperStyle}><User size={32} color="#ff385c" /></div>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Join the community</h2>
        <p style={{ color: '#717171', marginBottom: '2.5rem' }}>Create an account to start exploring and saving stays.</p>

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={inputGroup}>
            <label style={labelStyle}>Full Name</label>
            <div style={inputWrapper}>
              <User size={18} style={fieldIcon} />
              <input 
                type="text" placeholder="John Doe" value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                style={inputStyle} required 
              />
            </div>
          </div>

          <div style={inputGroup}>
            <label style={labelStyle}>Email Address</label>
            <div style={inputWrapper}>
              <Mail size={18} style={fieldIcon} />
              <input 
                type="email" placeholder="email@example.com" value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                style={inputStyle} required 
              />
            </div>
          </div>

          <div style={inputGroup}>
            <label style={labelStyle}>Create Password</label>
            <div style={inputWrapper}>
              <Lock size={18} style={fieldIcon} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                style={inputStyle} required 
              />
              <button 
                type="button" onClick={() => setShowPassword(!showPassword)} 
                style={toggleBtnStyle}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={inputGroup}>
            <label style={labelStyle}>Account Purpose</label>
            <div style={inputWrapper}>
              <Shield size={18} style={fieldIcon} />
              <select 
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                style={selectStyle}
              >
                <option value="registered">I want to travel (Guest)</option>
                <option value="admin">I want to host (Admin)</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Creating account...' : 'Create account'} <ArrowRight size={18} />
          </button>
        </form>

        <p style={footerTextStyle}>
          Already have an account? <Link to="/login" style={linkStyle}>Log in</Link>
        </p>
      </div>
    </motion.div>
  );
};

// --- STYLES ---
const containerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '90vh', padding: '2rem' };
const cardStyle = { width: '100%', maxWidth: '480px', padding: '3.5rem', border: '1px solid #eee', borderRadius: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', backgroundColor: '#fff' };
const iconWrapperStyle = { width: '64px', height: '64px', backgroundColor: '#fff1f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' };
const formStyle = { width: '100%', display: 'flex', flexDirection: 'column' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' };
const labelStyle = { fontSize: '0.85rem', fontWeight: '700', color: '#222' };
const inputWrapper = { position: 'relative', display: 'flex', alignItems: 'center' };
const fieldIcon = { position: 'absolute', left: '1rem', color: '#aaa', zIndex: 1 };
const inputStyle = { width: '100%', padding: '0.9rem 1rem 0.9rem 3rem', borderRadius: '12px', border: '1.5px solid #eee', fontSize: '1rem', outline: 'none', color: '#222' };
const selectStyle = { ...inputStyle, cursor: 'pointer', appearance: 'none', backgroundColor: 'transparent' };
const toggleBtnStyle = { position: 'absolute', right: '1rem', background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center' };
const buttonStyle = { marginTop: '1rem', padding: '1rem', border: 'none', borderRadius: '12px', backgroundColor: '#222', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', fontSize: '1rem' };
const footerTextStyle = { marginTop: '2.5rem', color: '#717171', fontSize: '0.95rem' };
const linkStyle = { color: '#ff385c', fontWeight: 'bold', textDecoration: 'none' };

export default Signup;
