import React, { useState, memo } from 'react'; // --- UPDATED: Added memo ---
import { Link } from 'react-router-dom';
import { Star, Heart, MapPin, Trash2, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import API from '../../services/api';
import { theme } from '../../theme';

/**
 * ============================================================================
 * LISTING CARD (V7 - THE PERFORMANCE MEMOIZATION UPDATE)
 * ============================================================================
 * OVERHAUL: Component Memoization.
 * Logic: Wrapped in React.memo to prevent unnecessary re-renders.
 * Why: In Phase 20, we added 'hoveredListingId' to the parent. Without memo,
 * EVERY card in the grid would re-render every time the user moved their 
 * mouse over a card. Now, only the specific card being hovered updates.
 */
const ListingCard = ({ listing, userRole, isAdminView, onEdit, onDelete, user, onWishlistUpdate, onHover, onLeave }) => {
  const isWishlisted = user?.wishlist?.includes(listing._id);
  const [isHovered, setIsHovered] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleWishlistClick = async (e) => {
    e.preventDefault(); e.stopPropagation(); 
    if (!user) return toast.error("Log in to save your favorite stays.");
    try {
      const res = await API.post(`/auth/wishlist/${listing._id}`);
      if (onWishlistUpdate) onWishlistUpdate(res.data);
      if (!isWishlisted) {
        toast.success((t) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src={listing.images[0]} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
            <div><div style={{ fontWeight: 'bold' }}>Saved</div><div style={{ fontSize: '0.8rem', color: '#717171' }}>{listing.title}</div></div>
          </div>
        ));
      }
    } catch (err) { toast.error("Sync Failure"); }
  };

  return (
    <motion.div 
      onMouseEnter={() => { setIsHovered(true); onHover && onHover(); }}
      onMouseLeave={() => { setIsHovered(false); onLeave && onLeave(); }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      style={cardContainerStyle}
    >
      <Link to={`/listing/${listing._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={imageWrapperStyle}>
          <motion.img 
            src={listing.images[0]} alt={listing.title} onLoad={() => setIsImageLoaded(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: isImageLoaded ? 1 : 0, scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.4 }}
            style={imageStyle} 
          />
          {!isImageLoaded && <div style={skeletonBackdrop}><div className="shimmer-sweep" /></div>}
          {!isAdminView && (
            <button onClick={handleWishlistClick} style={heartBtnStyle}>
              <motion.div whileTap={{ scale: 0.8 }} transition={theme.transitions.spring}>
                <Heart size={24} fill={isWishlisted ? theme.colors.brand : "rgba(0,0,0,0.4)"} color={isWishlisted ? theme.colors.brand : theme.colors.white} strokeWidth={2} />
              </motion.div>
            </button>
          )}
        </div>

        <div style={contentAreaStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={titleStyle}>{listing.title}</h3>
            <div style={ratingStyle}><Star size={14} fill={theme.colors.charcoal} /> <span style={{ fontWeight: theme.typography.weights.semibold }}>{listing.rating || '4.5'}</span></div>
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
const imageWrapperStyle = { position: 'relative', width: '100%', aspectRatio: '4 / 3', borderRadius: theme.radius.md, overflow: 'hidden', backgroundColor: theme.colors.lightGrey };
const imageStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const skeletonBackdrop = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#f3f3f3', zIndex: 1, overflow: 'hidden' };
const heartBtnStyle = { position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', cursor: 'pointer', zIndex: 10, padding: 0 };
const titleStyle = { margin: 0, fontSize: theme.typography.sizes.sm, fontWeight: theme.typography.weights.bold, color: theme.colors.charcoal, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const ratingStyle = { display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: theme.typography.sizes.sm };
const locationStyle = { margin: 0, color: theme.colors.slate, fontSize: theme.typography.sizes.sm, fontWeight: theme.typography.weights.normal };
const priceContainerStyle = { marginTop: '0.3rem', display: 'flex', alignItems: 'baseline', gap: '0.3rem' };
const priceStyle = { fontWeight: theme.typography.weights.extraBold, fontSize: theme.typography.sizes.sm, color: theme.colors.charcoal };
const nightLabelStyle = { fontSize: theme.typography.sizes.sm, color: theme.colors.charcoal, fontWeight: theme.typography.weights.normal };
const contentAreaStyle = { display: 'flex', flexDirection: 'column', gap: '0.2rem' };

/* --- HISTORICAL STAGE 1: NON-MEMOIZED CARD ---
 * const ListingCard = (props) => { ... }
 * // Problem: Re-rendered 100+ times per second during mouse movement!
 */

export default memo(ListingCard);
