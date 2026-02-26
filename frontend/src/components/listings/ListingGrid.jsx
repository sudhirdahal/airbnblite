import React from 'react';
import ListingCard from './ListingCard';
import SkeletonListing from './SkeletonListing';

const ListingGrid = ({ listings, userRole, onWishlistUpdate, onSearch, loading }) => {
  if (loading) {
    return (
      /* ADDED CLASS: listing-grid */
      <div className="listing-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', padding: '1rem 0' }}>
        {[...Array(8)].map((_, i) => <SkeletonListing key={i} />)}
      </div>
    );
  }

  return (
    /* ADDED CLASS: listing-grid */
    <div className="listing-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', padding: '1rem 0' }}>
      {listings.length === 0 ? (
        <div style={{ padding: '3rem', width: '100%', textAlign: 'center', color: '#717171' }}>No properties found.</div>
      ) : (
        listings.map((listing) => (
          <ListingCard key={listing._id} listing={listing} userRole={userRole} onWishlistUpdate={onWishlistUpdate} onSearch={onSearch} />
        ))
      )}
    </div>
  );
};

export default ListingGrid;
