import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, MapPin, CheckCircle, ChevronLeft, ChevronRight, User, Trash2, X, Maximize, Camera, Utensils, ChevronDown, Grid, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, isValid } from 'date-fns'; 
import Calendar from 'react-calendar'; 
import 'react-calendar/dist/Calendar.css'; 
import API from '../services/api'; 
import ChatWindow from '../components/chat/ChatWindow'; 

/**
 * ============================================================================
 * RATING BREAKDOWN COMPONENT
 * ============================================================================
 */
const RatingBreakdown = ({ reviews = [] }) => {
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  if (Array.isArray(reviews)) {
    reviews.forEach(r => { if (r && r.rating && counts[r.rating] !== undefined) counts[r.rating]++; });
  }
  const total = reviews.length || 1;
  return (
    <div style={breakdownContainerStyle}>
      {[5, 4, 3, 2, 1].map(star => (
        <div key={star} style={breakdownRowStyle}>
          <span style={starLabelStyle}>{star} stars</span>
          <div style={barBgStyle}><motion.div initial={{ width: 0 }} animate={{ width: `${(counts[star] / total) * 100}%` }} transition={{ duration: 1 }} style={barFillStyle} /></div>
          <span style={percentLabelStyle}>{Math.round((counts[star] / total) * 100)}%</span>
        </div>
      ))}
    </div>
  );
};

/**
 * ============================================================================
 * LISTING DETAIL PAGE (V18 - THE FINAL RESTORATION)
 * ============================================================================
 */
