import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, MapPin, CheckCircle, ChevronLeft, ChevronRight, User, Trash2, X, Maximize, Camera, Upload, Plus, Minus, Users, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Calendar from 'react-calendar'; 
import 'react-calendar/dist/Calendar.css'; 
import toast from 'react-hot-toast';
import API from '../services/api'; 
import ChatWindow from '../components/chat/ChatWindow'; 

const ListingDetail = ({ userRole, user }) => { 
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
  
  // --- NEW: ADVANCED GUEST STATE ---
  const [guestCounts, setGuestCounts] = useState({ adults: 1, children: 0, infants: 0 });
  const [isGuestPickerOpen, setIsGuestPickerOpen] = useState(false);

  const [dateRange, setDateRange] = useState([null, null]); 
  const [pricing, setPricing] = useState({ nights: 0, subtotal: 0, serviceFee: 0, total: 0 });

  /**
   * ============================================================================
   * ADVANCED PRICING ENGINE (V2)
   * ============================================================================
   * UPDATED: Calculates total based on segmented guest types. 
   * Logic: (Adults * BaseRate) + (Children * ChildRate) + (Infants * InfantRate)
   */
  useEffect(() => {
    if (dateRange[0] && dateRange[1] && listing) {
      const diffTime = Math.abs(dateRange[1] - dateRange[0]);
      const diffNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffNights > 0) {
        // Multi-guest math
        const nightlyBase = (guestCounts.adults * listing.rate) + 
                           (guestCounts.children * (listing.childRate || listing.rate * 0.7)); // Default 70% for children if not set
        
        const subtotal = diffNights * nightlyBase;
        const serviceFee = Math.round(subtotal * 0.14);
        setPricing({ nights: diffNights, subtotal, serviceFee, total: subtotal + serviceFee });
      }
    } else {
      setPricing({ nights: 0, subtotal: 0, serviceFee: 0, total: 0 });
    }
  }, [dateRange, listing, guestCounts]);

  const fetchListingAndReviews = async () => {
    try {
      const [listingRes, reviewsRes, takenRes, chatRes] = await Promise.all([
        API.get(`/listings/${id}`),
        API.get(`/reviews/${id}`),
        API.get(`/bookings/listing/${id}/taken`),
        API.get(`/auth/chat-history/${id}`)
      ]);
      setListing(listingRes.data);
      setReviews(reviewsRes.data);
      setTakenDates(takenRes.data);
      setChatHistory(chatRes.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchListingAndReviews();
    const handleScroll = () => { if (window.scrollY > 600) setShowSticky(true); else setShowSticky(false); };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [id, user]);

  const updateGuests = (type, operation) => {
    const totalCurrent = guestCounts.adults + guestCounts.children;
    if (operation === 'inc' && totalCurrent >= listing.maxGuests && type !== 'infants') {
      return toast.error(`Maximum capacity is ${listing.maxGuests} guests.`);
    }
    
    setGuestCounts(prev => ({
      ...prev,
      [type]: operation === 'inc' ? prev[type] + 1 : Math.max(type === 'adults' ? 1 : 0, prev[type] - 1)
    }));
  };

  const handleReserve = async () => {
    if (!dateRange[0] || !dateRange[1]) return toast.error("Please select dates.");
    navigate('/pay', { state: { 
      listingId: id, 
      bookingDetails: { checkIn: dateRange[0].toISOString(), checkOut: dateRange[1].toISOString(), total: pricing.total, nights: pricing.nights, guests: guestCounts },
      listing
    }});
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>;
  if (!listing) return null;

  const totalGuests = guestCounts.adults + guestCounts.children;
  const isHost = user && (user.id === listing.adminId || user._id === listing.adminId);

  return (
    <div style={{ position: 'relative' }}>
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={lightboxOverlayStyle}>
            <button onClick={() => setIsLightboxOpen(false)} style={closeLightboxBtnStyle}><X size={32} /></button>
            <motion.img src={listing.images[activeImage]} style={lightboxImgStyle} />
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ maxWidth: '100%', width: '100%', margin: '2rem auto', padding: '0 2rem' }}>
        <h1>{listing.title}</h1>
        
        {/* Main Grid Layout */}
        <div style={{ display: 'flex', gap: '4rem', marginTop: '2rem' }}>
          <div style={{ flex: 2 }}>
            {/* Gallery, Host Info, Calendar etc. (Same as before) */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', marginBottom: '2rem' }}>
              <img src={listing.images[activeImage]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Listing" />
            </div>

            <div style={{ borderBottom: '1px solid #ddd', paddingBottom: '2.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Availability</h3>
              <Calendar selectRange={true} onChange={setDateRange} value={dateRange} tileDisabled={() => false} minDate={new Date()} />
            </div>
          </div>

          {/* SIDEBAR: UPDATED GUEST PICKER */}
          <div style={{ flex: 1 }}>
            <div style={sidebarCardStyle}>
              <div style={{ marginBottom: '1rem', fontSize: '1.4rem', fontWeight: 'bold' }}>${listing.rate} <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>/ night</span></div>
              
              <div style={pickerWrapperStyle}>
                <div onClick={() => setIsGuestPickerOpen(!isGuestPickerOpen)} style={guestTriggerStyle}>
                  <div>
                    <div style={pickerLabelStyle}>Guests</div>
                    <div style={pickerValueStyle}>{totalGuests} guests{guestCounts.infants > 0 && `, ${guestCounts.infants} infants`}</div>
                  </div>
                  <ChevronDown size={20} />
                </div>

                <AnimatePresence>
                  {isGuestPickerOpen && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} style={guestDropdownStyle}>
                      <GuestRow label="Adults" sub="Age 13+" count={guestCounts.adults} onDec={() => updateGuests('adults', 'dec')} onInc={() => updateGuests('adults', 'inc')} />
                      <GuestRow label="Children" sub="Ages 2-12" count={guestCounts.children} onDec={() => updateGuests('children', 'dec')} onInc={() => updateGuests('children', 'inc')} />
                      <GuestRow label="Infants" sub="Under 2" count={guestCounts.infants} onDec={() => updateGuests('infants', 'dec')} onInc={() => updateGuests('infants', 'inc')} />
                      <button onClick={() => setIsGuestPickerOpen(false)} style={closePickerBtnStyle}>Close</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {pricing.nights > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={priceRowStyle}><span>Total for {pricing.nights} nights</span><span>${pricing.total}</span></div>
                  <button onClick={handleReserve} style={reserveBtnStyle}>Reserve Now</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ChatWindow listingId={id} currentUser={user} isHost={isHost} history={chatHistory} />
    </div>
  );
};

// --- Sub-Component: Guest Row ---
const GuestRow = ({ label, sub, count, onDec, onInc }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid #eee' }}>
    <div><div style={{ fontWeight: 'bold' }}>{label}</div><div style={{ fontSize: '0.8rem', color: '#717171' }}>{sub}</div></div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <button onClick={onDec} style={countBtnStyle}><Minus size={14} /></button>
      <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{count}</span>
      <button onClick={onInc} style={countBtnStyle}><Plus size={14} /></button>
    </div>
  </div>
);

// --- STYLES ---
const sidebarCardStyle = { border: '1px solid #ddd', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 6px 16px rgba(0,0,0,0.12)', position: 'sticky', top: '100px' };
const pickerWrapperStyle = { position: 'relative', border: '1px solid #ddd', borderRadius: '8px', marginTop: '1rem' };
const guestTriggerStyle = { padding: '0.8rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const pickerLabelStyle = { fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase' };
const pickerValueStyle = { fontSize: '0.9rem' };
const guestDropdownStyle = { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '12px', padding: '1rem', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 100 };
const countBtnStyle = { width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const closePickerBtnStyle = { width: '100%', marginTop: '1rem', padding: '0.5rem', border: 'none', backgroundColor: '#222', color: '#fff', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' };
const priceRowStyle = { display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '1rem' };
const reserveBtnStyle = { width: '100%', padding: '1rem', backgroundColor: '#ff385c', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const lightboxOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 5000, display: 'flex', justifyContent: 'center', alignItems: 'center' };
const lightboxImgStyle = { maxWidth: '90%', maxHeight: '85vh', objectFit: 'contain' };
const closeLightboxBtnStyle = { position: 'absolute', top: '2rem', left: '2rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' };

export default ListingDetail;
