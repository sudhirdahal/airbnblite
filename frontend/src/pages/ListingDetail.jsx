import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, MapPin, CheckCircle, ChevronLeft, ChevronRight, User, Trash2, X, Maximize,
  Wifi, Coffee, Tv, Wind, Utensils, Waves, Car, Shield, Dumbbell 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Calendar from 'react-calendar'; 
import 'react-calendar/dist/Calendar.css'; 
import toast from 'react-hot-toast';
import API from '../services/api'; 
import ChatWindow from '../components/chat/ChatWindow'; 

const getAmenityIcon = (name) => {
  const n = name.toLowerCase();
  if (n.includes('wifi')) return <Wifi size={20} />;
  if (n.includes('kitchen') || n.includes('cook')) return <Utensils size={20} />;
  if (n.includes('pool')) return <Waves size={20} />;
  if (n.includes('ac') || n.includes('air')) return <Wind size={20} />;
  if (n.includes('tv') || n.includes('screen')) return <Tv size={20} />;
  if (n.includes('breakfast')) return <Coffee size={20} />;
  if (n.includes('park') || n.includes('garage')) return <Car size={20} />;
  if (n.includes('gym') || n.includes('fit')) return <Dumbbell size={20} />;
  if (n.includes('security') || n.includes('safe')) return <Shield size={20} />;
  return <CheckCircle size={20} />;
};

