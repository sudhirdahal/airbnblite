import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, CreditCard, PlaneTakeoff } from 'lucide-react'; // --- NEW: Icon Import ---
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../services/api';
import PageHeader from '../components/layout/PageHeader'; // --- NEW: Page Header Import ---

/**
 * Bookings Page (Trips): High-fidelity trip history.
 * Features modernized cards with better spacing and high-res thumbnails.
 */
const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await API.get('/bookings/mybookings');
        setBookings(response.data);
      } catch (err) {
        console.error('Error fetching bookings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading your trips...</div>;

  return (
    <div style={{ maxWidth: '2560px', width: '98%', margin: '3rem auto', padding: '0 2rem' }}>
      {/* --- NEW: Professional Page Header --- */}
      <PageHeader 
        title="Trips" 
        subtitle="Review your upcoming and past adventures." 
        icon={PlaneTakeoff}
      />

      {/* --- OLD CODE (Preserved) ---
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Trips</h1>
      */}
      
      {bookings.length === 0 ? (
        <div style={{ padding: '3rem', border: '1px solid #eee', borderRadius: '16px', textAlign: 'center', backgroundColor: '#fafafa' }}>
          <h2>No trips booked... yet!</h2>
          <p style={{ color: '#717171', marginBottom: '1.5rem' }}>Time to dust off your bags and start planning your next adventure.</p>
          <Link to="/" style={{ 
            display: 'inline-block', padding: '0.8rem 1.5rem', backgroundColor: '#222', borderRadius: '8px', textDecoration: 'none', color: '#fff', fontWeight: 'bold' 
          }}>
            Start searching
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {bookings.map((booking) => {
            const listing = booking.listingId;
            if (!listing) return null;

            return (
              <motion.div 
                key={booking._id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.005 }}
                style={bookingCardStyle}
              >
                {/* Modern Thumbnail with better sizing */}
                <Link to={`/listing/${listing._id}`}>
                  <img 
                    src={listing.images[0]} 
                    alt={listing.title} 
                    style={{ width: '220px', height: '160px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #eee' }} 
                  />
                </Link>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <Link to={`/listing/${listing._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.3rem', fontWeight: '700' }}>{listing.title}</h3>
                        </Link>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#717171', fontSize: '0.9rem' }}>
                          <MapPin size={16} /> {listing.location}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#222' }}>${booking.totalPrice}</span>
                        <div style={{ fontSize: '0.7rem', color: '#717171', fontWeight: '700', textTransform: 'uppercase' }}>Total Paid</div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '3rem', marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <div style={iconBoxStyle}><Calendar size={18} color="#ff385c" /></div>
                      <div>
                        <div style={labelStyle}>Reservation Dates</div>
                        <div style={valueStyle}>{new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <div style={iconBoxStyle}><CreditCard size={18} color="#ff385c" /></div>
                      <div>
                        <div style={labelStyle}>Booking Status</div>
                        <div style={{ ...valueStyle, textTransform: 'capitalize', color: '#1d7044' }}>{booking.status}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- STYLES ---
const bookingCardStyle = { display: 'flex', gap: '2rem', padding: '1.5rem', border: '1px solid #eee', borderRadius: '20px', backgroundColor: '#fff', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', transition: 'all 0.2s' };
const iconBoxStyle = { width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eee' };
const labelStyle = { fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', color: '#717171', marginBottom: '0.2rem' };
const valueStyle = { fontSize: '0.95rem', fontWeight: '600', color: '#222' };

export default Bookings;
