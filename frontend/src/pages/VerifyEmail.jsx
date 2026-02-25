import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail = ({ setUser }) => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); 
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/auth/verify/${token}`);
        
        // AUTO-LOGIN LOGIC:
        // 1. Save credentials to localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // 2. Update global app state
        setUser(response.data.user);
        
        setStatus('success');
        setMessage(response.data.message);

        // 3. Redirect to home after a short delay
        setTimeout(() => navigate('/'), 5000);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed.');
      }
    };
    verifyToken();
  }, [token, setUser, navigate]);

  return (
    <div style={{ maxWidth: '600px', margin: '5rem auto', textAlign: 'center', padding: '2rem', border: '1px solid #ddd', borderRadius: '12px' }}>
      {status === 'verifying' && <h2>Verifying your email...</h2>}
      
      {status === 'success' && (
        <>
          <h2 style={{ color: 'green' }}>Email Verified! ✅</h2>
          <p>{message}</p>
          <p>Logging you in and taking you home...</p>
          <div style={{ marginTop: '1rem', color: '#717171', fontSize: '0.9rem' }}>Redirecting in 5 seconds...</div>
        </>
      )}

      {status === 'error' && (
        <>
          <h2 style={{ color: 'red' }}>Verification Failed ❌</h2>
          <p>{message}</p>
          <Link to="/signup" style={{ color: '#ff385c', fontWeight: 'bold' }}>Try signing up again</Link>
        </>
      )}
    </div>
  );
};

export default VerifyEmail;
