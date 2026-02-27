import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import API from '../services/api';

/**
 * ============================================================================
 * LOGIN PAGE (The Session Authority)
 * ============================================================================
 * This component manages user entry and session persistence.
 * Logic: Validates credentials against the backend, retrieves the JWT,
 * and hydrates the global 'User' state in App.jsx.
 */
const Login = ({ setUser }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false); // --- NEW: High-Fidelity Toggle ---
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loginToast = toast.loading('Authenticating...');

    try {
      // API call to backend /auth/login
      const res = await API.post('/auth/login', formData);
      
      // PERSISTENCE STAGE: Save to both memory and disk
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      setUser(res.data.user);
      toast.success(`Welcome back, ${res.data.user.name}!`, { id: loginToast });
      
      // Pivot to homepage
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed', { id: loginToast });
    } finally {
      setLoading(false);
    }
  };

  /* --- HISTORICAL STAGE 1: PRIMITIVE FORM ---
   * return (
   *   <form onSubmit={handleSubmit}>
   *     <input type="email" onChange={...} />
   *     <input type="password" onChange={...} />
   *     <button type="submit">Go</button>
   *   </form>
   * );
   */

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={containerStyle}>
      <div style={cardStyle}>
        <div style={iconWrapperStyle}><LogIn size={32} color="#ff385c" /></div>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Welcome back</h2>
        <p style={{ color: '#717171', marginBottom: '2.5rem' }}>Login to manage your stays and bookings.</p>

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={inputGroup}>
            <label style={labelStyle}>Email</label>
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
            <label style={labelStyle}>Password</label>
            <div style={inputWrapper}>
              <Lock size={18} style={fieldIcon} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                style={inputStyle} required 
              />
              {/* --- HIGH-FIDELITY TOGGLE BUTTON --- */}
              <button 
                type="button" onClick={() => setShowPassword(!showPassword)} 
                style={toggleBtnStyle}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
            <Link to="/forgot-password" style={forgotLinkStyle}>Forgot password?</Link>
          </div>

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Logging in...' : 'Login'} <ArrowRight size={18} />
          </button>
        </form>

        <p style={footerTextStyle}>
          Don't have an account? <Link to="/signup" style={linkStyle}>Sign up</Link>
        </p>
      </div>
    </motion.div>
  );
};

// --- STYLES ---
const containerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh', padding: '2rem' };
const cardStyle = { width: '100%', maxWidth: '450px', padding: '3.5rem', border: '1px solid #eee', borderRadius: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', backgroundColor: '#fff' };
const iconWrapperStyle = { width: '64px', height: '64px', backgroundColor: '#fff1f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' };
const formStyle = { width: '100%', display: 'flex', flexDirection: 'column' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' };
const labelStyle = { fontSize: '0.85rem', fontWeight: '700', color: '#222' };
const inputWrapper = { position: 'relative', display: 'flex', alignItems: 'center' };
const fieldIcon = { position: 'absolute', left: '1rem', color: '#aaa' };
const inputStyle = { width: '100%', padding: '0.9rem 1rem 0.9rem 3rem', borderRadius: '12px', border: '1.5px solid #eee', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s', color: '#222' };
const toggleBtnStyle = { position: 'absolute', right: '1rem', background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center' };
const buttonStyle = { marginTop: '1rem', padding: '1rem', border: 'none', borderRadius: '12px', backgroundColor: '#222', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', fontSize: '1rem' };
const forgotLinkStyle = { fontSize: '0.85rem', color: '#717171', textDecoration: 'none', fontWeight: '600' };
const footerTextStyle = { marginTop: '2.5rem', color: '#717171', fontSize: '0.95rem' };
const linkStyle = { color: '#ff385c', fontWeight: 'bold', textDecoration: 'none' };

export default Login;
