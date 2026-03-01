import React from 'react';
import ListingCard from './ListingCard';
import SkeletonListing from './SkeletonListing';
import { motion } from 'framer-motion';
import { SearchX } from 'lucide-react';
import { useResponsive } from '../../hooks/useResponsive';

/**
 * ============================================================================
 * 🗺️ LISTING GRID (The Discovery Hub)
 * ============================================================================
 * 
 * MASTERCLASS NOTES:
 * The Listing Grid acts as the layout orchestrator. It manages three 
 * distinct states of discovery:
 * 1. The Hydration State (Rendering Skeleton Pulse Loaders).
 * 2. The Empty State (Handling zero results with professional illustrations).
 * 3. The Active State (Rendering memoized action cards with staggered entry).
 * 
 * Evolution Timeline:
 * - Phase 1: Simple flexbox list.
 * - Phase 10: CSS Grid auto-fill implementation (High-density responsive layout).
 * - Phase 20: The "Spatial Handshake" (Hover state coordination with the Map).
 */

const ListingGrid = ({ 
  listings, 
  loading, 
  userRole, 
  onSearch, 
  user, 
  onWishlistUpdate, 
  onHoverListing 
}) => {
  const { isMobile } = useResponsive();
  
  // FRAMER MOTION: Staggered orchestration logic
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 } // Staggers card entrance for a cinematic feel
    }
  };

  /**
   * 1. HYDRATION STATE (Phase 15)
   * We render 12 'ghost' listings while waiting for the API. 
   * This preserves the visual rhythm of the page and prevents layout shift.
   */
  if (loading) {
    return (
      <div style={gridContainerStyle}>
        {[...Array(12)].map((_, i) => (<SkeletonListing key={i} />))}
      </div>
    );
  }

  /**
   * 2. EMPTY STATE HANDLER
   * If the user's filters (like 'Price' or 'Amenities') return zero results,
   * we provide actionable feedback instead of a blank screen.
   */
  if (listings.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={emptyStateStyle}>
        <SearchX size={48} color="#717171" />
        <h2 style={{ marginTop: '1rem' }}>No properties found</h2>
        <p style={{ color: '#717171' }}>Try adjusting your filters to find your next stay.</p>
      </motion.div>
    );
  }

  /**
   * 3. ACTIVE GRID
   * Logic: Stretches to fill the available space while maintaining card size.
   */
  return (
    <div style={pagePaddingContainer(isMobile)}>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={gridContainerStyle(isMobile)}
      >
        {listings.map((listing) => (
          <ListingCard 
            key={listing._id} 
            listing={listing} 
            userRole={userRole} 
            user={user}
            onWishlistUpdate={onWishlistUpdate}
            
            // --- THE SPATIAL HANDSHAKE (Phase 20) ---
            // When a user hovers over a card, we bubble the ID up to the parent.
            // Home.jsx then passes this ID to the Map component, which 
            // highlights the corresponding marker instantly.
            onHover={() => onHoverListing && onHoverListing(listing._id)}
            onLeave={() => onHoverListing && onHoverListing(null)}
          />
        ))}
      </motion.div>
    </div>
  );
};

// --- DESIGN TOKEN STYLES ---
const pagePaddingContainer = (isMobile) => ({ padding: isMobile ? '0 1.5rem' : '0 4rem', maxWidth: '2560px', margin: '0 auto', width: '100%' });

// RESPONSIVE GRID LOGIC (Phase 46):
// We adjust the min-width from 300px to 250px on mobile to allow for 2 columns on small screens.
const gridContainerStyle = (isMobile) => ({ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '250px' : '300px'}, 1fr))`, columnGap: '1.5rem', rowGap: isMobile ? '1.5rem' : '2.5rem', marginTop: '2rem', marginBottom: '5rem', width: '100%' });

const emptyStateStyle = { padding: '10rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };

export default ListingGrid;
