import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, MapPin, CheckCircle, ChevronLeft, ChevronRight, User, Trash2, X, Maximize, Camera, Utensils, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns'; 
import Calendar from 'react-calendar'; 
import 'react-calendar/dist/Calendar.css'; 
import toast from 'react-hot-toast';
import API from '../services/api'; 
import ChatWindow from '../components/chat/ChatWindow'; 

/**
 * ============================================================================
 * RATING BREAKDOWN COMPONENT
 * ============================================================================
 * Logic: Calculates the distribution of star ratings across the reviews array.
 */
const RatingBreakdown = ({ reviews = [] }) => {
  // --- STABILITY FIX: Defensive check for empty/undefined reviews ---
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  if (Array.isArray(reviews)) {
    reviews.forEach(r => { if (counts[r.rating] !== undefined) counts[r.rating]++; });
  }
  const total = reviews.length || 1;

  return (
    <div style={breakdownContainerStyle}>
      {[5, 4, 3, 2, 1].map(star => (
        <div key={star} style={breakdownRowStyle}>
          <span style={starLabelStyle}>{star} stars</span>
          <div style={barBgStyle}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${(counts[star] / total) * 100}%` }} transition={{ duration: 1 }} style={barFillStyle} />
          </div>
          <span style={percentLabelStyle}>{Math.round((counts[star] / total) * 100)}%</span>
        </div>
      ))}
    </div>
  );
};

/**
 * ============================================================================
 * LISTING DETAIL PAGE (The Masterclass View)
 * ============================================================================
 */
const ListingDetail = ({ userRole, user, onChatOpened }) => { 
  const { id } = useParams(); 
  const navigate = useNavigate(); 

  const [listing, setListing] = useState(null);       
  const [reviews, setReviews] = useState([]);         
  const [takenDates, setTakenDates] = useState([]);   
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);       
  
  const [guestCounts, setGuestCounts] = useState({ adults: 1, children: 0, infants: 0 });
  const [dateRange, setDateRange] = useState([null, null]); 
  const [pricing, setPricing] = useState({ nights: 0, subtotal: 0, serviceFee: 0, total: 0 });

  useEffect(() => {
    if (dateRange[0] && dateRange[1] && listing) {
      const diffTime = Math.abs(dateRange[1] - dateRange[0]);
      const diffNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffNights > 0) {
        const adultTotal = guestCounts.adults * listing.rate;
        const childTotal = guestCounts.children * Math.round(listing.rate * 0.7);
        const nightlyTotal = adultTotal + childTotal;
        const subtotal = diffNights * nightlyTotal;
        const serviceFee = Math.round(subtotal * 0.14);
        setPricing({ nights: diffNights, subtotal, serviceFee, total: subtotal + serviceFee });
      }
    }
  }, [dateRange, listing, guestCounts]);

  const fetchListingAndReviews = async () => {
    try {
      const [listingRes, reviewsRes, takenRes, chatRes] = await Promise.all([
        API.get(`/listings/${id}`), API.get(`/reviews/${id}`),
        API.get(`/bookings/listing/${id}/taken`), API.get(`/auth/chat-history/${id}`)
      ]);
      setListing(listingRes.data); 
      setReviews(reviewsRes.data || []); 
      setTakenDates(takenRes.data || []); 
      setChatHistory(chatRes.data || []);
    } catch (err) {
      console.error('Fetch Error:', err);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchListingAndReviews(); }, [id, user]);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading property details...</div>;
  if (!listing) return <div style={{ textAlign: 'center', padding: '4rem' }}>Listing not found.</div>;

  const isHost = user && (user.id === listing.adminId || user._id === listing.adminId);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ maxWidth: '100%', width: '100%', margin: '2rem auto', padding: '0 2rem' }}>
        <h1 style={{ marginBottom: '1.5rem', fontSize: '1.8rem' }}>{listing.title}</h1>
        
        <div style={{ display: 'flex', gap: '4rem', marginTop: '2.5rem' }}>
          <div style={{ flex: 2 }}>
            <img src={listing.images?.[0] || 'https://via.placeholder.com/800'} style={{ width: '100%', height: '520px', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
            
            <div style={{ marginTop: '2.5rem', borderTop: '1px solid #eee', paddingTop: '2.5rem' }}>
              <h3>What this place offers</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                {(listing.amenities || []).map((a, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#444' }}><CheckCircle size={20} color="#ff385c" /> {a}</div>))}
              </div>
            </div>

            {/* --- REVIEWS --- */}
            <div style={{ marginTop: '4rem', borderTop: '1px solid #eee', paddingTop: '3rem' }}>
              <div style={{ display: 'flex', gap: '4rem', alignItems: 'flex-start', marginBottom: '3rem' }}>
                <div>
                  <h2 style={{ fontSize: '2.2rem', margin: 0, fontWeight: '800' }}><Star size={28} fill="#000" /> {listing.rating || '4.5'}</h2>
                  <p style={{ color: '#717171', fontWeight: '600' }}>{listing.reviewsCount || 0} reviews</p>
                </div>
                <RatingBreakdown reviews={reviews} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                {reviews.map(r => (
                  <div key={r._id} style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.8rem' }}>
                      <div style={avatarCircleStyle}>{r.userId?.name?.charAt(0) || 'U'}</div>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{r.userId?.name || 'Traveler'}</div>
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>
                          {r.createdAt ? formatDistanceToNow(new Date(r.createdAt), { addSuffix: true }) : 'Recently'}
                        </div>
                      </div>
                    </div>
                    <p style={{ color: '#444', lineHeight: '1.6' }}>{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={sidebarCardStyle}>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '1.5rem' }}>${listing.rate} <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>night</span></div>
              <Calendar selectRange={true} onChange={setDateRange} value={dateRange} minDate={new Date()} />
              
              {pricing.nights > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '1.5rem' }}>
                   <div style={priceRow}><span>${listing.rate} x {pricing.nights} nights</span><span>${pricing.subtotal}</span></div>
                   <div style={priceRow}><span>Service fee</span><span>${pricing.serviceFee}</span></div>
                   <div style={{ ...priceRow, fontWeight: 'bold', borderTop: '1px solid #eee', paddingTop: '0.8rem', color: '#000', fontSize: '1.1rem' }}><span>Total</span><span>${pricing.total}</span></div>
                </motion.div>
              )}

              <button onClick={() => navigate('/pay', { state: { listingId: id, bookingDetails: { checkIn: dateRange[0], checkOut: dateRange[1], total: pricing.total, nights: pricing.nights, guests: guestCounts }, listing }})} style={reserveBtnStyle}>Reserve Now</button>
            </div>
          </div>
        </div>
      </div>
      <ChatWindow listingId={id} currentUser={user} isHost={isHost} history={chatHistory} onChatOpened={onChatOpened} />
    </div>
  );
};

// --- STYLES ---
const breakdownContainerStyle = { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' };
const breakdownRowStyle = { display: 'flex', alignItems: 'center', gap: '1rem' };
const starLabelStyle = { fontSize: '0.85rem', width: '65px', fontWeight: '600' };
const barBgStyle = { flex: 1, height: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' };
const barFillStyle = { height: '100%', backgroundColor: '#222', borderRadius: '4px' };
const percentLabelStyle = { fontSize: '0.85rem', width: '45px', textAlign: 'right', color: '#717171' };
const sidebarCardStyle = { border: '1px solid #ddd', borderRadius: '16px', padding: '1.8rem', position: 'sticky', top: '100px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', backgroundColor: '#fff' };
const reserveBtnStyle = { width: '100%', marginTop: '1.8rem', padding: '1rem', backgroundColor: '#ff385c', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '1rem', cursor: 'pointer' };
const avatarCircleStyle = { width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#222', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' };
const priceRow = { display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginBottom: '0.6rem', color: '#444' };

export default ListingDetail;
