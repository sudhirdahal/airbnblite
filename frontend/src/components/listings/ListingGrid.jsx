import React from 'react';
import ListingCard from './ListingCard';
import SkeletonListing from './SkeletonListing';
import { motion } from 'framer-motion';
import { SearchX } from 'lucide-react';

/**
 * ============================================================================
 * LISTING GRID (The High-Fidelity Discovery Engine)
 * ============================================================================
 * FIX: Controlled Grid Proportions.
 * Instead of '1fr', we use '1fr' with a max-column count to prevent 
 * single listings from stretching to the full width of the monitor.
 */
const ListingGrid = ({ listings, loading, userRole, onSearch, user, onWishlistUpdate }) => {
  
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  if (loading) {
    return (
      <div style={gridContainerStyle}>
        {[...Array(12)].map((_, i) => (<SkeletonListing key={i} />))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={emptyStateStyle}>
        <SearchX size={48} color="#717171" />
        <h2 style={{ marginTop: '1rem' }}>No properties found</h2>
        <p style={{ color: '#717171' }}>Try adjusting your filters to find your next stay.</p>
      </motion.div>
    );
  }

  return (
    <div style={pagePaddingContainer}>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={gridContainerStyle}
      >
        {listings.map((listing) => (
          <ListingCard 
            key={listing._id} 
            listing={listing} 
            userRole={userRole} 
            user={user}
            onWishlistUpdate={onWishlistUpdate}
          />
        ))}
      </motion.div>
    </div>
  );
};

// --- PREMIUM GRID STYLES ---
const pagePaddingContainer = {
  padding: '0 4rem', 
  maxWidth: '2560px', 
  margin: '0 auto',
  width: '100%'
};

const gridContainerStyle = {
  display: 'grid',
  /**
   * THE PROPORTION FIX:
   * We use a responsive column count. 
   * Desktop: 4 columns
   * Laptop: 3 columns
   * Tablet: 2 columns
   * Mobile: 1 column
   * This prevents '1fr' from blowing up images when only 1 listing exists.
   */
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  columnGap: '1.5rem',
  rowGap: '2.5rem',
  marginTop: '2rem',
  marginBottom: '5rem',
  width: '100%'
};

const emptyStateStyle = {
  padding: '10rem 2rem',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center'
};

export default ListingGrid;
