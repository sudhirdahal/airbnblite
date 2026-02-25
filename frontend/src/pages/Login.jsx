import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import toast from 'react-hot-toast'; // --- NEW: Toast Import ---
import API from '../services/api';

const Login = ({ setUser }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await API.post('/auth/login', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      
      // --- NEW: Using professional Toast ---
      toast.success(`Welcome back, ${response.data.user.name}!`);
      
      navigate('/');
    } catch (err) {
      // --- NEW: Using professional Toast ---
      const errorMsg = err.response?.data?.message || 'Login failed';
      toast.error(errorMsg);

      /* OLD CODE: Basic browser alert
      alert(err.response?.data?.message || 'Login failed');
      */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={formCardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Login</h2>
          <p style={{ color: '#717171' }}>Welcome back to AirBnB Lite</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={inputGroupStyle}>
            <Mail size={20} color="#717171" />
            <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required style={inputStyle} />
          </div>
          <div style={inputGroupStyle}>
            <Lock size={20} color="#717171" />
            <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required style={inputStyle} />
          </div>
          
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Logging in...' : <><LogIn size={20} /> Login</>}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          <p>Don't have an account? <Link to="/signup" style={{ color: '#ff385c', fontWeight: 'bold' }}>Sign up</Link></p>
          <Link to="/forgot-password" style={{ color: '#717171', textDecoration: 'none', display: 'block', marginTop: '0.5rem' }}>Forgot password?</Link>
        </div>
      </div>
    </div>
  );
};

const containerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', backgroundColor: '#fff' };
const formCardStyle = { width: '100%', maxWidth: '400px', padding: '2.5rem', borderRadius: '12px', border: '1px solid #ddd', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' };
const inputGroupStyle = { display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' };
const inputStyle = { border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '1rem' };
const buttonStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', border: 'none', borderRadius: '8px', backgroundColor: '#ff385c', color: 'white', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' };

export default Login;
