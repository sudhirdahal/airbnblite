import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, MapPin, CheckCircle, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { motion } from 'framer-motion'; // --- NEW: Animation Import ---
import Calendar from 'react-calendar'; 
import 'react-calendar/dist/Calendar.css'; 
import toast from 'react-hot-toast';
import API from '../services/api'; 
import ChatWindow from '../components/chat/ChatWindow'; 

const calendarStyles = `
  .react-calendar { width: 100% !important; border: none !important; font-family: inherit !important; padding: 10px; }
  .react-calendar__tile--active { background: #ff385c !important; color: white !important; border-radius: 50%; }
  .react-calendar__tile--range { background: #f7f7f7 !important; color: #ff385c !important; border-radius: 0 !important; }
  .react-calendar__tile--rangeStart { border-top-left-radius: 50% !important; border-bottom-left-radius: 50% !important; background: #ff385c !important; color: white !important; }
  .react-calendar__tile--rangeEnd { border-top-right-radius: 50% !important; border-bottom-right-radius: 50% !important; background: #ff385c !important; color: white !important; }
  .react-calendar__tile:disabled { background-color: #fff !important; color: #ccc !important; text-decoration: line-through !important; cursor: not-allowed !important; }
  .react-calendar__tile { height: 60px; font-weight: 600; font-size: 1.1rem; transition: background 0.2s; }
  .react-calendar__navigation button { font-size: 1.2rem; font-weight: bold; }
`;

