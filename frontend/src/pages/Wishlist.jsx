import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react'; // --- NEW: Icon Import ---
import ListingGrid from '../components/listings/ListingGrid';
import API from '../services/api';
import PageHeader from '../components/layout/PageHeader'; // --- NEW: Page Header Import ---

/**
 * Wishlist Page: Displays properties the user has "loved".
 * Now features a high-fidelity page header.
 */
const Wishlist = ({ user }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      const response = await API.get('/auth/wishlist');
      setWishlistItems(response.data);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading your favorites...</div>;

  return (
    <div style={{ maxWidth: '2560px', width: '98%', margin: '3rem auto', padding: '0 2rem' }}>
      {/* --- NEW: Professional Page Header --- */}
      <PageHeader 
        title="Your Wishlist" 
        subtitle={`You have ${wishlistItems.length} properties saved for later.`} 
        icon={Heart}
      />

      {/* --- OLD CODE (Preserved) ---
      <h1 style={{ marginBottom: '2rem' }}>Wishlist</h1>
      */}
      
      {wishlistItems.length === 0 ? (
        <div style={{ padding: '3rem', border: '1px solid #eee', borderRadius: '16px', textAlign: 'center', backgroundColor: '#fafafa' }}>
          <Heart size={48} color="#ddd" style={{ marginBottom: '1rem' }} />
          <h2>Create your first wishlist</h2>
          <p style={{ color: '#717171' }}>As you search, click the heart icon to save your favorite places.</p>
        </div>
      ) : (
        <ListingGrid 
          listings={wishlistItems} 
          userRole={user?.role} 
          onWishlistUpdate={fetchWishlist} 
        />
      )}
    </div>
  );
};

export default Wishlist;
