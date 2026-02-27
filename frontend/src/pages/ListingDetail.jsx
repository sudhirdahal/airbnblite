import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, MapPin, CheckCircle, ChevronLeft, ChevronRight, User, Trash2, X, Maximize, Camera, Utensils, ChevronDown, Grid, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, isValid } from 'date-fns'; 
import Calendar from 'react-calendar'; 
import 'react-calendar/dist/Calendar.css'; 
import toast from 'react-hot-toast';
import API from '../services/api'; 
import ChatWindow from '../components/chat/ChatWindow'; 

/**
 * ============================================================================
 * LISTING DETAIL (V15 - THE HARMONIZED VERSION)
 * ============================================================================
 * FIXED: Resolved variable naming collision (fullPageCenter vs centerStyle)
 * that was causing a fatal render crash.
 */
const ListingDetail = ({ userRole, user, onChatOpened }) => { 
  const { id } = useParams(); 
  const navigate = useNavigate(); 

  const [listing, setListing] = useState(null);       
  const [reviews, setReviews] = useState([]);         
  const [loading, setLoading] = useState(true);       
  const [error, setError] = useState(null);
  
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [dateRange, setDateRange] = useState([null, null]); 
  const [pricing, setPricing] = useState({ nights: 0, total: 0 });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await API.get(`/listings/${id}`);
        if (!res.data) throw new Error("Listing not found.");
        setListing(res.data);
        
        // Fetch reviews silently
        const reviewRes = await API.get(`/reviews/${id}`).catch(() => ({ data: [] }));
        setReviews(reviewRes.data || []);
      } catch (err) {
        console.error('Fetch Error:', err);
        setError("Could not load property details.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  useEffect(() => {
    if (dateRange[0] && dateRange[1] && listing) {
      const diff = Math.ceil(Math.abs(dateRange[1] - dateRange[0]) / (1000 * 60 * 60 * 24));
      if (diff > 0) {
        const total = (diff * listing.rate) * 1.14;
        setPricing({ nights: diff, total: Math.round(total) });
      }
    }
  }, [dateRange, listing]);

  // --- RENDER: LOADING ---
  if (loading) {
    return (
      <div style={centerStyle}>
        <Loader2 size={48} className="spin" color="#ff385c" />
        <h2 style={{ marginTop: '1rem', color: '#222' }}>Loading property...</h2>
      </div>
    );
  }

  // --- RENDER: ERROR ---
  if (error || !listing) {
    return (
      <div style={centerStyle}>
        <h2 style={{ color: '#222' }}>Error</h2>
        <p style={{ color: '#717171' }}>{error || "Listing not found."}</p>
        <Link to="/" style={{ marginTop: '1rem', color: '#ff385c' }}>Return home</Link>
      </div>
    );
  }

  const images = listing.images?.length > 0 ? listing.images : ['https://via.placeholder.com/1200x800'];

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#fff' }}>
      
      {/* Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && (
          <div style={lightboxOverlay}>
            <button onClick={() => setIsLightboxOpen(false)} style={closeBtn}><X size={32} /></button>
            <div style={{ textAlign: 'center' }}>
              <img src={images[lightboxIndex]} style={{ maxHeight: '80vh', maxWidth: '90vw', borderRadius: '12px' }} />
            </div>
          </div>
        )}
      </AnimatePresence>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem' }}>{listing.title}</h1>
        
        {/* Gallery */}
        <div style={galleryGrid}>
          <div style={mainImage} onClick={() => { setLightboxIndex(0); setIsLightboxOpen(true); }}>
            <img src={images[0]} style={fullFit} />
          </div>
          <div style={sideGrid}>
            {images.slice(1, 5).map((img, i) => (
              <div key={i} style={tileImage} onClick={() => { setLightboxIndex(i+1); setIsLightboxOpen(true); }}>
                <img src={img} style={fullFit} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4rem', marginTop: '2rem' }}>
          <div style={{ flex: 2 }}>
            <div style={{ paddingBottom: '2rem', borderBottom: '1px solid #eee' }}>
              <h2 style={{ margin: 0 }}>Hosted by {listing.host?.name || 'Professional Host'}</h2>
              <p style={{ color: '#717171' }}>{listing.location}</p>
            </div>

            <div style={{ padding: '2rem 0', borderBottom: '1px solid #eee' }}>
              <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#222' }}>{listing.fullDescription || listing.description}</p>
            </div>

            <div style={{ padding: '2rem 0', borderBottom: '1px solid #eee' }}>
              <h3>What this place offers</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {(listing.amenities || []).map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}><CheckCircle size={20} color="#ff385c" /> {a}</div>
                ))}
              </div>
            </div>

            <div style={{ padding: '2rem 0' }}>
              <h3>Select Dates</h3>
              <Calendar selectRange={true} onChange={setDateRange} value={dateRange} minDate={new Date()} />
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={sidebarCard}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${listing.rate} <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>night</span></div>
              {pricing.nights > 0 && (
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
                  <div style={priceRow}><span>${listing.rate} x {pricing.nights} nights</span><span>${listing.rate * pricing.nights}</span></div>
                  <div style={{ ...priceRow, fontWeight: 'bold', marginTop: '1rem' }}><span>Total</span><span>${pricing.total}</span></div>
                </div>
              )}
              <button onClick={() => navigate('/pay')} style={reserveBtn}>Reserve</button>
            </div>
          </div>
        </div>
      </div>

      <ChatWindow listingId={id} currentUser={user} isHost={user?.id === listing.adminId} onChatOpened={onChatOpened} />
    </div>
  );
};

// --- STYLES ---
const centerStyle = { height: '80vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' };
const galleryGrid = { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem', height: '450px', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer' };
const mainImage = { width: '100%', height: '100%', overflow: 'hidden' };
const sideGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '0.5rem' };
const tileImage = { width: '100%', height: '100%', overflow: 'hidden' };
const fullFit = { width: '100%', height: '100%', objectFit: 'cover' };
const sidebarCard = { border: '1px solid #ddd', borderRadius: '16px', padding: '1.5rem', position: 'sticky', top: '100px', boxShadow: '0 6px 16px rgba(0,0,0,0.1)' };
const priceRow = { display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' };
const reserveBtn = { width: '100%', marginTop: '1.5rem', padding: '1rem', backgroundColor: '#ff385c', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const lightboxOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const closeBtn = { position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' };

export default ListingDetail;
