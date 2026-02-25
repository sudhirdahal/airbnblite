import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast'; // --- NEW: Toast Import ---
import API from '../services/api';

const Signup = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'registered' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await API.post('/auth/register', formData);
      
      // --- NEW: Using professional Toast ---
      toast.success(response.data.message, { duration: 6000 });
      
      /* OLD CODE: Basic browser alert
      alert(response.data.message);
      */
      
      navigate('/login');
    } catch (err) {
      // --- NEW: Using professional Toast ---
      toast.error(err.response?.data?.message || 'Registration failed');

      /* OLD CODE: Basic browser alert
      alert(err.response?.data?.message || 'Registration failed');
      */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={formCardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Create Account</h2>
          <p style={{ color: '#717171' }}>Join AirBnB Lite today</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={inputGroupStyle}>
            <User size={20} color="#717171" />
            <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required style={inputStyle} />
          </div>
          <div style={inputGroupStyle}>
            <Mail size={20} color="#717171" />
            <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required style={inputStyle} />
          </div>
          <div style={inputGroupStyle}>
            <Lock size={20} color="#717171" />
            <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required style={inputStyle} />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <label style={{ fontSize: '0.9rem', color: '#717171' }}>I want to be a:</label>
            <select name="role" value={formData.role} onChange={handleChange} style={selectStyle}>
              <option value="registered">Guest</option>
              <option value="admin">Host (Admin)</option>
            </select>
          </div>

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Creating account...' : <><UserPlus size={20} /> Sign Up</>}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          <p>Already have an account? <Link to="/login" style={{ color: '#ff385c', fontWeight: 'bold' }}>Login</Link></p>
        </div>
      </div>
    </div>
  );
};

const containerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', backgroundColor: '#fff' };
const formCardStyle = { width: '100%', maxWidth: '400px', padding: '2.5rem', borderRadius: '12px', border: '1px solid #ddd', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' };
const inputGroupStyle = { display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' };
const inputStyle = { border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '1rem' };
const selectStyle = { padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd', outline: 'none', backgroundColor: '#fff' };
const buttonStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', border: 'none', borderRadius: '8px', backgroundColor: '#ff385c', color: 'white', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' };

export default Signup;
