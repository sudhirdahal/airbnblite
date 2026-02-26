import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, CreditCard, PlaneTakeoff, XCircle, Clock, History } from 'lucide-react'; 
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import API from '../services/api';
import PageHeader from '../components/layout/PageHeader';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      const response = await API.get('/bookings/mybookings');
      setBookings(response.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this reservation?")) return;
    const cancelToast = toast.loading('Cancelling...');
    try {
      await API.put(`/bookings/${id}/cancel`);
      toast.success('Cancelled successfully', { id: cancelToast });
      fetchBookings();
    } catch (err) { toast.error('Failed to cancel', { id: cancelToast }); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading trips...</div>;

  // --- NEW: TRIP SEGMENTATION LOGIC ---
  const today = new Date();
  const upcoming = bookings.filter(b => b.status === 'confirmed' && new Date(b.checkIn) >= today);
  const past = bookings.filter(b => b.status === 'confirmed' && new Date(b.checkIn) < today);
  const cancelled = bookings.filter(b => b.status === 'cancelled');

  return (
    <div style={{ maxWidth: '2560px', width: '98%', margin: '3rem auto', padding: '0 2rem' }}>
      <PageHeader title="Trips" subtitle="Your journey history and upcoming adventures." icon={PlaneTakeoff} />

      {bookings.length === 0 ? (
        <div style={emptyStateStyle}>
          <h2>No trips found</h2>
          <Link to="/" style={primaryBtnStyle}>Find your next stay</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
          
          {/* SECTION: UPCOMING */}
          <TripSection 
            title="Upcoming Stays" 
            icon={Clock} 
            data={upcoming} 
            onCancel={handleCancel} 
            showCancel={true}
          />

          {/* SECTION: PAST */}
          <TripSection 
            title="Where you've been" 
            icon={History} 
            data={past} 
            isPast={true}
          />

          {/* SECTION: CANCELLED */}
          {cancelled.length > 0 && (
            <TripSection 
              title="Cancelled Trips" 
              icon={XCircle} 
              data={cancelled} 
              isCancelled={true}
            />
          )}

        </div>
      )}
    </div>
  );
};

// --- Reusable Section Component ---
const TripSection = ({ title, icon: Icon, data, onCancel, showCancel, isPast, isCancelled }) => {
  if (data.length === 0) return null;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
        <Icon size={20} color="#717171" />
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{title}</h2>
      </div>
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {data.map(b => (
          <TripCard key={b._id} booking={b} onCancel={onCancel} showCancel={showCancel} isPast={isPast} isCancelled={isCancelled} />
        ))}
      </div>
    </div>
  );
};

const TripCard = ({ booking, onCancel, showCancel, isPast, isCancelled }) => {
  const listing = booking.listingId;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={cardStyle(isCancelled)}>
      <Link to={`/listing/${listing._id}`}>
        <img src={listing.images[0]} style={{ width: '200px', height: '140px', objectFit: 'cover', borderRadius: '12px' }} alt="Thumb" />
      </Link>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: '0 0 0.2rem 0' }}>{listing.title}</h3>
          <p style={{ color: '#717171', margin: 0 }}>{listing.location}</p>
          <div style={{ marginTop: '1rem', fontSize: '0.9rem', fontWeight: '600' }}>
            {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: '800', fontSize: '1.2rem' }}>${booking.totalPrice}</div>
          {showCancel && <button onClick={() => onCancel(booking._id)} style={cancelBtnStyle}>Cancel</button>}
          {isPast && <div style={statusBadge('#eee', '#717171')}>Completed</div>}
          {isCancelled && <div style={statusBadge('#fff1f2', '#ff385c')}>Cancelled</div>}
        </div>
      </div>
    </motion.div>
  );
};

// --- STYLES ---
const emptyStateStyle = { padding: '4rem', textAlign: 'center', border: '1px solid #eee', borderRadius: '20px' };
const primaryBtnStyle = { display: 'inline-block', marginTop: '1rem', padding: '0.8rem 1.5rem', backgroundColor: '#222', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' };
const cardStyle = (cancelled) => ({ display: 'flex', gap: '2rem', padding: '1.2rem', border: '1px solid #eee', borderRadius: '16px', opacity: cancelled ? 0.6 : 1 });
const cancelBtnStyle = { marginTop: '0.5rem', padding: '0.5rem 1rem', border: '1px solid #ff385c', color: '#ff385c', backgroundColor: 'transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const statusBadge = (bg, col) => ({ display: 'inline-block', marginTop: '0.5rem', padding: '0.3rem 0.8rem', backgroundColor: bg, color: col, borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase' });

export default Bookings;
