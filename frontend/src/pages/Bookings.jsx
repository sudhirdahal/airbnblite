import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, CreditCard, PlaneTakeoff, XCircle, Clock, History, ArrowRight } from 'lucide-react'; 
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import API from '../services/api';
import PageHeader from '../components/layout/PageHeader';
import { theme } from '../theme';

/**
 * ============================================================================
 * BOOKINGS PAGE (The Traveler History Hub)
 * ============================================================================
 * This component manages the lifecycle presentation of user reservations.
 * Evolution:
 * 1. Stage 1: Basic flat list of all records (Phase 1).
 * 2. Stage 2: Basic 'Confirmed' vs 'Cancelled' filtering (Phase 4).
 * 3. Stage 3: Smart Temporal Segmentation (Upcoming vs Past) (Current).
 */
const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * DATA SYNCHRONIZATION
   * Pulls the 'My Bookings' collection from the backend.
   */
  const fetchBookings = async () => {
    try {
      const response = await API.get('/bookings/mybookings');
      setBookings(response.data);
    } catch (err) { 
      console.error('Bookings Sync Failure:', err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  /**
   * CANCELLATION HANDSHAKE
   * Logic: Finalizes the 'cancelled' status transition and triggers 
   * a silent re-fetch to update the temporal segments instantly.
   */
  const handleCancel = async (id) => {
    if (!window.confirm("Void this reservation? This action is permanent.")) return;
    const cancelToast = toast.loading('Synchronizing cancellation...');
    try {
      await API.put(`/bookings/${id}/cancel`);
      toast.success('Reservation successfully voided.', { id: cancelToast });
      fetchBookings(); 
    } catch (err) { 
      toast.error('Sync Failure', { id: cancelToast }); 
    }
  };

  /* --- HISTORICAL STAGE 1: PRIMITIVE LIST ---
   * return (
   *   <div>
   *     {bookings.map(b => <div key={b._id}>{b.listingId.title}</div>)}
   *   </div>
   * );
   */

  if (loading) return <div style={{ textAlign: 'center', padding: '10rem' }}>Synchronizing your travel history...</div>;

  /**
   * ============================================================================
   * SMART SEGMENTATION ENGINE
   * ============================================================================
   * Logic: Partition confirmed bookings into 'Upcoming' and 'Completed' 
   * based on the current system clock. Segregates 'Cancelled' into a 
   * distinct low-priority section.
   */
  const today = new Date();
  const upcoming = bookings.filter(b => b.status === 'confirmed' && new Date(b.checkIn) >= today);
  const past = bookings.filter(b => b.status === 'confirmed' && new Date(b.checkIn) < today);
  const cancelled = bookings.filter(b => b.status === 'cancelled');

  return (
    <div style={{ maxWidth: '2560px', width: '98%', margin: '3rem auto', padding: '0 4rem' }}>
      <PageHeader title="Trips" subtitle={`You have ${upcoming.length} upcoming adventures planned.`} icon={PlaneTakeoff} />

      {bookings.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={emptyStateStyle}>
          <div style={emptyIconWrapper}><PlaneTakeoff size={48} color={theme.colors.brand} /></div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>No trips booked... yet!</h2>
          <p style={{ color: theme.colors.slate, marginBottom: '2rem' }}>Time to dust off your bags and start planning your next getaway.</p>
          <Link to="/" style={exploreBtnStyle}>Start searching <ArrowRight size={18} /></Link>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5rem' }}>
          
          {/* UPCOMING SEGMENT */}
          <TripSection title="Upcoming Stays" icon={Clock} data={upcoming} onCancel={handleCancel} showCancel={true} index={0} />
          
          {/* COMPLETED SEGMENT */}
          <TripSection title="Past Adventures" icon={History} data={past} isPast={true} index={1} />
          
          {/* CANCELLED SEGMENT */}
          {cancelled.length > 0 && (
            <TripSection title="Cancelled" icon={XCircle} data={cancelled} isCancelled={true} index={2} />
          )}

        </div>
      )}
    </div>
  );
};

// --- Sub-Component: TripSection (With Staggered Entrance) ---
const TripSection = ({ title, icon: Icon, data, onCancel, showCancel, isPast, isCancelled, index }) => {
  if (data.length === 0) return null;
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }} 
      animate={{ opacity: 1, x: 0 }} 
      transition={{ delay: index * 0.15 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={sectionIconStyle}><Icon size={20} color={theme.colors.brand} /></div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0 }}>{title}</h2>
      </div>
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {data.map(b => (
          <TripCard key={b._id} booking={b} onCancel={onCancel} showCancel={showCancel} isPast={isPast} isCancelled={isCancelled} />
        ))}
      </div>
    </motion.div>
  );
};

