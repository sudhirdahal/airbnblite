import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, MapPin, Trash2, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import API from '../../services/api';
import { theme } from '../../theme'; // --- NEW: THEME IMPORT ---

/**
 * ============================================================================
 * LISTING CARD (V3 - THE DESIGN TOKEN UPDATE)
 * ============================================================================
 * OVERHAUL: Migrated all hardcoded styles to the centralized 'theme' authority.
 * This component now consumes 'Tokens' (e.g., theme.colors.brand) instead 
 * of raw hex codes, enabling global consistency.
 */
const ListingCard = ({ listing, userRole, isAdminView, onEdit, onDelete, user, onWishlistUpdate }) => {
  const isWishlisted = user?.wishlist?.includes(listing._id);
  const [isHovered, setIsHovered] = useState(false);

  const handleWishlistClick = async (e) => {
    e.preventDefault(); e.stopPropagation(); 
    if (!user) return toast.error("Log in to save properties.");
    try {
      const res = await API.post(`/auth/wishlist/${listing._id}`);
      if (onWishlistUpdate) onWishlistUpdate(res.data);
      toast.success(isWishlisted ? "Removed from wishlist" : "Saved to wishlist");
    } catch (err) { toast.error("Sync Error"); }
  };

  return (
    <motion.div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      style={cardContainerStyle}
    >
      <Link to={`/listing/${listing._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={imageWrapperStyle}>
          <img src={listing.images[0]} alt={listing.title} style={imageStyle(isHovered)} />
          
          {!isAdminView && (
            <button onClick={handleWishlistClick} style={heartBtnStyle}>
              <motion.div whileTap={{ scale: 0.8 }} transition={theme.transitions.spring}>
                <Heart 
                  size={24} 
                  fill={isWishlisted ? theme.colors.brand : "rgba(0,0,0,0.4)"} 
                  color={isWishlisted ? theme.colors.brand : theme.colors.white} 
                  strokeWidth={2} 
                />
              </motion.div>
            </button>
          )}

          {isAdminView && (
            <div style={adminOverlayStyle}>
              <button onClick={(e) => { e.preventDefault(); onEdit(listing); }} style={adminBtnStyle}><Edit size={16} /></button>
              <button onClick={(e) => { e.preventDefault(); onDelete(listing._id); }} style={{ ...adminBtnStyle, color: theme.colors.brand }}><Trash2 size={16} /></button>
            </div>
          )}
        </div>

        <div style={contentAreaStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={titleStyle}>{listing.title}</h3>
            <div style={ratingStyle}>
              <Star size={14} fill={theme.colors.charcoal} /> 
              <span style={{ fontWeight: theme.typography.weights.semibold }}>{listing.rating || 'New'}</span>
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

// --- TOKEN-BASED STYLES ---
const cardContainerStyle = { cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.8rem', position: 'relative' };

const imageWrapperStyle = { 
  position: 'relative', 
  width: '100%', 
  aspectRatio: '4 / 3', 
  borderRadius: theme.radius.md, 
  overflow: 'hidden', 
  backgroundColor: theme.colors.lightGrey 
};

const imageStyle = (hovered) => ({ 
  width: '100%', 
  height: '100%', 
  objectFit: 'cover', 
  transition: 'transform 0.6s cubic-bezier(0.2, 1, 0.3, 1)', 
  transform: hovered ? 'scale(1.05)' : 'scale(1)' 
});

const heartBtnStyle = { position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', cursor: 'pointer', zIndex: 10, padding: 0 };
const adminOverlayStyle = { position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '0.5rem', zIndex: 10 };
const adminBtnStyle = { backgroundColor: theme.colors.white, border: 'none', borderRadius: theme.radius.full, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: theme.shadows.sm };

const titleStyle = { 
  margin: 0, 
  fontSize: theme.typography.sizes.sm, 
  fontWeight: theme.typography.weights.bold, 
  color: theme.colors.charcoal,
  whiteSpace: 'nowrap', 
  overflow: 'hidden', 
  textOverflow: 'ellipsis' 
};

const ratingStyle = { display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: theme.typography.sizes.sm };
const locationStyle = { margin: 0, color: theme.colors.slate, fontSize: theme.typography.sizes.sm, fontWeight: theme.typography.weights.normal };
const priceContainerStyle = { marginTop: '0.3rem', display: 'flex', alignItems: 'baseline', gap: '0.3rem' };
const priceStyle = { fontWeight: theme.typography.weights.extraBold, fontSize: theme.typography.sizes.sm, color: theme.colors.charcoal };
const nightLabelStyle = { fontSize: theme.typography.sizes.sm, color: theme.colors.charcoal, fontWeight: theme.typography.weights.normal };
const contentAreaStyle = { display: 'flex', flexDirection: 'column', gap: '0.2rem' };

/* --- HISTORICAL STAGE 1: HARDCODED HEX ---
 * const titleStyle = { color: '#222', fontSize: '15px' };
 */

export default ListingCard;
