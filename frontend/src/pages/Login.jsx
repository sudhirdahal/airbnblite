import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import API from '../services/api';
import { theme } from '../theme'; // --- NEW: THEME AUTHORITY ---

/**
 * ============================================================================
 * LOGIN PAGE (The Session Authority)
 * ============================================================================
 * OVERHAUL: Refactored to consume the centralized Design Token system.
 * This ensures that input radii, brand buttons, and typography are
 * perfectly synchronized with the global design language.
 */
const Login = ({ setUser }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false); 
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loginToast = toast.loading('Authenticating...');

    try {
      const res = await API.post('/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      toast.success(`Welcome back, ${res.data.user.name}!`, { id: loginToast });
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed', { id: loginToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={containerStyle}>
      <div style={cardStyle}>
        <div style={iconWrapperStyle}><LogIn size={32} color={theme.colors.brand} /></div>
        <h2 style={{ fontSize: theme.typography.sizes.xl, marginBottom: '0.5rem', fontWeight: theme.typography.weights.extraBold }}>Welcome back</h2>
        <p style={{ color: theme.colors.slate, marginBottom: '2.5rem' }}>Login to manage your stays and bookings.</p>

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

// --- TOKEN-BASED STYLES ---
const containerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh', padding: '2rem' };
const cardStyle = { width: '100%', maxWidth: '450px', padding: '3.5rem', border: `1px solid ${theme.colors.divider}`, borderRadius: theme.radius.lg, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: theme.shadows.lg, backgroundColor: theme.colors.white };
const iconWrapperStyle = { width: '64px', height: '64px', backgroundColor: '#fff1f2', borderRadius: theme.radius.full, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' };
const formStyle = { width: '100%', display: 'flex', flexDirection: 'column' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' };
const labelStyle = { fontSize: '0.85rem', fontWeight: theme.typography.weights.bold, color: theme.colors.charcoal };
const inputWrapper = { position: 'relative', display: 'flex', alignItems: 'center' };
const fieldIcon = { position: 'absolute', left: '1rem', color: '#aaa' };
const inputStyle = { width: '100%', padding: '0.9rem 1rem 0.9rem 3rem', borderRadius: theme.radius.md, border: `1.5px solid ${theme.colors.divider}`, fontSize: theme.typography.base, outline: 'none', color: theme.colors.charcoal };
const toggleBtnStyle = { position: 'absolute', right: '1rem', background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center' };
const buttonStyle = { marginTop: '1rem', padding: '1rem', border: 'none', borderRadius: theme.radius.md, backgroundColor: theme.colors.charcoal, color: theme.colors.white, fontWeight: theme.typography.weights.bold, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', fontSize: '1rem' };
const forgotLinkStyle = { fontSize: '0.85rem', color: theme.colors.slate, textDecoration: 'none', fontWeight: theme.typography.weights.semibold };
const footerTextStyle = { marginTop: '2.5rem', color: theme.colors.slate, fontSize: '0.95rem' };
const linkStyle = { color: theme.colors.brand, fontWeight: theme.typography.weights.bold, textDecoration: 'none' };

export default Login;