const ListingDetail = ({ userRole, user }) => { 
  const { id } = useParams(); 
  const navigate = useNavigate(); 

  const [listing, setListing] = useState(null);       
  const [reviews, setReviews] = useState([]);         
  const [takenDates, setTakenDates] = useState([]);   
  const [loading, setLoading] = useState(true);       
  const [activeImage, setActiveImage] = useState(0);  
  const [showSticky, setShowSticky] = useState(false); 
  
  const placeholderImage = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80";

  const [dateRange, setDateRange] = useState([null, null]); 
  const [pricing, setPricing] = useState({ nights: 0, subtotal: 0, serviceFee: 0, total: 0 });

  useEffect(() => {
    if (dateRange[0] && dateRange[1] && listing) {
      const diffTime = Math.abs(dateRange[1] - dateRange[0]);
      const diffNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffNights > 0) {
        const subtotal = diffNights * listing.rate;
        const serviceFee = Math.round(subtotal * 0.14);
        setPricing({ nights: diffNights, subtotal, serviceFee, total: subtotal + serviceFee });
      }
    } else {
      setPricing({ nights: 0, subtotal: 0, serviceFee: 0, total: 0 });
    }
  }, [dateRange, listing]);

  const fetchListingAndReviews = async () => {
    try {
      const [listingRes, reviewsRes, takenRes] = await Promise.all([
        API.get(`/listings/${id}`),
        API.get(`/reviews/${id}`),
        API.get(`/bookings/listing/${id}/taken`)
      ]);
      setListing(listingRes.data);
      setReviews(reviewsRes.data);
      setTakenDates(takenRes.data);
      
      if (user) {
        const existing = reviewsRes.data.find(r => r.userId._id === user._id || r.userId === user._id);
        if (existing) setUserRating(existing.rating);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListingAndReviews();
    const handleScroll = () => { if (window.scrollY > 600) setShowSticky(true); else setShowSticky(false); };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [id, user]);

  const isDateTaken = ({ date, view }) => {
    if (view !== 'month') return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    if (date < today) return true;
    return takenDates.some(booking => {
      const start = new Date(booking.checkIn);
      const end = new Date(booking.checkOut);
      return date >= start && date < end; 
    });
  };

  const handleReserve = async () => {
    if (!dateRange[0] || !dateRange[1]) {
      toast.error("Please select your dates on the calendar.");
      return;
    }
    navigate('/pay', { state: { 
      listingId: id, 
      bookingDetails: {
        checkIn: dateRange[0].toISOString(),
        checkOut: dateRange[1].toISOString(),
        total: pricing.total,
        nights: pricing.nights
      },
      listing
    }});
  };

  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleRatingSubmit = async (rating) => {
    if (!user) {
      toast.error("Please log in to rate");
      return;
    }
    setUserRating(rating);
    try { 
      await API.post('/reviews', { listingId: id, rating }); 
      fetchListingAndReviews(); 
      toast.success(`You rated this ${rating} stars!`);
    } catch (err) {
      toast.error("Failed to save rating");
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await API.post('/reviews', { listingId: id, comment: userComment });
      setUserComment('');
      fetchListingAndReviews();
      toast.success('Review posted successfully!');
    } catch (err) {
      toast.error("Failed to post review");
    }
    finally { setSubmittingReview(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading details...</div>;
  if (!listing) return <div style={{ textAlign: 'center', padding: '4rem' }}>Listing not found.</div>;

  const isHost = user && (user.id === listing.adminId || user._id === listing.adminId);
  const nextImage = () => setActiveImage((prev) => (prev + 1) % listing.images.length);
  const prevImage = () => setActiveImage((prev) => (prev - 1 + listing.images.length) % listing.images.length);

  return (
    <div style={{ position: 'relative' }}>
      <style>{calendarStyles}</style>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, backgroundColor: 'white', borderBottom: '1px solid #ddd', padding: '1rem 0', zIndex: 1000,
        transform: showSticky ? 'translateY(0)' : 'translateY(-100%)', transition: 'transform 0.3s ease-in-out', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '100%', width: '100%', padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><div style={{ fontWeight: 'bold' }}>${listing.rate} night</div><div style={{ fontSize: '0.8rem' }}><Star size={12} fill="#000" /> {listing.rating} · {listing.reviewsCount} reviews</div></div>
          {userRole === 'registered' ? <button onClick={handleReserve} style={bookingBtnStyle}>Reserve</button> : <Link to="/login" style={{ textDecoration: 'none' }}><button style={bookingBtnStyle}>Login to Reserve</button></Link>}
        </div>
      </div>

      <div style={{ maxWidth: '100%', width: '100%', margin: '2rem auto', padding: '0 2rem' }}>
        <h1>{listing.title}</h1>
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          <div style={{ fontWeight: 'bold' }}><Star size={16} fill="#ff385c" color="#ff385c" /> {listing.rating}</div>
          <span style={{ textDecoration: 'underline' }}>{listing.reviewsCount} reviews</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><MapPin size={16} /> {listing.location}</div>
        </div>

        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', maxHeight: '700px', borderRadius: '12px', overflow: 'hidden', marginBottom: '2rem', backgroundColor: '#f0f0f0' }}>
          <img src={listing.images[activeImage]} alt={listing.title} onError={(e) => e.target.src = placeholderImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {listing.images.length > 1 && (
            <><button onClick={prevImage} style={galleryBtnStyle('left')}><ChevronLeft size={30} /></button><button onClick={nextImage} style={galleryBtnStyle('right')}><ChevronRight size={30} /></button></>
          )}
        </div>

        <div style={{ display: 'flex', gap: '4rem', marginTop: '2rem' }}>
          <div style={{ flex: 2 }}>
            {/* NEW: Interactive Host Section */}
            <div style={{ borderBottom: '1px solid #ddd', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
              <Link to="/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
                <motion.div 
                  whileHover={{ backgroundColor: '#f9f9f9' }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '12px', cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.2s' }}
                >
                  <div>
                    <h2 style={{ margin: 0 }}>Entire home hosted by {listing.host.name}</h2>
                    <p style={{ margin: '0.5rem 0 0', color: '#717171' }}>
                      {listing.maxGuests} guests · {listing.bedrooms} bedroom · {listing.beds} bed
                    </p>
                  </div>
                  <img src={listing.host.avatar} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} alt={listing.host.name} />
                </motion.div>
              </Link>
            </div>

            {/* --- OLD CODE (Non-interactive host section) ---
            <div style={{ borderBottom: '1px solid #ddd', paddingBottom: '1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <div><h2>Entire home hosted by {listing.host.name}</h2><p>2 guests · 1 bedroom · 1 bed · 1 bath</p></div>
              <img src={listing.host.avatar} style={{ width: '56px', height: '56px', borderRadius: '50%' }} alt={listing.host.name} />
            </div>
            */}
            
            <div style={{ borderBottom: '1px solid #ddd', paddingBottom: '2.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Availability</h3>
              <div style={{ padding: '1.5rem', border: '1px solid #ddd', borderRadius: '16px', boxShadow: '0 6px 20px rgba(0,0,0,0.05)', backgroundColor: 'white' }}>
                <Calendar selectRange={true} onChange={setDateRange} value={dateRange} tileDisabled={isDateTaken} minDate={new Date()} />
              </div>
            </div>

            <div style={{ borderBottom: '1px solid #ddd', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
              <h3>About this space</h3>
              <p style={{ lineHeight: '1.6' }}>{listing.fullDescription}</p>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <h3><Star size={20} fill="#ff385c" color="#ff385c" /> {listing.rating} · {listing.reviewsCount} reviews</h3>
              {userRole === 'registered' && (
                <div style={{ margin: '1.5rem 0', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '12px', backgroundColor: '#f9f9f9' }}>
                  <h4>How was your stay?</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {[1, 2, 3, 4, 5].map((star) => (<Star key={star} size={32} fill={star <= userRating ? "#ff385c" : "none"} color={star <= userRating ? "#ff385c" : "#717171"} style={{ cursor: 'pointer' }} onClick={() => handleRatingSubmit(star)} />))}
                  </div>
                  <form onSubmit={handleCommentSubmit}>
                    <textarea placeholder="Optional: Tell us more..." value={userComment} onChange={(e) => setUserComment(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', height: '80px', marginBottom: '1rem' }} />
                    <button type="submit" disabled={submittingReview} style={{ ...bookingBtnStyle, width: 'auto', padding: '0.6rem 1.5rem', backgroundColor: '#222' }}>{submittingReview ? 'Saving...' : 'Post Written Review'}</button>
                  </form>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
                {reviews.map(r => (<div key={r._id}><div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}><div style={{ background: '#eee', borderRadius: '50%', padding: '0.5rem' }}><User size={20} /></div><div><div style={{ fontWeight: 'bold' }}>{r.userId.name}</div><div style={{ color: '#717171', fontSize: '0.8rem' }}><Star size={12} fill="#000" /> {r.rating}</div></div></div><p style={{ fontSize: '0.9rem' }}>{r.comment || <em>Rated only</em>}</p></div>))}
              </div>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 6px 16px rgba(0,0,0,0.12)', position: 'sticky', top: '100px' }}>
              <div style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>${listing.rate} / night</div>
              <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem', color: '#717171' }}>Reservation Details</div>
                <div style={{ fontSize: '1rem', fontWeight: '500' }}>
                  {dateRange[0] ? dateRange[0].toLocaleDateString() : 'Select dates'} - {dateRange[1] ? dateRange[1].toLocaleDateString() : ''}
                </div>
              </div>
              {pricing.nights > 0 && (
                <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>${listing.rate} x {pricing.nights} nights</span>
                    <span>${pricing.subtotal}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #eee', paddingTop: '0.5rem', fontSize: '1.1rem' }}>
                    <span>Total</span>
                    <span>${pricing.total}</span>
                  </div>
                </div>
              )}
              {userRole === 'registered' ? <button onClick={handleReserve} style={bookingBtnStyle}>Reserve</button> : <Link to="/login" style={{ textDecoration: 'none' }}><button style={bookingBtnStyle}>Login to Reserve</button></Link>}
              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#717171', marginTop: '1rem' }}>You won't be charged yet</p>
            </div>
          </div>
        </div>
      </div>
      <ChatWindow listingId={id} currentUser={user} isHost={isHost} />
    </div>
  );
};

const galleryBtnStyle = (side) => ({ position: 'absolute', top: '50%', [side]: '1rem', transform: 'translateY(-50%)', backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid #ddd', borderRadius: '50%', padding: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 });
const bookingBtnStyle = { width: '100%', padding: '1rem', backgroundColor: '#ff385c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };

export default ListingDetail;
