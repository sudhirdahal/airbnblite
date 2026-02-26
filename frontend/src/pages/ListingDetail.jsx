import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, MapPin, CheckCircle, ChevronLeft, ChevronRight, User, Trash2, X, Maximize, Camera, Utensils, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Calendar from 'react-calendar'; 
import 'react-calendar/dist/Calendar.css'; 
import toast from 'react-hot-toast';
import API from '../services/api'; 
import ChatWindow from '../components/chat/ChatWindow'; 

// --- NEW: RATING BREAKDOWN COMPONENT ---
const RatingBreakdown = ({ reviews }) => {
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => { if (counts[r.rating] !== undefined) counts[r.rating]++; });
  const total = reviews.length || 1;

  return (
    <div style={breakdownContainerStyle}>
      {[5, 4, 3, 2, 1].map(star => (
        <div key={star} style={breakdownRowStyle}>
          <span style={starLabelStyle}>{star} stars</span>
          <div style={barBgStyle}>
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${(counts[star] / total) * 100}%` }} 
              transition={{ duration: 1, ease: "easeOut" }}
              style={barFillStyle} 
            />
          </div>
          <span style={percentLabelStyle}>{Math.round((counts[star] / total) * 100)}%</span>
        </div>
      ))}
    </div>
  );
};

const ListingDetail = ({ userRole, user, onChatOpened }) => { 
  const { id } = useParams(); 
  const navigate = useNavigate(); 

  const [listing, setListing] = useState(null);       
  const [reviews, setReviews] = useState([]);         
  const [takenDates, setTakenDates] = useState([]);   
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);       
  const [activeImage, setActiveImage] = useState(0);  
  const [showSticky, setShowSticky] = useState(false); 
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  const [guestCounts, setGuestCounts] = useState({ adults: 1, children: 0, infants: 0 });
  const [isGuestPickerOpen, setIsGuestPickerOpen] = useState(false);
  const [dateRange, setDateRange] = useState([null, null]); 
  const [pricing, setPricing] = useState({ nights: 0, subtotal: 0, serviceFee: 0, total: 0 });

  useEffect(() => {
    if (dateRange[0] && dateRange[1] && listing) {
      const diffTime = Math.abs(dateRange[1] - dateRange[0]);
      const diffNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffNights > 0) {
        const nightlyTotal = (guestCounts.adults * listing.rate) + (guestCounts.children * Math.round(listing.rate * 0.7));
        const subtotal = diffNights * nightlyTotal;
        setPricing({ nights: diffNights, subtotal, serviceFee: Math.round(subtotal * 0.14), total: subtotal + Math.round(subtotal * 0.14) });
      }
    }
  }, [dateRange, listing, guestCounts]);

  const fetchListingAndReviews = async () => {
    try {
      const [listingRes, reviewsRes, takenRes, chatRes] = await Promise.all([
        API.get(`/listings/${id}`), API.get(`/reviews/${id}`),
        API.get(`/bookings/listing/${id}/taken`), API.get(`/auth/chat-history/${id}`)
      ]);
      setListing(listingRes.data); setReviews(reviewsRes.data); setTakenDates(takenRes.data); setChatHistory(chatRes.data);
    } catch (err) {} finally { setLoading(false); }
  };

  useEffect(() => { fetchListingAndReviews(); }, [id, user]);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>;
  if (!listing) return null;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ maxWidth: '100%', width: '100%', margin: '2rem auto', padding: '0 2rem' }}>
        <h1>{listing.title}</h1>
        <div style={{ display: 'flex', gap: '4rem', marginTop: '2rem' }}>
          <div style={{ flex: 2 }}>
            <img src={listing.images[0]} style={{ width: '100%', height: '500px', objectFit: 'cover', borderRadius: '12px' }} />
            
            {/* AMENITIES SECTION */}
            <div style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '2rem' }}>
              <h3>What this place offers</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {listing.amenities.map((a, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><CheckCircle size={18} /> {a}</div>))}
              </div>
            </div>

            {/* --- REVIEWS WITH BREAKDOWN --- */}
            <div style={{ marginTop: '3rem', borderTop: '1px solid #eee', paddingTop: '2rem' }}>
              <div style={{ display: 'flex', gap: '4rem', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '2rem', margin: 0 }}><Star size={24} fill="#000" /> {listing.rating}</h2>
                  <p style={{ color: '#717171' }}>{listing.reviewsCount} reviews</p>
                </div>
                <RatingBreakdown reviews={reviews} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
                {reviews.map(r => (
                  <div key={r._id} style={{ padding: '1rem', border: '1px solid #eee', borderRadius: '12px' }}>
                    <div style={{ fontWeight: 'bold' }}>{r.userId.name}</div>
                    <Star size={12} fill="#000" /> {r.rating}
                    <p>{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar... */}
          <div style={{ flex: 1 }}>
            <div style={sidebarCardStyle}>
              <h3>${listing.rate} / night</h3>
              <Calendar selectRange={true} onChange={setDateRange} value={dateRange} minDate={new Date()} />
              <button onClick={() => navigate('/pay')} style={reserveBtnStyle}>Reserve</button>
            </div>
          </div>
        </div>
      </div>
      <ChatWindow listingId={id} currentUser={user} history={chatHistory} onChatOpened={onChatOpened} />
    </div>
  );
};

// --- STYLES ---
const breakdownContainerStyle = { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' };
const breakdownRowStyle = { display: 'flex', alignItems: 'center', gap: '1rem' };
const starLabelStyle = { fontSize: '0.85rem', width: '60px' };
const barBgStyle = { flex: 1, height: '8px', backgroundColor: '#eee', borderRadius: '4px', overflow: 'hidden' };
const barFillStyle = { height: '100%', backgroundColor: '#222', borderRadius: '4px' };
const percentLabelStyle = { fontSize: '0.85rem', width: '40px', textAlign: 'right' };
const sidebarCardStyle = { border: '1px solid #ddd', borderRadius: '12px', padding: '1.5rem', position: 'sticky', top: '100px' };
const reserveBtnStyle = { width: '100%', marginTop: '1.5rem', padding: '1rem', backgroundColor: '#ff385c', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' };

export default ListingDetail;
