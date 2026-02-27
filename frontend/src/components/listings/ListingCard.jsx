import React, { useState, memo } from 'react'; 
import { Link } from 'react-router-dom';
import { Star, Heart, MapPin, Trash2, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import API from '../../services/api';
import { theme } from '../../theme';

/**
 * ============================================================================
 * 🖼️ LISTING CARD (The Atomic Discovery Unit)
 * ============================================================================
 * 
 * MASTERCLASS NOTES:
 * The Listing Card is the most frequent component in the application. Any 
 * architectural flaw here is multiplied by 100.
 * 
 * Evolution Timeline:
 * - Phase 1: Simple <img> and <h3> tags.
 * - Phase 13: High-Fidelity Aspect Ratio Lock (4:3) and Hover Lift.
 * - Phase 15: Progressive Image Loading (Skeleton Backdrop).
 * - Phase 20: Performance Memoization (Preventing Mouse-Move lag).
 */

/* ============================================================================
 * 👻 HISTORICAL GHOST: PHASE 1 (The Naive Card)
 * ============================================================================
 * const ListingCard = ({ listing }) => (
 *   <div>
 *     <img src={listing.image} />
 *     <h3>{listing.title}</h3>
 *   </div>
 * );
 * 
 * THE FLAW: It was aesthetically "flat." There was no hover feedback, 
 * no rating summary, and most importantly, it caused "Layout Shift" 
 * because the image height was undefined until it loaded.
 * ============================================================================ */

const ListingCard = ({ 
  listing, 
  userRole, 
  isAdminView, 
  onEdit, 
  onDelete, 
  user, 
  onWishlistUpdate, 
  onHover, 
  onLeave 
}) => {
  const isWishlisted = user?.wishlist?.includes(listing._id);
  const [isHovered, setIsHovered] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  /**
   * ❤️ WISHLIST PERSISTENCE ENGINE
   * Logic: Finalizes the toggle action and provides cinematic toast feedback.
   */
  const handleWishlistClick = async (e) => {
    e.preventDefault(); // Prevent navigating to detail page
    e.stopPropagation(); 
    
    if (!user) return toast.error("Log in to save your favorite stays.");
    
    try {
      // Symmetrical Sync: Notify the backend
      const res = await API.post(`/auth/wishlist/${listing._id}`);
      
      // Update global state via callback
      if (onWishlistUpdate) onWishlistUpdate(res.data);
      
      if (!isWishlisted) {
        // High-Fidelity Feedback: Toast with property preview
        toast.success((t) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src={listing.images[0]} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} alt="Thumb" />
            <div>
              <div style={{ fontWeight: 'bold' }}>Saved</div>
              <div style={{ fontSize: '0.8rem', color: theme.colors.slate }}>{listing.title}</div>
            </div>
          </div>
        ));
      }
    } catch (err) { toast.error("Sync Failure"); }
  };

  return (
    <motion.div 
      // SPATIAL HANDSHAKE: Notify parent when mouse enters
      onMouseEnter={() => { setIsHovered(true); onHover && onHover(); }}
      onMouseLeave={() => { setIsHovered(false); onLeave && onLeave(); }}
      
      // CINEMATIC ENTRANCE: Staggered fade-in
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }} // Subtle lift on hover
      style={cardContainerStyle}
    >
      <Link to={`/listing/${listing._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        
        {/* MEDIA CONTAINER */}
        <div style={imageWrapperStyle}>
          <motion.img 
            src={listing.images[0]} 
            alt={listing.title} 
            onLoad={() => setIsImageLoaded(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: isImageLoaded ? 1 : 0, scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.4 }}
            style={imageStyle} 
          />
          
          {/* PROGRESSIVE LOADING LAYER (Phase 15) */}
          {!isImageLoaded && (
            <div style={skeletonBackdrop}>
              <div className="shimmer-sweep" />
            </div>
          )}

          {/* ❤️ INTERACTIVE OVERLAY */}
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
        </div>

        {/* METADATA AREA */}
        <div style={contentAreaStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={titleStyle}>{listing.title}</h3>
            <div style={ratingStyle}>
              <Star size={14} fill={theme.colors.charcoal} /> 
              <span style={{ fontWeight: theme.typography.weights.semibold }}>{listing.rating || '4.5'}</span>
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

// --- DESIGN TOKEN STYLES ---
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

/* ============================================================================
 * 🧠 PERFORMANCE MEMOIZATION (Phase 20)
 * ============================================================================
 * Why memo?
 * In Phase 20, we added 'hoveredListingId' to the parent Home.jsx. Without memo,
 * EVERY card in the grid would re-render every time the user moved their 
 * mouse over a card. On a grid of 100 properties, that's 100 renders per frame!
 * 
 * memo() ensures only the specific card being hovered (and the one being un-hovered)
 * will re-render, keeping the UI at a buttery 60fps.
 * ============================================================================ */
export default memo(ListingCard);
