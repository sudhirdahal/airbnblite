import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Lock, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import API from '../services/api';
import { theme } from '../theme'; // --- NEW: THEME AUTHORITY ---

/**
 * ============================================================================
 * MOCK PAYMENT PAGE (The Transaction Gateway)
 * ============================================================================
 * OVERHAUL: Refactored to consume the centralized Design Token system.
 * This ensures that financial summaries and success rewards maintain
 * professional-grade visual consistency.
 */
const MockPayment = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false); 

  if (!state) return <div style={{ padding: '10rem', textAlign: 'center' }}>Session context lost. Please restart your booking.</div>;

  const { listingId, bookingDetails, listing } = state;

  const handlePayment = async (e) => {
    e.preventDefault();
    setProcessing(true);
    const payToast = toast.loading('Securing your stay...');
    try {
      await API.post('/bookings', {
        listingId, checkIn: bookingDetails.checkIn,
        checkOut: bookingDetails.checkOut, totalPrice: bookingDetails.total
      });
      toast.success('Confirmed!', { id: payToast });
      setShowSuccess(true);
      setTimeout(() => { navigate('/bookings'); }, 2500);
    } catch (err) {
      toast.error('Sync Error', { id: payToast });
      setProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '4rem auto', padding: '0 2rem' }}>
      
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={successOverlayStyle}>
            <motion.div initial={{ scale: 0.5, y: 20 }} animate={{ scale: 1, y: 0 }} style={successCardStyle}>
              <div className="pulse-dot" style={successIconWrapper}><CheckCircle2 size={64} color={theme.colors.success} /></div>
              <h2 style={{ fontSize: '2rem', margin: '1rem 0', fontWeight: theme.typography.weights.extraBold }}>Stay Confirmed!</h2>
              <p style={{ color: theme.colors.slate, textAlign: 'center', marginBottom: '2rem' }}>Your adventure is all set. We've notified the host.</p>
              <div style={loadingBarBg}><motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2.5 }} style={loadingBarFill} /></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
        <button onClick={() => navigate(-1)} style={backBtnStyle}><ChevronLeft size={20} /></button>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: theme.typography.weights.extraBold }}>Confirm and pay</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '6rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          
          <section>
            <h3 style={sectionTitle}>Your trip</h3>
            <div style={tripDetailRow}>
              <div><div style={{ fontWeight: 'bold' }}>Dates</div><div style={{ color: theme.colors.charcoal }}>{new Date(bookingDetails.checkIn).toLocaleDateString()} – {new Date(bookingDetails.checkOut).toLocaleDateString()}</div></div>
            </div>
          </section>

          <section style={{ borderTop: `1px solid ${theme.colors.divider}`, paddingTop: '2.5rem' }}>
            <h3 style={sectionTitle}>Secure Payment</h3>
            <form onSubmit={handlePayment} style={cardFormStyle}>
              <div style={inputGroup}><label style={labelStyle}>Card Number</label><input type="text" placeholder="0000 0000 0000 0000" style={inputStyle} required /></div>
              <button type="submit" disabled={processing} style={payBtnStyle}>{processing ? 'Processing...' : `Pay $${bookingDetails.total}`}</button>
            </form>
          </section>

        </div>

        <aside style={summaryCardStyle}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: `1px solid ${theme.colors.divider}`, paddingBottom: '2rem' }}>
            <img src={listing.images[0]} style={listingThumbStyle} alt="Thumb" />
            <div><div style={{ fontWeight: 'bold' }}>{listing.title}</div><div style={{ fontSize: '0.8rem', color: theme.colors.slate }}>{listing.location}</div></div>
          </div>
          <h3 style={sectionTitle}>Price details</h3>
          <div style={totalRow}><span>Total (USD)</span><span>${bookingDetails.total}</span></div>
        </aside>
      </div>
    </div>
  );
};

// --- STYLES ---
const successOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.98)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const successCardStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '90%', maxWidth: '480px', padding: '4rem 3rem', backgroundColor: theme.colors.white, borderRadius: theme.radius.lg, boxShadow: theme.shadows.lg };
const successIconWrapper = { width: '110px', height: '110px', backgroundColor: '#f0fdf4', borderRadius: theme.radius.full, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' };
const loadingBarBg = { width: '100%', height: '6px', backgroundColor: theme.colors.lightGrey, borderRadius: '3px', overflow: 'hidden' };
const loadingBarFill = { height: '100%', backgroundColor: theme.colors.success };
const backBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: theme.radius.full, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const sectionTitle = { fontSize: '1.4rem', marginBottom: '1.8rem', fontWeight: 'bold' };
const tripDetailRow = { display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' };
const cardFormStyle = { display: 'flex', flexDirection: 'column', gap: '1.5rem', border: `1px solid ${theme.colors.border}`, padding: '2.5rem', borderRadius: theme.radius.md };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '0.6rem' };
const labelStyle = { fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: theme.colors.slate };
const inputStyle = { padding: '0.9rem 1.2rem', borderRadius: theme.radius.sm, border: `1px solid ${theme.colors.divider}`, fontSize: '1rem' };
const payBtnStyle = { marginTop: '1rem', padding: '1.1rem', backgroundColor: theme.colors.brand, color: theme.colors.white, border: 'none', borderRadius: theme.radius.sm, fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' };
const summaryCardStyle = { border: `1px solid ${theme.colors.divider}`, borderRadius: theme.radius.lg, padding: '2.5rem', backgroundColor: theme.colors.white, boxShadow: theme.shadows.card };
const listingThumbStyle = { width: '100px', height: '100px', borderRadius: theme.radius.md, objectFit: 'cover' };
const totalRow = { display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.15rem', color: theme.colors.charcoal };

export default MockPayment;
