import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, MapPin, CheckCircle, ChevronLeft, ChevronRight, User, Trash2, X, Maximize, Camera, Utensils, ChevronDown, Grid, Loader2,
  Wifi, Waves, Car, Tv, Wind, Dumbbell, Shield, Coffee
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, isValid } from 'date-fns'; 
import Calendar from 'react-calendar'; 
import 'react-calendar/dist/Calendar.css'; 
import API from '../services/api'; 
import ChatWindow from '../components/chat/ChatWindow'; 
import DetailSkeleton from '../components/listings/DetailSkeleton';
import { theme } from '../theme';

/**
 * ============================================================================
 * ⭐ RATING BREAKDOWN COMPONENT
 * ============================================================================
 * Logic: Aggregates individual review scores into a visual, proportional bar chart.
 * Uses Framer Motion to animate the bars growing from 0 to their actual percentage.
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
 * 🏠 LISTING DETAIL PAGE (The High-Fidelity Showcase)
 * ============================================================================
 * 
 * MASTERCLASS NOTES:
 * This is the most complex UI component in the application. It handles
 * data hydration from multiple sources, complex responsive layouts, 
 * an interactive calendar, and real-time chat.
 * 
 * Architectural Evolution:
 * - Phase 13: The Cinematic 5-Photo Grid implementation.
 * - Phase 15: Progressive Loading (Skeleton Skeletons).
 * - Phase 24: SEO-Driven Dynamic Titles.
 * - Phase 26: The "Nuclear Stability Pattern" (Decoupled Fetches).
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

  // --- DERIVE IMAGES EARLY (Phase 31 Correction) ---
  // We must define this before the navigation functions and effects 
  // that depend on its length to avoid ReferenceErrors.
  const images = listing?.images?.length > 0 ? listing.images : ['https://via.placeholder.com/1200x800'];

  const getSentiment = (rating) => {
    if (rating >= 4.8) return "Exceptional";
    if (rating >= 4.5) return "Highly Rated";
    if (rating >= 4.0) return "Recommended";
    return "Reviewed";
  };

  /**
   * SMART AMENITY ENGINE
   * Logic: Dynamically maps string text (e.g., 'WiFi') from the database
   * to professional SVG icons from lucide-react.
   */
  const getAmenityIcon = (name) => {
    const map = { 'WiFi': Wifi, 'Kitchen': Utensils, 'Pool': Waves, 'Parking': Car, 'TV': Tv, 'AC': Wind, 'Gym': Dumbbell, 'Security': Shield, 'Breakfast': Coffee };
    return map[name] || CheckCircle;
  };

  // --- DYNAMIC SEO HANDSHAKE (Phase 24) ---
  useEffect(() => {
    if (listing) {
      document.title = `${listing.title} | AirnbLite`;
    }
    return () => {
      document.title = "AirnbLite | Unique Stays & Professional Hosting";
    };
  }, [listing]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* ============================================================================
   * 👻 HISTORICAL GHOST: PHASE 10 (The Fragile Fetch)
   * ============================================================================
   * Originally, we fetched the Listing, Reviews, and Chat in a single Promise:
   * 
   * const [listingRes, reviewRes, chatRes] = await Promise.all([
   *    API.get(`/listings/${id}`),
   *    API.get(`/reviews/${id}`),
   *    API.get(`/auth/chat-history/${id}`)
   * ]);
   * 
   * THE FLAW: If a brand-new property had NO reviews, the `reviews` endpoint
   * would return a 404. Because `Promise.all` fails if ANY promise fails, the 
   * ENTIRE page crashed, showing a blank screen for a perfectly valid property!
   * ============================================================================ */

  const handleNextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // --- KEYBOARD NAVIGATION (Phase 31) ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isLightboxOpen) return;
      if (e.key === 'ArrowRight') handleNextImage();
      if (e.key === 'ArrowLeft') handlePrevImage();
      if (e.key === 'Escape') setIsLightboxOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, images.length]);

  /**
   * THE NUCLEAR STABILITY PATTERN (Phase 26)
   * Logic: We decouple the fetches. The Listing is "Critical." If it fails,
   * we abort. Reviews and Chat are "Non-Critical." If they fail, we catch 
   * the error silently and default to empty arrays, allowing the page to render.
   */
  const loadPageData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Core Listing Data (Critical)
      const res = await API.get(`/listings/${id}`);
      if (!res.data) throw new Error("Context Unavailable.");
      setListing(res.data);

      // 2. Fetch Reviews (Defensive Pattern)
      try {
        const reviewRes = await API.get(`/reviews/${id}`);
        setReviews(reviewRes.data || []);
      } catch (err) {
        console.warn('Reviews Sync Failure (Non-Critical)');
        setReviews([]);
      }

      // 3. Fetch Chat History (Defensive Pattern)
      if (localStorage.getItem('token')) {
        try {
          const chatRes = await API.get(`/auth/chat-history/${id}`);
          setChatHistory(chatRes.data || []);
        } catch (err) {
          console.warn('Chat History Sync Failure (Non-Critical)');
          setChatHistory([]);
        }
      }
    } catch (err) { 
      console.error("Property Sync Failure (Critical):", err.message);
      setError("Property sync failed."); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { if (id) loadPageData(); }, [id, user]);

  /**
   * DYNAMIC PRICING ENGINE
   * Logic: Calculates the total price in real-time as the user selects dates.
   * Includes a 14% simulated "Service Fee" for realism.
   */
  useEffect(() => {
    if (dateRange[0] && dateRange[1] && listing) {
      const diff = Math.ceil(Math.abs(dateRange[1] - dateRange[0]) / (1000 * 60 * 60 * 24));
      if (diff > 0) {
        const total = (diff * listing.rate) * 1.14;
        setPricing({ nights: diff, total: Math.round(total) });
      }
    }
  }, [dateRange, listing]);

  if (loading) return <DetailSkeleton />;
  if (error || !listing) return <div style={centerStyle}><h2>Property Unavailable</h2><Link to="/" style={{ color: theme.colors.brand }}>Return Home</Link></div>;

  return (
    <div style={{ minHeight: '100vh', width: '100%', backgroundColor: theme.colors.white }}>
      
      {/* 🖼️ HIGH-FIDELITY LIGHTBOX (Phase 13+) */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={lightboxOverlayStyle}>
            <button onClick={() => setIsLightboxOpen(false)} style={closeOverlayBtnStyle} title="Close Esc"><X size={32} /></button>
            
            {images.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); handlePrevImage(); }} style={{ ...navBtnStyle, left: '20px' }} title="Previous"><ChevronLeft size={48} /></button>
                <button onClick={(e) => { e.stopPropagation(); handleNextImage(); }} style={{ ...navBtnStyle, right: '20px' }} title="Next"><ChevronRight size={48} /></button>
                <div style={lightboxIndicator}>{lightboxIndex + 1} / {images.length}</div>
              </>
            )}

            <div style={lightboxContent}>
              <motion.img 
                key={lightboxIndex}
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                src={images[lightboxIndex]} 
                style={lightboxImg} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={containerStyle(isMobile)}>
        {!isMobile && <h1 style={titleText}>{listing.title}</h1>}
        
        <div style={layoutGrid(isMobile)}>
          <div style={{ flex: 2 }}>
            
            {/* 📸 CINEMATIC 5-PHOTO GRID (Desktop Only) */}
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
              {isMobile && <h1 style={{ fontSize: '1.8rem', fontWeight: theme.typography.weights.extraBold }}>{listing.title}</h1>}
              <div style={ratingSummary}>
                <Star size={18} fill={theme.colors.charcoal} /> 
                <span>{listing.rating || '4.5'}</span>
                <span style={dotSeparator}>·</span>
                <span style={{ textDecoration: 'underline' }}>{listing.reviewsCount || 0} reviews</span>
                <span style={dotSeparator}>·</span>
                <span style={sentimentLabelStyle}>{getSentiment(listing.rating)}</span>
              </div>

              <div style={dividerSection}>
                <h2 style={hostTitle}>Hosted by {listing.host?.name || 'Professional Host'}</h2>
                <p style={descText}>{listing.fullDescription || listing.description}</p>
              </div>

              <div style={dividerSection}>
                <h3 style={sectionLabel}>What this place offers</h3>
                <div style={amenityGrid}>
                  {(listing.amenities || []).map((a, i) => {
                    const Icon = getAmenityIcon(a);
                    return (<div key={i} style={amenityItem}><Icon size={24} color={theme.colors.charcoal} /> <span>{a}</span></div>);
                  })}
                </div>
              </div>

              <div style={dividerSection}>
                <h3 style={sectionLabel}>Select dates</h3>
                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                  <Calendar selectRange={true} onChange={setDateRange} value={dateRange} minDate={new Date()} />
                </div>
              </div>

              {/* ⭐️ HIGH-FIDELITY REVIEW SECTION */}
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

          {/* 💳 SIDEBAR CHECKOUT WIDGET */}
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
                <button 
                  onClick={() => {
                    if (!dateRange[0] || !dateRange[1]) {
                      toast.error('Please select your travel dates on the calendar first.', {
                        icon: '📅',
                        style: { borderRadius: '12px', background: theme.colors.charcoal, color: '#fff', fontWeight: 'bold' }
                      });
                      return;
                    }
                    navigate('/pay', { 
                      state: { 
                        listingId: id, 
                        listing: listing,
                        bookingDetails: {
                          checkIn: dateRange[0],
                          checkOut: dateRange[1],
                          nights: pricing.nights,
                          total: pricing.total
                        } 
                      } 
                    });
                  }} 
                  style={reserveBtn}
                >
                  Reserve Now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 💳 MOBILE RESERVATION BAR */}
      {isMobile && (
        <div style={mobileReserveBar}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>${listing.rate} <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>night</span></div>
            <div style={{ fontSize: '0.8rem', textDecoration: 'underline' }}>{new Date(dateRange[0] || Date.now()).toLocaleDateString()} – {new Date(dateRange[1] || Date.now()).toLocaleDateString()}</div>
          </div>
          <button 
            onClick={() => {
              if (!dateRange[0] || !dateRange[1]) {
                toast.error('Select travel dates on the calendar first.', {
                  icon: '📅',
                  style: { borderRadius: '12px', background: theme.colors.charcoal, color: '#fff', fontWeight: 'bold' }
                });
                return;
              }
              navigate('/pay', { 
                state: { 
                  listingId: id, 
                  listing: listing,
                  bookingDetails: {
                    checkIn: dateRange[0],
                    checkOut: dateRange[1],
                    nights: pricing.nights,
                    total: pricing.total
                  } 
                } 
              });
            }} 
            style={mobileReserveBtn}
          >
            Reserve
          </button>
        </div>
      )}

      {/* 💬 REAL-TIME CHAT WIDGET */}
      <ChatWindow 
        listingId={id} 
        currentUser={user} 
        isHost={(user?._id || user?.id) === (listing.adminId?._id || listing.adminId)} 
        history={chatHistory} 
      />
    </div>
  );
};

