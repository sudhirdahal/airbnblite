import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await API.post('/auth/forgotpassword', { email });
      setMessage('A reset code has been sent to your email.');
      // Pass the email to the reset page so user doesn't have to re-type it
      setTimeout(() => navigate('/reset-password', { state: { email } }), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={formCardStyle}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Forgot Password</h2>
        <p style={{ fontSize: '0.9rem', color: '#717171', marginBottom: '1.5rem', textAlign: 'center' }}>
          Enter your email and we'll send you a 6-digit code to reset your password.
        </p>
        
        {message && <div style={{ color: 'green', marginBottom: '1rem', textAlign: 'center' }}>{message}</div>}
        {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="email" 
            placeholder="Email address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
            style={inputStyle} 
          />
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Sending...' : 'Send Reset Code'}
          </button>
        </form>
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          Remember your password? <Link to="/login" style={{ color: '#ff385c', fontWeight: 'bold' }}>Back to Log in</Link>
        </div>
      </div>
    </div>
  );
};

const containerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', padding: '1rem' };
const formCardStyle = { width: '100%', maxWidth: '400px', padding: '2rem', border: '1px solid #ddd', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };
const inputStyle = { padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' };
const buttonStyle = { padding: '1rem', borderRadius: '8px', border: 'none', backgroundColor: '#ff385c', color: 'white', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' };

export default ForgotPassword;
