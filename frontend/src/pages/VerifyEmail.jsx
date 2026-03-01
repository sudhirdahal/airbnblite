import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2, XCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

/**
 * ============================================================================
 * EMAIL VERIFICATION PAGE (The Trust Validation Layer)
 * ============================================================================
 * This is a stateless confirmation pivot.
 * Logic: Extracts the hex token from the URL, validates it against the 
 * User collection, and activates the account status to 'isVerified: true'.
 */
const VerifyEmail = () => {
  const { setUser } = useAuth();
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'loading' | 'success' | 'error'

  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Backend pivot: /auth/verify/:token
        const res = await API.get(`/auth/verify/${token}`);
        
        // AUTO-LOGIN STAGE: If verification is success, we login the user instantly
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        
        setStatus('success');
        toast.success('Account verified!');
        
        // UX Delay: Let them see the success state for 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } catch (err) {
        setStatus('error');
        toast.error('Verification link is invalid or expired.');
      }
    };

    if (token) verifyToken();
  }, [token, navigate, setUser]);

  /* --- HISTORICAL STAGE 1: PRIMITIVE TEXT ---
   * return <div>Verifying your account...</div>;
   */

  return (
    <div style={containerStyle}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={cardStyle}>
        
        {status === 'verifying' && (
          <div style={statusGroup}>
            <Loader2 size={48} className="spin" color="#ff385c" />
            <h2 style={titleStyle}>Verifying account</h2>
            <p style={subtitleStyle}>Please wait while we confirm your email address...</p>
          </div>
        )}

        {status === 'success' && (
          <div style={statusGroup}>
            <CheckCircle2 size={64} color="#16a34a" />
            <h2 style={titleStyle}>Email Verified!</h2>
            <p style={subtitleStyle}>Success! You're being redirected to the home page.</p>
            <div style={progressLineBg}><motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 3 }} style={progressLineFill} /></div>
          </div>
        )}

        {status === 'error' && (
          <div style={statusGroup}>
            <XCircle size={64} color="#ef4444" />
            <h2 style={titleStyle}>Verification failed</h2>
            <p style={subtitleStyle}>The link may have expired or already been used.</p>
            <button onClick={() => navigate('/login')} style={buttonStyle}>Return to login</button>
          </div>
        )}

      </motion.div>
    </div>
  );
};

// --- STYLES ---
const containerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '2rem' };
const cardStyle = { width: '100%', maxWidth: '450px', padding: '4rem 3rem', border: '1px solid #eee', borderRadius: '32px', textAlign: 'center', backgroundColor: '#fff', boxShadow: '0 10px 40px rgba(0,0,0,0.04)' };
const statusGroup = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem' };
const titleStyle = { fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#222' };
const subtitleStyle = { color: '#717171', fontSize: '1rem', lineHeight: '1.5' };
const progressLineBg = { width: '100%', height: '4px', backgroundColor: '#eee', borderRadius: '2px', overflow: 'hidden', marginTop: '1rem' };
const progressLineFill = { height: '100%', backgroundColor: '#16a34a' };
const buttonStyle = { padding: '0.8rem 2rem', border: 'none', borderRadius: '12px', backgroundColor: '#222', color: 'white', fontWeight: 'bold', cursor: 'pointer', marginTop: '1rem' };

export default VerifyEmail;