// --- STYLES ---
const centerStyle = { height: '80vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.white };
const containerStyle = (isMobile) => ({ maxWidth: '2560px', width: '100%', margin: isMobile ? '0' : '2rem auto', padding: isMobile ? '0' : '0 4rem' });
const titleText = { marginBottom: '1.5rem', fontSize: theme.typography.sizes.xxl, fontWeight: theme.typography.weights.extraBold, color: theme.colors.charcoal };
const layoutGrid = (isMobile) => ({ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '0' : '4rem' });
const mobileImg = { width: '100%', height: '300px', objectFit: 'cover' };
const galleryGrid = { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.8rem', height: '520px', borderRadius: theme.radius.md, overflow: 'hidden', cursor: 'pointer' };
const mainImage = { width: '100%', height: '100%', overflow: 'hidden' };
const sideGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '0.8rem', position: 'relative' };
const sideImage = { width: '100%', height: '100%', overflow: 'hidden' };
const fullFit = { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' };
const showBtn = { position: 'absolute', bottom: '24px', right: '24px', backgroundColor: theme.colors.white, border: `1px solid ${theme.colors.charcoal}`, borderRadius: theme.radius.sm, padding: '0.6rem 1.2rem', fontWeight: theme.typography.weights.extraBold, display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', boxShadow: theme.shadows.sm };
const ratingSummary = { display: 'flex', alignItems: 'center', gap: '0.5rem', color: theme.colors.charcoal, fontWeight: theme.typography.weights.bold, fontSize: '1rem' };
const dotSeparator = { margin: '0 0.2rem', color: '#717171' };
const sentimentLabelStyle = { backgroundColor: '#f7f7f7', padding: '0.2rem 0.8rem', borderRadius: '4px', fontSize: '0.85rem', color: theme.colors.brand, fontWeight: '800', textTransform: 'uppercase' };
const dividerSection = { marginTop: '2.5rem', borderTop: `1px solid ${theme.colors.divider}`, paddingTop: '2.5rem' };
const hostTitle = { fontSize: '1.5rem', fontWeight: theme.typography.weights.bold };
const descText = { color: theme.colors.charcoal, fontSize: '1.1rem', lineHeight: '1.7', marginTop: '1rem' };
const sectionLabel = { fontSize: '1.3rem', fontWeight: theme.typography.weights.bold };
const amenityGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' };
const amenityItem = { display: 'flex', alignItems: 'center', gap: '1rem', color: theme.colors.charcoal, fontSize: '1.05rem' };
const reviewHeader = (isMobile) => ({ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '4rem', alignItems: 'flex-start', marginBottom: '3rem' });
const largeRating = { fontSize: '2.5rem', margin: 0, fontWeight: theme.typography.weights.extraBold };
const reviewsCountText = { color: theme.colors.slate, fontWeight: theme.typography.weights.semibold };
const reviewGrid = (isMobile) => ({ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '3rem' });
const userRow = { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.8rem' };
const avatarCircle = { width: '48px', height: '48px', borderRadius: theme.radius.full, backgroundColor: theme.colors.charcoal, color: theme.colors.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: theme.typography.weights.bold, fontSize: '1.2rem' };
const reviewDate = { fontSize: '0.8rem', color: theme.colors.slate };
const reviewText = { color: theme.colors.charcoal, lineHeight: '1.6', fontSize: '1rem' };
const sidebarCard = { border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.lg, padding: '2rem', position: 'sticky', top: '120px', boxShadow: theme.shadows.lg, backgroundColor: theme.colors.white };
const sidebarPrice = { fontSize: '1.6rem', fontWeight: theme.typography.weights.extraBold, marginBottom: '1.5rem' };
const priceRow = { display: 'flex', justifyContent: 'space-between', fontSize: '1rem', marginBottom: '0.8rem', color: theme.colors.charcoal };
const totalRow = { display: 'flex', justifyContent: 'space-between', fontWeight: theme.typography.weights.bold, borderTop: `1px solid ${theme.colors.divider}`, paddingTop: '1rem', color: theme.colors.charcoal, fontSize: '1.2rem' };
const reserveBtn = { width: '100%', marginTop: '2rem', padding: '1.1rem', backgroundColor: theme.colors.brand, color: theme.colors.white, border: 'none', borderRadius: theme.radius.md, fontWeight: theme.typography.weights.extraBold, fontSize: '1.1rem', cursor: 'pointer', boxShadow: `0 4px 15px rgba(255, 56, 92, 0.3)` };
const lightboxOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' };
const closeOverlayBtnStyle = { position: 'absolute', top: '30px', right: '30px', background: 'rgba(255,255,255,0.1)', border: 'none', color: theme.colors.white, cursor: 'pointer', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', zIndex: 10001 };
const navBtnStyle = { position: 'absolute', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', color: theme.colors.white, cursor: 'pointer', padding: '15px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', zIndex: 10001 };
const lightboxIndicator = { position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', color: theme.colors.white, fontSize: '1rem', fontWeight: 'bold', letterSpacing: '0.1em', background: 'rgba(0,0,0,0.5)', padding: '0.5rem 1.2rem', borderRadius: '20px', zIndex: 10001 };
const lightboxContent = { textAlign: 'center', maxWidth: '90vw', position: 'relative' };
const lightboxImg = { maxHeight: '80vh', maxWidth: '100%', borderRadius: theme.radius.md, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' };
const breakdownContainerStyle = { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%' };
const breakdownRowStyle = { display: 'flex', alignItems: 'center', gap: '1.2rem' };
const starLabelStyle = { fontSize: '0.9rem', width: '70px', fontWeight: theme.typography.weights.semibold };
const barBgStyle = { flex: 1, height: '8px', backgroundColor: theme.colors.lightGrey, borderRadius: '4px', overflow: 'hidden' };
const barFillStyle = { height: '100%', backgroundColor: theme.colors.charcoal, borderRadius: '4px' };
const percentLabelStyle = { fontSize: '0.9rem', width: '50px', textAlign: 'right', color: theme.colors.slate };
const mobileReserveBar = { position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: theme.colors.white, borderTop: `1px solid ${theme.colors.divider}`, padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000, boxShadow: '0 -4px 10px rgba(0,0,0,0.05)' };
const mobileReserveBtn = { padding: '0.8rem 2rem', backgroundColor: theme.colors.brand, color: theme.colors.white, border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' };

export default ListingDetail;
