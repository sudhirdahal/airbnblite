import React from 'react';
import ListingCard from './ListingCard';
import SkeletonListing from './SkeletonListing';

/**
 * ListingGrid Component: Manages the responsive grid of property cards.
 */
const ListingGrid = ({ listings, userRole, onWishlistUpdate, onSearch, loading }) => {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', padding: '1rem 0' }}>
        {[...Array(8)].map((_, i) => <SkeletonListing key={i} />)}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', padding: '1rem 0' }}>
      {listings.length === 0 ? (
        <div style={{ padding: '3rem', width: '100%', textAlign: 'center', color: '#717171' }}>
          No properties found matching your search.
        </div>
      ) : (
        listings.map((listing) => (
          <ListingCard 
            key={listing._id} 
            listing={listing} 
            userRole={userRole} 
            onWishlistUpdate={onWishlistUpdate} 
            onSearch={onSearch} // --- NEW: Pass onSearch ---
          />
        ))
      )}
    </div>
  );
};

export default ListingGrid;