const ListingDetail = ({ userRole, user }) => { 
  const { id } = useParams(); 
  const navigate = useNavigate(); 

  const [listing, setListing] = useState(null);       
  const [reviews, setReviews] = useState([]);         
  const [takenDates, setTakenDates] = useState([]);   
  const [loading, setLoading] = useState(true);       
  const [activeImage, setActiveImage] = useState(0);  
  const [showSticky, setShowSticky] = useState(false); 
  const [isLightboxOpen, setIsLightboxOpen] = useState(false); // --- NEW: Lightbox state ---
  
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

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete your review?")) return;
    try {
      await API.delete(`/reviews/${reviewId}`);
      toast.success("Review deleted");
      fetchListingAndReviews(); // Refresh stats and list
    } catch (err) {
      toast.error("Failed to delete review");
    }
  };

  const isDateTaken = ({ date, view }) => {
    if (view !== 'month') return false;
    const today = new Date(); today.setHours(0,0,0,0);
    if (date < today) return true;
    return takenDates.some(booking => {
      const start = new Date(booking.checkIn);
      const end = new Date(booking.checkOut);
      return date >= start && date < end; 
    });
  };

  const handleReserve = async () => {
    if (!dateRange[0] || !dateRange[1]) return toast.error("Please select your dates on the calendar.");
    navigate('/pay', { state: { 
      listingId: id, 
      bookingDetails: { checkIn: dateRange[0].toISOString(), checkOut: dateRange[1].toISOString(), total: pricing.total, nights: pricing.nights },
      listing
    }});
  };

  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleRatingSubmit = async (rating) => {
    if (!user) return toast.error("Please log in to rate");
    setUserRating(rating);
    try { await API.post('/reviews', { listingId: id, rating }); fetchListingAndReviews(); toast.success(`Rated ${rating} stars!`); } catch (err) {}
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await API.post('/reviews', { listingId: id, comment: userComment });
      setUserComment('');
      fetchListingAndReviews();
      toast.success('Review posted!');
    } catch (err) {}
    finally { setSubmittingReview(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading details...</div>;
  if (!listing) return <div style={{ textAlign: 'center', padding: '4rem' }}>Listing not found.</div>;

  const isHost = user && (user.id === listing.adminId || user._id === listing.adminId);
  const nextImage = () => setActiveImage((prev) => (prev + 1) % listing.images.length);
  const prevImage = () => setActiveImage((prev) => (prev - 1 + listing.images.length) % listing.images.length);

  return (
    <div style={{ position: 'relative' }}>
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={lightboxOverlayStyle}>
            <button onClick={() => setIsLightboxOpen(false)} style={closeLightboxBtnStyle}><X size={32} /></button>
            <button onClick={prevImage} style={lightboxNavBtnStyle('left')}><ChevronLeft size={48} /></button>
            <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} src={listing.images[activeImage]} style={lightboxImgStyle} />
            <button onClick={nextImage} style={lightboxNavBtnStyle('right')}><ChevronRight size={48} /></button>
            <div style={lightboxCounterStyle}>{activeImage + 1} / {listing.images.length}</div>
          </motion.div>
        )}
      </AnimatePresence>

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
          <img src={listing.images[activeImage]} alt={listing.title} onClick={() => setIsLightboxOpen(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} />
          <button onClick={() => setIsLightboxOpen(true)} style={maximizeBtnStyle}><Maximize size={18} /> Show all photos</button>
          {listing.images.length > 1 && (
            <><button onClick={prevImage} style={galleryBtnStyle('left')}><ChevronLeft size={30} /></button><button onClick={nextImage} style={galleryBtnStyle('right')}><ChevronRight size={30} /></button></>
          )}
        </div>

        <div style={{ display: 'flex', gap: '4rem', marginTop: '2rem' }}>
          <div style={{ flex: 2 }}>
            <div style={{ borderBottom: '1px solid #ddd', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
              <Link to="/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
                <motion.div whileHover={{ backgroundColor: '#f9f9f9' }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '12px', cursor: 'pointer' }}>
                  <div><h2 style={{ margin: 0 }}>Entire home hosted by {listing.host.name}</h2><p style={{ margin: '0.5rem 0 0', color: '#717171' }}>{listing.maxGuests} guests · {listing.bedrooms} bedroom · {listing.beds} bed</p></div>
                  <img src={listing.host.avatar} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} alt={listing.host.name} />
                </motion.div>
              </Link>
            </div>
            
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

            <div style={{ borderBottom: '1px solid #ddd', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
              <h3>What this place offers</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginTop: '1rem' }}>
                {listing.amenities.map((a, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#222', fontSize: '1.05rem' }}><div style={{ color: '#717171' }}>{getAmenityIcon(a)}</div>{a}</div>))}
              </div>
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
                {reviews.map(r => (
                  <div key={r._id} style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                      <div style={{ background: '#eee', borderRadius: '50%', padding: '0.5rem' }}><User size={20} /></div>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{r.userId.name}</div>
                        <div style={{ color: '#717171', fontSize: '0.8rem' }}><Star size={12} fill="#000" /> {r.rating}</div>
                      </div>
                      {/* --- NEW: Delete Review Button --- */}
                      {(user?._id === r.userId._id || user?.id === r.userId._id) && (
                        <button onClick={() => handleDeleteReview(r._id)} style={deleteReviewBtnStyle} title="Delete your review"><Trash2 size={16} /></button>
                      )}
                    </div>
                    <p style={{ fontSize: '0.9rem' }}>{r.comment || <em>Rated only</em>}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 6px 16px rgba(0,0,0,0.12)', position: 'sticky', top: '100px' }}>
              <div style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>${listing.rate} / night</div>
              <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem', color: '#717171' }}>Reservation Details</div>
                <div style={{ fontSize: '1rem', fontWeight: '500' }}>{dateRange[0] ? dateRange[0].toLocaleDateString() : 'Select dates'} - {dateRange[1] ? dateRange[1].toLocaleDateString() : ''}</div>
              </div>
              {pricing.nights > 0 && (<div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span>${listing.rate} x {pricing.nights} nights</span><span>${pricing.subtotal}</span></div><div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #eee', paddingTop: '0.5rem', fontSize: '1.1rem' }}><span>Total</span><span>${pricing.total}</span></div></div>)}
              {userRole === 'registered' ? <button onClick={handleReserve} style={bookingBtnStyle}>Reserve</button> : <Link to="/login" style={{ textDecoration: 'none' }}><button style={bookingBtnStyle}>Login to Reserve</button></Link>}
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
const maximizeBtnStyle = { position: 'absolute', bottom: '1.5rem', right: '1.5rem', padding: '0.6rem 1rem', backgroundColor: '#fff', border: '1px solid #222', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' };
const lightboxOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 5000, display: 'flex', justifyContent: 'center', alignItems: 'center' };
const lightboxImgStyle = { maxWidth: '90%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px' };
const closeLightboxBtnStyle = { position: 'absolute', top: '2rem', left: '2rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' };
const lightboxNavBtnStyle = (side) => ({ position: 'absolute', top: '50%', [side]: '2rem', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' });
const lightboxCounterStyle = { position: 'absolute', bottom: '2rem', color: '#fff', fontSize: '1rem' };
const deleteReviewBtnStyle = { background: 'none', border: 'none', color: '#717171', cursor: 'pointer', padding: '4px', marginLeft: 'auto', borderRadius: '4px', transition: 'all 0.2s' };

export default ListingDetail;