const ListingDetail = ({ user, onChatOpened }) => { 
  const { id } = useParams(); 
  const navigate = useNavigate(); 

  const [listing, setListing] = useState(null);       
  const [reviews, setReviews] = useState([]);         
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);       
  const [error, setError] = useState(null);
  
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [dateRange, setDateRange] = useState([null, null]); 
  const [pricing, setPricing] = useState({ nights: 0, total: 0 });

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadPageData = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/listings/${id}`);
      if (!res.data) throw new Error("Listing Context Unavailable.");
      setListing(res.data);
      
      const reviewRes = await API.get(`/reviews/${id}`).catch(() => ({ data: [] }));
      setReviews(reviewRes.data || []);

      if (localStorage.getItem('token')) {
        const chatRes = await API.get(`/auth/chat-history/${id}`).catch(() => ({ data: [] }));
        setChatHistory(chatRes.data || []);
      }
    } catch (err) {
      setError("Unable to sync with property server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) loadPageData(); }, [id, user]);

  useEffect(() => {
    if (dateRange[0] && dateRange[1] && listing) {
      const diff = Math.ceil(Math.abs(dateRange[1] - dateRange[0]) / (1000 * 60 * 60 * 24));
      if (diff > 0) {
        const total = (diff * listing.rate) * 1.14;
        setPricing({ nights: diff, total: Math.round(total) });
      }
    }
  }, [dateRange, listing]);

  if (loading) return <div style={centerStyle}><Loader2 size={48} className="spin" color="#ff385c" /><h2 style={{ marginTop: '1rem' }}>Synchronizing stay details...</h2></div>;
  if (error || !listing) return <div style={centerStyle}><h2>Property Unavailable</h2><Link to="/" style={{ color: '#ff385c', fontWeight: 'bold' }}>Return Home</Link></div>;

  const images = listing.images?.length > 0 ? listing.images : ['https://via.placeholder.com/1200x800'];

  return (
    <div style={{ minHeight: '100vh', width: '100%', backgroundColor: '#fff' }}>
      
      {/* LIGHTBOX */}
      <AnimatePresence>
        {isLightboxOpen && (
          <div style={lightboxOverlayStyle}>
            <button onClick={() => setIsLightboxOpen(false)} style={closeBtnStyle}><X size={32} /></button>
            <div style={lightboxContent}>
              <img src={images[lightboxIndex]} style={lightboxImg} />
              <div style={lightboxNav}>
                <button onClick={() => setLightboxIndex((i) => (i - 1 + images.length) % images.length)} style={navBtn}><ChevronLeft /></button>
                <span>{lightboxIndex + 1} / {images.length}</span>
                <button onClick={() => setLightboxIndex((i) => (i + 1) % images.length)} style={navBtn}><ChevronRight /></button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <div style={containerStyle(isMobile)}>
        {!isMobile && <h1 style={titleText}>{listing.title}</h1>}
        
        <div style={layoutGrid(isMobile)}>
          <div style={{ flex: 2 }}>
            
            {/* GRID GALLERY */}
            {!isMobile ? (
              <div style={galleryGrid}>
                <div onClick={() => setIsLightboxOpen(true)} style={mainImage}><img src={images[0]} style={fullFit} /></div>
                <div style={sideGrid}>
                  {images.slice(1, 5).map((img, i) => (
                    <div key={i} onClick={() => { setLightboxIndex(i+1); setIsLightboxOpen(true); }} style={sideImage}><img src={img} style={fullFit} /></div>
                  ))}
                  <button onClick={() => setIsLightboxOpen(true)} style={showBtn}><Grid size={16} /> Show photos</button>
                </div>
              </div>
            ) : (
              <img src={images[0]} style={mobileImg} onClick={() => setIsLightboxOpen(true)} />
            )}

            <div style={{ padding: isMobile ? '1.5rem' : '2.5rem 0' }}>
              {isMobile && <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>{listing.title}</h1>}
              <div style={ratingSummary}>
                <Star size={18} fill="black" /> {listing.rating || '4.5'} · {listing.reviewsCount || 0} reviews · {listing.location}
              </div>

              <div style={dividerSection}>
                <h2 style={hostTitle}>Hosted by {listing.host?.name || 'Professional Host'}</h2>
                <p style={descText}>{listing.fullDescription || listing.description}</p>
              </div>

              <div style={dividerSection}>
                <h3 style={sectionLabel}>What this place offers</h3>
                <div style={amenityGrid}>
                  {(listing.amenities || []).map((a, i) => (<div key={i} style={amenityItem}><CheckCircle size={22} color="#ff385c" /> {a}</div>))}
                </div>
              </div>

              <div style={dividerSection}>
                <h3 style={sectionLabel}>Select dates</h3>
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                  <Calendar selectRange={true} onChange={setDateRange} value={dateRange} minDate={new Date()} />
                </div>
              </div>

              <div style={{ marginTop: '4rem' }}>
                <div style={reviewHeader(isMobile)}>
                  <div><h2 style={largeRating}><Star size={32} fill="#000" /> {listing.rating || '4.5'}</h2><p style={reviewsCountText}>{listing.reviewsCount || 0} reviews</p></div>
                  <RatingBreakdown reviews={reviews} />
                </div>
                <div style={reviewGrid(isMobile)}>
                  {reviews.map(r => (
                    <div key={r._id} style={{ marginBottom: '1.5rem' }}>
                      <div style={userRow}>
                        <div style={avatarCircle}>{r.userId?.name?.charAt(0) || 'U'}</div>
                        <div><div style={{ fontWeight: 'bold' }}>{r.userId?.name || 'Traveler'}</div><div style={reviewDate}>{r.createdAt ? formatDistanceToNow(new Date(r.createdAt), { addSuffix: true }) : 'Recently'}</div></div>
                      </div>
                      <p style={reviewText}>{r.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {!isMobile && (
            <div style={{ flex: 1 }}>
              <div style={sidebarCard}>
                <div style={sidebarPrice}>${listing.rate} <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>night</span></div>
                {pricing.nights > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                     <div style={priceRow}><span>${listing.rate} x {pricing.nights} nights</span><span>${listing.rate * pricing.nights}</span></div>
                     <div style={totalRow}><span>Total</span><span>${pricing.total}</span></div>
                  </div>
                )}
                <button onClick={() => navigate('/pay', { state: { listingId: id, bookingDetails: { checkIn: dateRange[0], checkOut: dateRange[1], total: pricing.total, nights: pricing.nights }, listing }})} style={reserveBtn}>Reserve Now</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isMobile && (
        <div style={mobileBar}>
          <div><div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>${listing.rate} night</div><div style={{ fontSize: '0.8rem', textDecoration: 'underline' }}>{pricing.nights > 0 ? `${pricing.nights} nights` : 'Select dates'}</div></div>
          <button onClick={() => navigate('/pay', { state: { listingId: id, bookingDetails: { checkIn: dateRange[0], checkOut: dateRange[1], total: pricing.total, nights: pricing.nights }, listing }})} style={mobileBtn}>Reserve</button>
        </div>
      )}

      <ChatWindow listingId={id} currentUser={user} isHost={user?.id === listing.adminId} history={chatHistory} />
    </div>
  );
};

// --- STYLES ---
const centerStyle = { height: '80vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' };
const containerStyle = (isMobile) => ({ maxWidth: '2560px', width: '100%', margin: isMobile ? '0' : '2rem auto', padding: isMobile ? '0' : '0 4rem' });
const titleText = { marginBottom: '1.5rem', fontSize: '2rem', fontWeight: '800', color: '#222' };
const layoutGrid = (isMobile) => ({ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '0' : '4rem' });
const mobileImg = { width: '100%', height: '300px', objectFit: 'cover' };
const galleryGrid = { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.8rem', height: '520px', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer' };
const mainImage = { width: '100%', height: '100%', overflow: 'hidden' };
const sideGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '0.8rem', position: 'relative' };
const sideImage = { width: '100%', height: '100%', overflow: 'hidden' };
const fullFit = { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' };
const showBtn = { position: 'absolute', bottom: '24px', right: '24px', backgroundColor: '#fff', border: '1px solid #222', borderRadius: '8px', padding: '0.6rem 1.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' };
const ratingSummary = { display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#222', fontWeight: '700', fontSize: '1rem' };
const dividerSection = { marginTop: '2.5rem', borderTop: '1px solid #eee', paddingTop: '2.5rem' };
const hostTitle = { fontSize: '1.5rem', fontWeight: '700' };
const descText = { color: '#444', fontSize: '1.1rem', lineHeight: '1.6', marginTop: '1rem' };
const sectionLabel = { fontSize: '1.3rem', fontWeight: '700' };
const amenityGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' };
const amenityItem = { display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#444' };
const reviewHeader = (isMobile) => ({ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '4rem', alignItems: 'flex-start', marginBottom: '3rem' });
const largeRating = { fontSize: '2.5rem', margin: 0, fontWeight: '800' };
const reviewsCountText = { color: '#717171', fontWeight: '600' };
const reviewGrid = (isMobile) => ({ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '3rem' });
const userRow = { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.8rem' };
const avatarCircle = { width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#222', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' };
const reviewDate = { fontSize: '0.8rem', color: '#888' };
const reviewText = { color: '#444', lineHeight: '1.6', fontSize: '1rem' };
const sidebarCard = { border: '1px solid #ddd', borderRadius: '24px', padding: '2rem', position: 'sticky', top: '120px', boxShadow: '0 12px 32px rgba(0,0,0,0.1)', backgroundColor: '#fff' };
const sidebarPrice = { fontSize: '1.6rem', fontWeight: '800', marginBottom: '1.5rem' };
const priceRow = { display: 'flex', justifyContent: 'space-between', fontSize: '1rem', marginBottom: '0.8rem', color: '#444' };
const totalRow = { display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #eee', paddingTop: '1rem', color: '#000', fontSize: '1.2rem' };
const reserveBtn = { width: '100%', marginTop: '2rem', padding: '1.1rem', backgroundColor: '#ff385c', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '1.1rem', cursor: 'pointer' };
const mobileBar = { position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTop: '1px solid #eee', padding: '1.2rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000, boxShadow: '0 -8px 24px rgba(0,0,0,0.08)' };
const mobileBtn = { backgroundColor: '#ff385c', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '1.1rem', cursor: 'pointer', padding: '0.8rem 2.5rem' };
const lightboxOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.98)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const closeBtnStyle = { position: 'absolute', top: '40px', right: '40px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' };
const lightboxContent = { textAlign: 'center', maxWidth: '90vw' };
const lightboxImg = { maxHeight: '80vh', maxWidth: '100%', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' };
const lightboxNav = { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '3rem', marginTop: '2.5rem', color: 'white', fontWeight: 'bold', fontSize: '1.1rem' };
const navBtn = { background: 'white', color: 'black', border: 'none', borderRadius: '50%', padding: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' };
const breakdownContainerStyle = { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%' };
const breakdownRowStyle = { display: 'flex', alignItems: 'center', gap: '1.2rem' };
const starLabelStyle = { fontSize: '0.9rem', width: '70px', fontWeight: '600' };
const barBgStyle = { flex: 1, height: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' };
const barFillStyle = { height: '100%', backgroundColor: '#222', borderRadius: '4px' };
const percentLabelStyle = { fontSize: '0.9rem', width: '50px', textAlign: 'right', color: '#717171' };

export default ListingDetail;
