import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, ShieldCheck, Lock, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import API from '../services/api';

/**
 * ============================================================================
 * MOCK PAYMENT PAGE (The Checkout Engine)
 * ============================================================================
 * UPDATED: Added a high-fidelity 'Success Modal' with animated feedback.
 * This component handles the final booking persistence and provides a 
 * rewarding visual confirmation to the traveler.
 */
const MockPayment = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false); // --- NEW: Success State ---

  if (!state) return <div style={{ padding: '4rem', textAlign: 'center' }}>Session expired. Please restart your booking.</div>;

  const { listingId, bookingDetails, listing } = state;

  /**
   * TRANSACTION HANDLER
   * Communicates with the backend to finalize the reservation.
   */
  const handlePayment = async (e) => {
    e.preventDefault();
    setProcessing(true);
    const payToast = toast.loading('Securing your stay...');

    try {
      // PERSISTENCE STAGE: Save booking to DB
      await API.post('/bookings', {
        listingId,
        checkIn: bookingDetails.checkIn,
        checkOut: bookingDetails.checkOut,
        totalPrice: bookingDetails.total
      });

      toast.success('Transaction Successful!', { id: payToast });
      
      // --- FEEDBACK STAGE: Show Success Animation ---
      setShowSuccess(true);
      
      // Auto-redirect after visual reward
      setTimeout(() => {
        navigate('/bookings');
      }, 2500);

    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed', { id: payToast });
      setProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '4rem auto', padding: '0 2rem' }}>
      
      {/* --- HIGH-FIDELITY SUCCESS MODAL --- */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={successOverlayStyle}>
            <motion.div initial={{ scale: 0.5, y: 20 }} animate={{ scale: 1, y: 0 }} style={successCardStyle}>
              <div className="pulse-dot" style={successIconWrapper}>
                <CheckCircle2 size={64} color="#16a34a" />
              </div>
              <h2 style={{ fontSize: '2rem', margin: '1rem 0' }}>Stay Confirmed!</h2>
              <p style={{ color: '#717171', textAlign: 'center', marginBottom: '2rem' }}>Your adventure at {listing.title} is all set. We've sent a confirmation email.</p>
              <div style={loadingBarBg}><motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2 }} style={loadingBarFill} /></div>
              <p style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '1rem' }}>Redirecting to your trips...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
        <button onClick={() => navigate(-1)} style={backBtnStyle}><ChevronLeft size={20} /></button>
        <h1 style={{ margin: 0 }}>Confirm and pay</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '6rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          
          <section>
            <h3 style={sectionTitle}>Your trip</h3>
            <div style={tripDetailRow}>
              <div><div style={{ fontWeight: 'bold' }}>Dates</div><div>{new Date(bookingDetails.checkIn).toLocaleDateString()} – {new Date(bookingDetails.checkOut).toLocaleDateString()}</div></div>
            </div>
            <div style={tripDetailRow}>
              <div><div style={{ fontWeight: 'bold' }}>Guests</div><div>{bookingDetails.guests.adults + bookingDetails.guests.children} guests</div></div>
            </div>
          </section>

          <section style={{ borderTop: '1px solid #eee', paddingTop: '2.5rem' }}>
            <h3 style={sectionTitle}>Pay with Credit Card</h3>
            <form onSubmit={handlePayment} style={cardFormStyle}>
              <div style={inputGroup}><label style={labelStyle}>Card Number</label><input type="text" placeholder="0000 0000 0000 0000" style={inputStyle} required /></div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}><label style={labelStyle}>Expiration</label><input type="text" placeholder="MM / YY" style={inputStyle} required /></div>
                <div style={{ flex: 1 }}><label style={labelStyle}>CVV</label><input type="text" placeholder="123" style={inputStyle} required /></div>
              </div>
              <button type="submit" disabled={processing} style={payBtnStyle}>{processing ? 'Processing...' : `Pay $${bookingDetails.total}`}</button>
            </form>
          </section>

        </div>

        <aside style={summaryCardStyle}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '2rem' }}>
            <img src={listing.images[0]} style={listingThumbStyle} alt="Thumb" />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{listing.title}</div>
              <div style={{ fontSize: '0.8rem', color: '#717171' }}>{listing.location}</div>
            </div>
          </div>
          <h3 style={sectionTitle}>Price details</h3>
          <div style={priceRow}><span>${listing.rate} x {bookingDetails.nights} nights</span><span>${bookingDetails.nights * listing.rate}</span></div>
          <div style={priceRow}><span>Service fee</span><span>${Math.round(bookingDetails.total - (bookingDetails.nights * listing.rate))}</span></div>
          <div style={totalRow}><span>Total (USD)</span><span>${bookingDetails.total}</span></div>
        </aside>
      </div>
    </div>
  );
};

// --- STYLES ---
const successOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.98)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const successCardStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '450px', padding: '3rem', backgroundColor: '#fff', borderRadius: '32px', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' };
const successIconWrapper = { width: '100px', height: '100px', backgroundColor: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' };
const loadingBarBg = { width: '100%', height: '4px', backgroundColor: '#eee', borderRadius: '2px', overflow: 'hidden', marginTop: '1rem' };
const loadingBarFill = { height: '100%', backgroundColor: '#16a34a' };

const backBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' };
const sectionTitle = { fontSize: '1.4rem', marginBottom: '1.5rem' };
const tripDetailRow = { display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' };
const cardFormStyle = { display: 'flex', flexDirection: 'column', gap: '1.2rem', border: '1px solid #ddd', padding: '2rem', borderRadius: '16px' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };
const labelStyle = { fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#717171' };
const inputStyle = { padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' };
const payBtnStyle = { marginTop: '1rem', padding: '1rem', backgroundColor: '#ff385c', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' };
const summaryCardStyle = { border: '1px solid #ddd', borderRadius: '24px', padding: '2.5rem', height: 'fit-content', position: 'sticky', top: '120px' };
const listingThumbStyle = { width: '100px', height: '100px', borderRadius: '12px', objectFit: 'cover' };
const priceRow = { display: 'flex', justifyContent: 'space-between', color: '#222', marginBottom: '0.8rem' };
const totalRow = { display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' };

export default MockPayment;
