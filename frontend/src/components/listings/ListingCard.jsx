import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, MapPin, Trash2, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import API from '../../services/api';

/**
 * ============================================================================
 * LISTING CARD COMPONENT (The Discovery Unit)
 * ============================================================================
 * This is the primary visual unit of the application. 
 * It has evolved from a simple image/text block to an interactive widget 
 * featuring role-aware controls and high-fidelity micro-interactions.
 */
const ListingCard = ({ listing, userRole, isAdminView, onEdit, onDelete, user, onWishlistUpdate }) => {
  // --- Wishlist Interaction State ---
  const isWishlisted = user?.wishlist?.includes(listing._id);
  const [isHovered, setIsHovered] = useState(false);

  /**
   * WISHLIST TOGGLE LOGIC
   * Performs an optimistic UI update followed by a backend sync.
   */
  const handleWishlistClick = async (e) => {
    e.preventDefault(); e.stopPropagation(); // Prevent navigation to detail page
    if (!user) return toast.error("Log in to save properties.");

    try {
      const res = await API.post(`/auth/wishlist/${listing._id}`);
      // Callback to App.jsx to update the global user state
      if (onWishlistUpdate) onWishlistUpdate(res.data);
      toast.success(isWishlisted ? "Removed from wishlist" : "Saved to wishlist");
    } catch (err) { toast.error("Failed to update wishlist"); }
  };

  /* --- HISTORICAL STAGE 1: PRIMITIVE CARD ---
   * return (
   *   <div className="card">
   *     <img src={listing.images[0]} />
   *     <h3>{listing.title}</h3>
   *     <p>{listing.rate}</p>
   *   </div>
   * );
   */

  return (
    <motion.div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      style={cardContainerStyle}
    >
      <Link to={`/listing/${listing._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={imageWrapperStyle}>
          {/* S3 Hosted Image */}
          <img src={listing.images[0]} alt={listing.title} style={imageStyle(isHovered)} />
          
          {/* --- HIGH-FIDELITY WISHLIST HEART --- */}
          {!isAdminView && (
            <button onClick={handleWishlistClick} style={heartBtnStyle}>
              <motion.div
                whileTap={{ scale: 0.8 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Heart 
                  size={24} 
                  fill={isWishlisted ? "#ff385c" : "rgba(0,0,0,0.5)"} 
                  color={isWishlisted ? "#ff385c" : "white"} 
                  strokeWidth={2}
                />
              </motion.div>
            </button>
          )}

          {/* Admin Contextual Controls */}
          {isAdminView && (
            <div style={adminOverlayStyle}>
              <button onClick={(e) => { e.preventDefault(); onEdit(listing); }} style={adminBtnStyle}><Edit size={16} /></button>
              <button onClick={(e) => { e.preventDefault(); onDelete(listing._id); }} style={{ ...adminBtnStyle, color: '#ff385c' }}><Trash2 size={16} /></button>
            </div>
          )}
        </div>

        <div style={contentAreaStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 style={titleStyle}>{listing.title}</h3>
            <div style={ratingStyle}>
              <Star size={14} fill="black" /> 
              <span>{listing.rating || 'New'}</span>
            </div>
          </div>
          <p style={locationStyle}>{listing.location}</p>
          <div style={priceContainerStyle}>
            <span style={priceStyle}>${listing.rate}</span>
            <span style={nightLabelStyle}>night</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

// --- STYLES ---
const cardContainerStyle = { cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.8rem', position: 'relative' };
const imageWrapperStyle = { position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f7f7f7' };
const imageStyle = (hovered) => ({ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s cubic-bezier(0.2, 1, 0.3, 1)', transform: hovered ? 'scale(1.05)' : 'scale(1)' });
const heartBtnStyle = { position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', cursor: 'pointer', zIndex: 10, padding: 0 };
const adminOverlayStyle = { position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '0.5rem', zIndex: 10 };
const adminBtnStyle = { backgroundColor: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' };
const contentAreaStyle = { display: 'flex', flexDirection: 'column', gap: '0.2rem' };
const titleStyle = { margin: 0, fontSize: '1rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const ratingStyle = { display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.9rem' };
const locationStyle = { margin: 0, color: '#717171', fontSize: '0.9rem' };
const priceContainerStyle = { marginTop: '0.2rem', display: 'flex', alignItems: 'baseline', gap: '0.3rem' };
const priceStyle = { fontWeight: '800', fontSize: '1rem' };
const nightLabelStyle = { fontSize: '0.9rem', color: '#222' };

export default ListingCard;