// --- Sub-Component: TripCard (With High-Fidelity Theming) ---
const TripCard = ({ booking, onCancel, showCancel, isPast, isCancelled }) => {
  const listing = booking.listingId;
  return (
    <motion.div whileHover={{ y: -2 }} style={cardStyle(isCancelled)}>
      <Link to={`/listing/${listing?._id}`}>
        <img src={listing?.images?.[0]} style={thumbStyle} alt="Listing" />
      </Link>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>{listing?.title}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: theme.colors.slate, marginTop: '0.3rem' }}>
            <MapPin size={14} /> {listing?.location}
          </div>
          <div style={dateRangeStyle}>
            {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: '900', fontSize: '1.4rem', color: theme.colors.charcoal }}>${booking.totalPrice}</div>
          {showCancel && <button onClick={() => onCancel(booking._id)} style={cancelBtnStyle}>Void Reservation</button>}
          {isPast && <div style={statusBadgeStyle(theme.colors.success)}>Stay Completed</div>}
          {isCancelled && <div style={statusBadgeStyle(theme.colors.brand)}>Voided</div>}
        </div>
      </div>
    </motion.div>
  );
};

// --- STYLES ---
const emptyStateStyle = { padding: '8rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', border: `1px solid ${theme.colors.divider}`, borderRadius: theme.radius.lg, backgroundColor: theme.colors.white, boxShadow: theme.shadows.card };
const emptyIconWrapper = { width: '100px', height: '100px', backgroundColor: '#fff1f2', borderRadius: theme.radius.full, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' };
const exploreBtnStyle = { display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1rem 2.5rem', backgroundColor: theme.colors.charcoal, color: theme.colors.white, borderRadius: theme.radius.md, textDecoration: 'none', fontWeight: '800' };
const sectionIconStyle = { backgroundColor: '#fff1f2', padding: '0.6rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const cardStyle = (cancelled) => ({ display: 'flex', gap: '2rem', padding: '1.2rem', border: `1px solid ${theme.colors.divider}`, borderRadius: theme.radius.lg, backgroundColor: theme.colors.white, opacity: cancelled ? 0.6 : 1, transition: theme.transitions.standard, boxShadow: theme.shadows.card });
const thumbStyle = { width: '220px', height: '150px', objectFit: 'cover', borderRadius: '16px', border: `1px solid ${theme.colors.divider}` };
const dateRangeStyle = { marginTop: '1.2rem', fontSize: '0.95rem', fontWeight: '700', color: theme.colors.charcoal, backgroundColor: theme.colors.lightGrey, display: 'inline-block', padding: '0.4rem 1rem', borderRadius: '8px' };
const cancelBtnStyle = { marginTop: '0.8rem', padding: '0.6rem 1.2rem', border: `1px solid ${theme.colors.brand}`, color: theme.colors.brand, backgroundColor: 'transparent', borderRadius: theme.radius.sm, cursor: 'pointer', fontWeight: '800', fontSize: '0.85rem' };
const statusBadgeStyle = (color) => ({ display: 'inline-block', marginTop: '0.8rem', padding: '0.4rem 1.2rem', backgroundColor: `${color}15`, color: color, borderRadius: '30px', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' });

export default Bookings;
