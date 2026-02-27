import React from 'react';
import ListingCard from './ListingCard';
import SkeletonListing from './SkeletonListing';
import { motion } from 'framer-motion';
import { SearchX } from 'lucide-react';

/**
 * ============================================================================
 * LISTING GRID (The High-Fidelity Discovery Engine)
 * ============================================================================
 * OVERHAUL: Forced strict responsive columns.
 * Prevents the 'Single Column Blowup' bug by ensuring images are never 
 * wider than their designated grid cell.
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
        {[...Array(12)].map((_, i) => (
          <SkeletonListing key={i} />
        ))}
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
    <div style={{ padding: '0 4rem', maxWidth: '2560px', margin: '0 auto' }}>
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
const gridContainerStyle = {
  display: 'grid',
  /**
   * THE FIX: auto-fill + minmax(280px). 
   * This creates 4-6 columns on desktop and 1-2 on mobile.
   * Gap: 40px vertical, 24px horizontal.
   */
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
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
  justifyContent: 'center',
  border: '1px solid #eee',
  borderRadius: '24px',
  margin: '2rem 4rem'
};

export default ListingGrid;
