import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import API from '../services/api';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    token: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    setError('');

    try {
      await API.post('/auth/resetpassword', {
        email: formData.email,
        token: formData.token,
        newPassword: formData.newPassword
      });
      setMessage('Password reset successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={formCardStyle}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Reset Password</h2>
        
        {message && <div style={{ color: 'green', marginBottom: '1rem', textAlign: 'center' }}>{message}</div>}
        {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="email" 
            placeholder="Email address" 
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required 
            style={inputStyle} 
          />
          <input 
            type="text" 
            placeholder="6-digit Reset Code" 
            value={formData.token}
            onChange={(e) => setFormData({...formData, token: e.target.value})}
            required 
            style={{ ...inputStyle, letterSpacing: '5px', textAlign: 'center', fontWeight: 'bold' }} 
          />
          <input 
            type="password" 
            placeholder="New Password" 
            value={formData.newPassword}
            onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
            required 
            style={inputStyle} 
          />
          <input 
            type="password" 
            placeholder="Confirm New Password" 
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            required 
            style={inputStyle} 
          />
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Updating...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

const containerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', padding: '1rem' };
const formCardStyle = { width: '100%', maxWidth: '400px', padding: '2rem', border: '1px solid #ddd', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };
const inputStyle = { padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' };
const buttonStyle = { padding: '1rem', borderRadius: '8px', border: 'none', backgroundColor: '#ff385c', color: 'white', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' };

export default ResetPassword;
