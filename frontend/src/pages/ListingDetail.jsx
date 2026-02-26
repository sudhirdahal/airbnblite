import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, MapPin, CheckCircle, ChevronLeft, ChevronRight, User, Trash2, X, Maximize, Camera, Upload,
  Wifi, Coffee, Tv, Wind, Utensils, Waves, Car, Shield, Dumbbell 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Calendar from 'react-calendar'; 
import 'react-calendar/dist/Calendar.css'; 
import toast from 'react-hot-toast';
import API from '../services/api'; 
import ChatWindow from '../components/chat/ChatWindow'; 

/**
 * ============================================================================
 * SMART AMENITY ICON MAPPER
 * ============================================================================
 * Early versions of the app just displayed standard checkmarks for every amenity.
 * To increase visual fidelity, we implemented this keyword-matching engine. 
 * It scans the text string from the database (e.g., "High-speed WiFi") and 
 * dynamically assigns a professional Lucide SVG icon.
 */
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

/**
 * CUSTOM CALENDAR OVERRIDES
 * We inject CSS directly to override the default 'react-calendar' styles, 
 * giving it the "AirBnB Pink" branding and larger, touch-friendly tiles.
 */
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

  // --- CORE DATA STATES ---
  const [listing, setListing] = useState(null);       
  const [reviews, setReviews] = useState([]);         
  const [takenDates, setTakenDates] = useState([]);   
  const [loading, setLoading] = useState(true);       
  
  // --- UI STATES ---
  const [activeImage, setActiveImage] = useState(0);  
  const [showSticky, setShowSticky] = useState(false); 
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  const placeholderImage = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80";

  // --- REVIEW FORM STATES ---
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [reviewImages, setReviewImages] = useState([]); // S3 photo URLs attached to a review
  const [isUploading, setIsUploading] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  // --- BOOKING ENGINE STATES ---
  const [dateRange, setDateRange] = useState([null, null]); 
  const [pricing, setPricing] = useState({ nights: 0, subtotal: 0, serviceFee: 0, total: 0 });

  /**
   * ============================================================================
   * REAL-TIME PRICING ENGINE
   * ============================================================================
   * This effect runs every time the user clicks the calendar. It calculates
   * the exact number of nights by finding the millisecond difference between
   * the Check-In and Check-Out dates, then updates the UI immediately.
   */
  useEffect(() => {
    if (dateRange[0] && dateRange[1] && listing) {
      const diffTime = Math.abs(dateRange[1] - dateRange[0]);
      const diffNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffNights > 0) {
        const subtotal = diffNights * listing.rate;
        const serviceFee = Math.round(subtotal * 0.14); // 14% Service Fee
        setPricing({ nights: diffNights, subtotal, serviceFee, total: subtotal + serviceFee });
      }
    } else {
      setPricing({ nights: 0, subtotal: 0, serviceFee: 0, total: 0 });
    }
  }, [dateRange, listing]);

  /**
   * DATA FETCHING PIPELINE
   * Resolves three critical API calls simultaneously to minimize loading time.
   */
  const fetchListingAndReviews = async () => {
    try {
      const [listingRes, reviewsRes, takenRes] = await Promise.all([
        API.get(`/listings/${id}`),
        API.get(`/reviews/${id}`),
        API.get(`/bookings/listing/${id}/taken`) // Fetches blocked dates for the calendar
      ]);
      
      setListing(listingRes.data);
      setReviews(reviewsRes.data);
      setTakenDates(takenRes.data);
      
      // Auto-populate the user's existing rating if they've reviewed this property before
      if (user) {
        const existing = reviewsRes.data.find(r => r.userId._id === user._id || r.userId === user._id);
        if (existing) {
          setUserRating(existing.rating);
          // NOTE: We intentionally DO NOT auto-populate `userComment` here.
          // Early versions of the app did, which caused the text area to "stick" 
          // after a user hit publish, confusing them.
        }
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchListingAndReviews();
    const handleScroll = () => { if (window.scrollY > 600) setShowSticky(true); else setShowSticky(false); };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [id, user]);

  /**
   * VISUAL REVIEW: PHOTO UPLOAD
   * Streams a file to S3 and returns a permanent cloud URL to attach to the review.
   */
  const handleReviewPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const data = new FormData();
    data.append('image', file);
    
    setIsUploading(true);
    const uploadToast = toast.loading('Uploading photo...');
    try {
      const response = await API.post('/reviews/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setReviewImages(prev => [...prev, response.data.imageUrl]);
      toast.success('Photo added!', { id: uploadToast });
    } catch (err) { toast.error('Upload failed', { id: uploadToast }); } finally { setIsUploading(false); }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Delete your review?")) return;
    try {
      await API.delete(`/reviews/${reviewId}`);
      toast.success("Review deleted");
      fetchListingAndReviews(); // Re-fetch recalculates the average rating immediately
    } catch (err) { toast.error("Failed"); }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await API.post('/reviews', { listingId: id, comment: userComment, images: reviewImages });
      // Reset form on success for visual confirmation
      setUserComment('');
      setReviewImages([]);
      fetchListingAndReviews();
      toast.success('Review published!');
    } catch (err) {}
    finally { setSubmittingReview(false); }
  };

  /**
   * ============================================================================
   * PROACTIVE CALENDAR BLOCKING
   * ============================================================================
   * This function runs for every single tile in the `react-calendar`.
   * It checks if the current 'date' tile falls inside any of the 'takenDates'
   * fetched from the database. If it returns `true`, the UI grays out the tile.
   */
  const isDateTaken = ({ date, view }) => {
    if (view !== 'month') return false;
    
    // 1. Block the past
    const today = new Date(); today.setHours(0,0,0,0);
    if (date < today) return true;
    
    // 2. Block reserved ranges
    // 'date < end' is used instead of '<=' to allow a new guest to check in 
    // on the exact same morning the previous guest checks out.
    return takenDates.some(booking => {
      const start = new Date(booking.checkIn);
      const end = new Date(booking.checkOut);
      return date >= start && date < end; 
    });
  };

  const handleReserve = async () => {
    if (!dateRange[0] || !dateRange[1]) return toast.error("Please select your dates on the calendar.");
    
    // Pass booking data to the mock payment gateway via Router State
    navigate('/pay', { state: { 
      listingId: id, 
      bookingDetails: { checkIn: dateRange[0].toISOString(), checkOut: dateRange[1].toISOString(), total: pricing.total, nights: pricing.nights },
      listing
    }});
  };

  const handleRatingSubmit = async (rating) => {
    if (!user) return toast.error("Please log in to rate");
    setUserRating(rating);
    try { await API.post('/reviews', { listingId: id, rating }); fetchListingAndReviews(); toast.success(`Rated ${rating} stars!`); } catch (err) {}
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading details...</div>;
  if (!listing) return <div style={{ textAlign: 'center', padding: '4rem' }}>Listing not found.</div>;

  const isHost = user && (user.id === listing.adminId || user._id === listing.adminId);
  const nextImage = () => setActiveImage((prev) => (prev + 1) % listing.images.length);
  const prevImage = () => setActiveImage((prev) => (prev - 1 + listing.images.length) % listing.images.length);

  return (
    <div style={{ position: 'relative' }}>
      
      {/* ========================================================================
          CINEMATIC LIGHTBOX
          ========================================================================
          Replaced a static image grid with this framer-motion powered modal.
          It covers the entire screen (z-index: 5000) for an immersive gallery. 
      */}
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

      <style>{calendarStyles}</style>

      {/* Sticky Header (Appears on scroll) */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, backgroundColor: 'white', borderBottom: '1px solid #ddd', padding: '1rem 0', zIndex: 1000,
        transform: showSticky ? 'translateY(0)' : 'translateY(-100%)', transition: 'transform 0.3s ease-in-out', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '100%', width: '100%', padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><div style={{ fontWeight: 'bold' }}>${listing.rate} night</div><div style={{ fontSize: '0.8rem' }}><Star size={12} fill="#000" /> {listing.rating} · {listing.reviewsCount} reviews</div></div>
          {userRole === 'registered' ? <button onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })} style={bookingBtnStyle}>Reserve</button> : <Link to="/login" style={{ textDecoration: 'none' }}><button style={bookingBtnStyle}>Login to Reserve</button></Link>}
        </div>
      </div>

      <div style={{ maxWidth: '100%', width: '100%', margin: '2rem auto', padding: '0 2rem' }}>
        
        {/* Basic Info */}
        <h1>{listing.title}</h1>
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          <div style={{ fontWeight: 'bold' }}><Star size={16} fill="#ff385c" color="#ff385c" /> {listing.rating}</div>
          <span style={{ textDecoration: 'underline' }}>{listing.reviewsCount} reviews</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><MapPin size={16} /> {listing.location}</div>
        </div>

        {/* Primary Hero Image */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', maxHeight: '700px', borderRadius: '12px', overflow: 'hidden', marginBottom: '2rem', backgroundColor: '#f0f0f0' }}>
          <img src={listing.images[activeImage]} alt={listing.title} onClick={() => setIsLightboxOpen(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} />
          <button onClick={() => setIsLightboxOpen(true)} style={maximizeBtnStyle}><Maximize size={18} /> Show all photos</button>
          {listing.images.length > 1 && (
            <><button onClick={prevImage} style={galleryBtnStyle('left')}><ChevronLeft size={30} /></button><button onClick={nextImage} style={galleryBtnStyle('right')}><ChevronRight size={30} /></button></>
          )}
        </div>

        <div style={{ display: 'flex', gap: '4rem', marginTop: '2rem' }}>
          
          <div style={{ flex: 2 }}>
            {/* Interactive Host Info */}
            <div style={{ borderBottom: '1px solid #ddd', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
              <Link to="/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
                <motion.div whileHover={{ backgroundColor: '#f9f9f9' }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '12px', cursor: 'pointer' }}>
                  <div><h2 style={{ margin: 0 }}>Entire home hosted by {listing.host.name}</h2><p style={{ margin: '0.5rem 0 0', color: '#717171' }}>{listing.maxGuests} guests · {listing.bedrooms} bedroom · {listing.beds} bed</p></div>
                  <img src={listing.host.avatar} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} alt={listing.host.name} />
                </motion.div>
              </Link>
            </div>
            
            {/* Calendar Widget */}
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

            {/* Visual Reviews System */}
            <div style={{ marginTop: '2rem' }}>
              <h3><Star size={20} fill="#ff385c" color="#ff385c" /> {listing.rating} · {listing.reviewsCount} reviews</h3>
              
              {/* Form to leave a review */}
              {userRole === 'registered' && (
                <div style={{ margin: '1.5rem 0', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '12px', backgroundColor: '#f9f9f9' }}>
                  <h4>How was your stay?</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {[1, 2, 3, 4, 5].map((star) => (<Star key={star} size={32} fill={star <= userRating ? "#ff385c" : "none"} color={star <= userRating ? "#ff385c" : "#717171"} style={{ cursor: 'pointer' }} onClick={() => handleRatingSubmit(star)} />))}
                  </div>
                  <form onSubmit={handleCommentSubmit}>
                    <div style={{ position: 'relative' }}>
                      <textarea placeholder="Tell us about your stay..." value={userComment} onChange={(e) => setUserComment(e.target.value)} style={{ width: '100%', padding: '1rem', paddingRight: '3rem', borderRadius: '12px', border: '1px solid #ddd', minHeight: '100px', marginBottom: '1rem' }} />
                      
                      {/* S3 Photo Uploader for Reviews */}
                      <label style={cameraReviewBtnStyle}><Camera size={20} /><input type="file" onChange={handleReviewPhotoUpload} style={{ display: 'none' }} accept="image/*" /></label>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                      {reviewImages.map((url, i) => (
                        <div key={i} style={{ position: 'relative' }}>
                          <img src={url} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} alt="preview" />
                          <button type="button" onClick={() => setReviewImages(prev => prev.filter((_, idx) => idx !== i))} style={removeImgBadgeStyle}>X</button>
                        </div>
                      ))}
                    </div>
                    <button type="submit" disabled={submittingReview} style={{ ...bookingBtnStyle, width: 'auto', padding: '0.6rem 1.5rem', backgroundColor: '#222' }}>{submittingReview ? 'Publishing...' : 'Post Visual Review'}</button>
                  </form>
                </div>
              )}

              {/* Rendering existing reviews */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
                {reviews.map(r => (
                  <div key={r._id} style={{ padding: '1.5rem', border: '1px solid #eee', borderRadius: '16px', backgroundColor: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                      <div style={avatarSmallStyle}>{r.userId.avatar ? <img src={r.userId.avatar} style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : <User size={20} />}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold' }}>{r.userId.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}><Star size={12} fill="#000" /> {r.rating} · {new Date(r.createdAt).toLocaleDateString()}</div>
                      </div>
                      {(user?._id === r.userId._id || user?.id === r.userId._id) && (
                        <button onClick={() => handleDeleteReview(r._id)} style={deleteReviewBtnStyle}><Trash2 size={16} /></button>
                      )}
                    </div>
                    <p style={{ fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 1rem 0' }}>{r.comment || <em>Rated only</em>}</p>
                    {r.images?.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {r.images.map((img, i) => (
                          <img key={i} src={img} style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', cursor: 'zoom-in' }} onClick={() => { setActiveImage(listing.images.indexOf(img) === -1 ? 0 : listing.images.indexOf(img)); setIsLightboxOpen(true); }} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ========================================================================
              SIDEBAR BOOKING WIDGET
              ======================================================================== */}
          <div style={{ flex: 1 }}>
            <div style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 6px 16px rgba(0,0,0,0.12)', position: 'sticky', top: '100px' }}>
              <div style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>${listing.rate} / night</div>
              
              {/* --- HISTORICAL CODE: STAGE 1 & 2 HTML DATE INPUTS ---
                  Before we implemented the interactive react-calendar, users had to 
                  manually type or pick dates using basic HTML5 inputs. This led to a bad UX 
                  where they could select taken dates and only find out it failed upon submission.
                  
                  <div style={{ border: '1px solid #ddd', borderRadius: '8px', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid #ddd' }}>
                      <div style={{ flex: 1, padding: '0.6rem', borderRight: '1px solid #ddd' }}>
                        <label style={{ fontSize: '0.6rem', fontWeight: 'bold' }}>Check-in</label>
                        <input type="date" onChange={(e) => setCheckIn(e.target.value)} />
                      </div>
                      <div style={{ flex: 1, padding: '0.6rem' }}>
                        <label style={{ fontSize: '0.6rem', fontWeight: 'bold' }}>Checkout</label>
                        <input type="date" onChange={(e) => setCheckOut(e.target.value)} />
                      </div>
                    </div>
                  </div>
              */}

              {/* CURRENT STAGE 3: Calendar Range Display */}
              <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem', color: '#717171' }}>Reservation Details</div>
                <div style={{ fontSize: '1rem', fontWeight: '500' }}>{dateRange[0] ? dateRange[0].toLocaleDateString() : 'Select dates on calendar'} - {dateRange[1] ? dateRange[1].toLocaleDateString() : ''}</div>
              </div>

              {/* Dynamic Price Breakdown */}
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

// --- STYLES ---
const galleryBtnStyle = (side) => ({ position: 'absolute', top: '50%', [side]: '1rem', transform: 'translateY(-50%)', backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid #ddd', borderRadius: '50%', padding: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 });
const bookingBtnStyle = { width: '100%', padding: '1rem', backgroundColor: '#ff385c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const maximizeBtnStyle = { position: 'absolute', bottom: '1.5rem', right: '1.5rem', padding: '0.6rem 1rem', backgroundColor: '#fff', border: '1px solid #222', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' };
const lightboxOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 5000, display: 'flex', justifyContent: 'center', alignItems: 'center' };
const lightboxImgStyle = { maxWidth: '90%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px' };
const closeLightboxBtnStyle = { position: 'absolute', top: '2rem', left: '2rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' };
const lightboxNavBtnStyle = (side) => ({ position: 'absolute', top: '50%', [side]: '2rem', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' });
const lightboxCounterStyle = { position: 'absolute', bottom: '2rem', color: '#fff', fontSize: '1rem' };
const deleteReviewBtnStyle = { background: 'none', border: 'none', color: '#717171', cursor: 'pointer', padding: '4px', marginLeft: 'auto' };
const cameraReviewBtnStyle = { position: 'absolute', right: '1rem', top: '1rem', color: '#717171', cursor: 'pointer' };
const removeImgBadgeStyle = { position: 'absolute', top: -5, right: -5, backgroundColor: '#ff385c', color: 'white', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer' };
const avatarSmallStyle = { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' };

export default ListingDetail;
