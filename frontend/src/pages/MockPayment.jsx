import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Lock, ChevronLeft, CheckCircle2, ShieldCheck, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import API from '../services/api';
import { theme } from '../theme';

/**
 * ============================================================================
 * MOCK PAYMENT PAGE (The Global Transaction Gateway)
 * ============================================================================
 * Architectural Evolution:
 * - Phase 4: Simple card-number-only mock.
 * - Phase 33: Context-Aware Handshake (Received booking state).
 * - Phase 36: The Financial Integrity Engine (Internationalized validation).
 */

/* ============================================================================
 * 👻 HISTORICAL GHOST: PHASE 4 (The Primitive Mock)
 * ============================================================================
 * const [cardNumber, setCardNumber] = useState('');
 * // Problem: Too simplistic. Didn't validate expiration, CVV, or identity.
 * // Result: High rates of "Garbage Data" in the database.
 * ============================================================================ */

const MockPayment = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false); 

  // --- COMPREHENSIVE FORM STATE ---
  const [paymentData, setPaymentData] = useState({
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    address: '',
    city: '',
    region: '',
    postalCode: '',
    country: 'United States'
  });

  // --- HIERARCHICAL GEOGRAPHIC ENGINE (The Logic Lock) ---
  const geoData = {
    'United States': {
      label: 'State',
      zipLabel: 'Zip Code',
      regions: {
        'California': ['Los Angeles', 'San Francisco', 'San Diego'],
        'New York': ['New York City', 'Buffalo', 'Albany'],
        'Texas': ['Houston', 'Austin', 'Dallas'],
        'Florida': ['Miami', 'Orlando', 'Tampa']
      }
    },
    'Canada': {
      label: 'Province',
      zipLabel: 'Postal Code',
      regions: {
        'Ontario': ['Toronto', 'Ottawa', 'Mississauga'],
        'British Columbia': ['Vancouver', 'Victoria', 'Kelowna'],
        'Quebec': ['Montreal', 'Quebec City', 'Laval'],
        'Alberta': ['Calgary', 'Edmonton', 'Banff']
      }
    },
    'United Kingdom': {
      label: 'County',
      zipLabel: 'Postcode',
      regions: {
        'Greater London': ['London', 'Westminster', 'Croydon'],
        'West Midlands': ['Birmingham', 'Coventry', 'Wolverhampton'],
        'Greater Manchester': ['Manchester', 'Salford', 'Bolton']
      }
    },
    'Australia': {
      label: 'State',
      zipLabel: 'Postcode',
      regions: {
        'New South Wales': ['Sydney', 'Newcastle', 'Wollongong'],
        'Victoria': ['Melbourne', 'Geelong', 'Ballarat'],
        'Queensland': ['Brisbane', 'Gold Coast', 'Cairns']
      }
    }
  };

  const currentGeo = geoData[paymentData.country] || geoData['United States'];
  const availableRegions = Object.keys(currentGeo.regions);
  const availableCities = paymentData.region ? currentGeo.regions[paymentData.region] : [];

  if (!state) return <div style={{ padding: '10rem', textAlign: 'center' }}>Session context lost. Please restart your booking.</div>;

  const { listingId, bookingDetails, listing } = state;

  // --- AUTO-FORMATTERS (Perceived Performance) ---
  const handleCardFormat = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 16);
    val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setPaymentData({ ...paymentData, cardNumber: val });
  };

  const handleExpiryFormat = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 3) val = val.substring(0, 2) + '/' + val.substring(2);
    setPaymentData({ ...paymentData, expiry: val });
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setProcessing(true);
    const payToast = toast.loading('Authorizing Transaction...');
    
    try {
      await API.post('/bookings', {
        listingId, 
        checkIn: bookingDetails.checkIn,
        checkOut: bookingDetails.checkOut, 
        totalPrice: bookingDetails.total,
        guests: bookingDetails.guests, // Sending the full breakdown (Phase 38)
        paymentDetails: paymentData // Sending the full manifest for backend verification
      });
      
      toast.success('Transaction Authorized', { id: payToast });
      setShowSuccess(true);
      setTimeout(() => { navigate('/bookings'); }, 2500);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Authorization Failure';
      toast.error(errorMsg, { id: payToast });
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

      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '1.2fr 1fr', gap: '6rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
              <ShieldCheck size={24} color={theme.colors.success} />
              <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold' }}>Secure Checkout</h3>
            </div>
            <div style={tripDetailRow}>
              <div><div style={{ fontWeight: 'bold' }}>Travel Dates</div><div style={{ color: theme.colors.charcoal }}>{new Date(bookingDetails.checkIn).toLocaleDateString()} – {new Date(bookingDetails.checkOut).toLocaleDateString()}</div></div>
            </div>
          </section>

          <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {/* --- CARD SECTION --- */}
            <section style={formSectionStyle}>
              <h4 style={sectionSubTitle}>Credit Card Information</h4>
              <div style={inputGroup}>
                <label style={labelStyle}>Cardholder Name</label>
                <input type="text" placeholder="John Q. Public" value={paymentData.cardName} onChange={(e) => setPaymentData({...paymentData, cardName: e.target.value})} style={inputStyle} required />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Card Number</label>
                <div style={{ position: 'relative' }}>
                  <input type="text" placeholder="0000 0000 0000 0000" value={paymentData.cardNumber} onChange={handleCardFormat} style={inputStyle} required />
                  <CreditCard size={18} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: theme.colors.slate }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={inputGroup}><label style={labelStyle}>Expiry Date</label><input type="text" placeholder="MM/YY" value={paymentData.expiry} onChange={handleExpiryFormat} style={inputStyle} required /></div>
                <div style={inputGroup}><label style={labelStyle}>CVV</label><input type="text" placeholder="123" maxLength="4" value={paymentData.cvv} onChange={(e) => setPaymentData({...paymentData, cvv: e.target.value.replace(/\D/g, '')})} style={inputStyle} required /></div>
              </div>
            </section>

            {/* --- BILLING SECTION --- */}
            <section style={formSectionStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                <Globe size={18} color={theme.colors.slate} />
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>Billing Address</h4>
              </div>
              
              <div style={inputGroup}>
                <label style={labelStyle}>Country / Region</label>
                <select value={paymentData.country} onChange={(e) => setPaymentData({...paymentData, country: e.target.value, region: '', city: ''})} style={selectStyle}>
                  {Object.keys(geoData).map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>

              <div style={inputGroup}>
                <label style={labelStyle}>Street Address</label>
                <input type="text" placeholder="123 Stay Street" value={paymentData.address} onChange={(e) => setPaymentData({...paymentData, address: e.target.value})} style={inputStyle} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={inputGroup}>
                  <label style={labelStyle}>{currentGeo.label}</label>
                  <select 
                    value={paymentData.region} 
                    onChange={(e) => setPaymentData({...paymentData, region: e.target.value, city: ''})} 
                    style={selectStyle} 
                    required
                  >
                    <option value="">Select...</option>
                    {availableRegions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div style={inputGroup}>
                  <label style={labelStyle}>City</label>
                  <select 
                    value={paymentData.city} 
                    onChange={(e) => setPaymentData({...paymentData, city: e.target.value})} 
                    style={selectStyle} 
                    disabled={!paymentData.region}
                    required
                  >
                    <option value="">Select...</option>
                    {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={inputGroup}>
                <label style={labelStyle}>{currentGeo.zipLabel}</label>
                <input type="text" value={paymentData.postalCode} onChange={(e) => setPaymentData({...paymentData, postalCode: e.target.value})} style={inputStyle} required />
              </div>
            </section>

            <button type="submit" disabled={processing} style={payBtnStyle}>
              {processing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', justifyContent: 'center' }}>
                  <div className="spin" style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%' }} />
                  Processing...
                </div>
              ) : `Confirm and Pay $${bookingDetails.total}`}
            </button>
          </form>
        </div>

        <aside style={summaryCardStyle}>
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', borderBottom: `1px solid ${theme.colors.divider}`, paddingBottom: '2rem' }}>
            <img src={listing.images[0]} style={listingThumbStyle} alt="Thumb" />
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{listing.title}</div>
              <div style={{ fontSize: '0.9rem', color: theme.colors.slate, marginTop: '0.3rem' }}>{listing.location}</div>
            </div>
          </div>
          <h3 style={sectionTitle}>Price details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={priceRow}><span>Guests</span><span>{bookingDetails.guests.adults} Adults{bookingDetails.guests.children > 0 ? `, ${bookingDetails.guests.children} Children` : ''}{bookingDetails.guests.infants > 0 ? `, ${bookingDetails.guests.infants} Infants` : ''}</span></div>
            <div style={priceRow}><span>${listing.rate} x {bookingDetails.nights} nights</span><span>${listing.rate * bookingDetails.nights}</span></div>
            {bookingDetails.guests.children > 0 && listing.childRate > 0 && (
              <div style={priceRow}><span>Children surcharge</span><span>${bookingDetails.guests.children * listing.childRate * bookingDetails.nights}</span></div>
            )}
            {bookingDetails.guests.infants > 0 && listing.infantRate > 0 && (
              <div style={priceRow}><span>Infant surcharge</span><span>${bookingDetails.guests.infants * listing.infantRate * bookingDetails.nights}</span></div>
            )}
            <div style={priceRow}><span>AirnbLite service fee (14%)</span><span>${Math.round((bookingDetails.total / 1.14) * 0.14)}</span></div>
            <div style={totalRow}><span>Total (USD)</span><span>${bookingDetails.total}</span></div>
          </div>
          <div style={{ marginTop: '2rem', padding: '1.2rem', backgroundColor: '#f9fafb', borderRadius: '12px', display: 'flex', gap: '1rem' }}>
            <Lock size={18} color={theme.colors.slate} />
            <p style={{ margin: 0, fontSize: '0.85rem', color: theme.colors.slate, lineHeight: '1.4' }}>
              Your payment is encrypted and processed via our secure mock gateway. We never store your full card details.
            </p>
          </div>
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
const sectionSubTitle = { fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: 'bold', color: theme.colors.charcoal };
const tripDetailRow = { display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' };
const formSectionStyle = { border: `1px solid ${theme.colors.border}`, padding: '2.5rem', borderRadius: theme.radius.lg, display: 'flex', flexDirection: 'column', gap: '1.5rem' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '0.6rem' };
const labelStyle = { fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', color: theme.colors.slate, letterSpacing: '0.05em' };
const inputStyle = { padding: '1rem 1.2rem', borderRadius: theme.radius.sm, border: `1px solid ${theme.colors.divider}`, fontSize: '1rem', transition: 'border-color 0.2s' };
const selectStyle = { ...inputStyle, appearance: 'none', backgroundColor: 'white', backgroundImage: 'url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-2.6H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E\")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.2rem top 50%', backgroundSize: '0.65rem auto' };
const payBtnStyle = { marginTop: '1rem', padding: '1.3rem', backgroundColor: theme.colors.brand, color: theme.colors.white, border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '1.15rem', cursor: 'pointer', transition: 'transform 0.1s' };
const summaryCardStyle = { border: `1px solid ${theme.colors.divider}`, borderRadius: theme.radius.lg, padding: '2.5rem', backgroundColor: theme.colors.white, boxShadow: theme.shadows.card, height: 'fit-content', position: 'sticky', top: '120px' };
const listingThumbStyle = { width: '120px', height: '100px', borderRadius: '12px', objectFit: 'cover' };
const priceRow = { display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: theme.colors.slate };
const totalRow = { display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '1.2rem', color: theme.colors.charcoal, borderTop: `1px solid ${theme.colors.divider}`, paddingTop: '1.5rem', marginTop: '0.5rem' };

export default MockPayment;
