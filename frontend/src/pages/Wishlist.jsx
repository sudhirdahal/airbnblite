import React, { useState, useEffect } from 'react';
import { Heart, MapPin, Search, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../services/api';
import PageHeader from '../components/layout/PageHeader';
import ListingCard from '../components/listings/ListingCard';

/**
 * ============================================================================
 * WISHLIST PAGE (The Dream Collection)
 * ============================================================================
 * This component manages the retrieval and display of user-saved properties.
 * It has evolved from a simple list into a high-fidelity discovery grid
 * featuring staggered entrance animations and cinematic empty states.
 */
const Wishlist = ({ user }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * WISHLIST SYNC ENGINE
   * Fetches the user's saved properties from the backend.
   */
  const fetchWishlist = async () => {
    try {
      const response = await API.get('/auth/wishlist');
      setWishlist(response.data);
    } catch (err) {
      console.error('Wishlist Sync Failure:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  /**
   * ANIMATION VARIANTS (Framer Motion)
   * Orchestrates the sequenced 'Cascading' entrance of saved cards.
   */
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1 // 100ms delay between each card for premium feel
      }
    }
  };

  /**
   * OPTIMISTIC UI REMOVAL
   * When a user un-hearts a property, we filter it out of the state 
   * instantly to maintain a snappy, responsive feel.
   */
  const handleWishlistUpdate = (updatedIds) => {
    setWishlist(prev => prev.filter(item => updatedIds.includes(item._id)));
  };

  /* --- HISTORICAL STAGE 1: PRIMITIVE LIST ---
   * return (
   *   <div>
   *     <h1>Saved Stays</h1>
   *     {wishlist.map(l => <ListingCard listing={l} />)}
   *   </div>
   * );
   */

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Syncing your collections...</div>;

  return (
    <div style={{ maxWidth: '2560px', width: '98%', margin: '3rem auto', padding: '0 2rem' }}>
      <PageHeader 
        title="Wishlist" 
        subtitle={`You have ${wishlist.length} properties saved for future inspiration.`} 
        icon={Heart} 
      />

      {wishlist.length === 0 ? (
        /* --- HIGH-FIDELITY EMPTY STATE --- */
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={emptyStateStyle}>
          <div style={emptyIconWrapper}>
            <Heart size={48} color="#ff385c" fill="#ff385c" />
          </div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Start your next collection</h2>
          <p style={{ color: '#717171', marginBottom: '2rem' }}>Click the heart icon on any property to save it here for later.</p>
          <Link to="/" style={exploreBtnStyle}>
            Browse properties <ArrowRight size={18} />
          </Link>
        </motion.div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={gridContainerStyle}
        >
          {wishlist.map((listing) => (
            <ListingCard 
              key={listing._id} 
              listing={listing} 
              user={user}
              onWishlistUpdate={handleWishlistUpdate}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
};

// --- PREMIUM VISUAL STYLES ---
const gridContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  columnGap: '1.5rem',
  rowGap: '2.5rem',
  padding: '2rem 0'
};

const emptyStateStyle = {
  padding: '10rem 2rem',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid #eee',
  borderRadius: '32px',
  backgroundColor: '#fff',
  boxShadow: '0 8px 30px rgba(0,0,0,0.02)'
};

const emptyIconWrapper = {
  width: '100px',
  height: '100px',
  backgroundColor: '#fff1f2',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '2rem'
};

const exploreBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.8rem',
  padding: '1rem 2.5rem',
  backgroundColor: '#222',
  color: 'white',
  borderRadius: '12px',
  textDecoration: 'none',
  fontWeight: '800',
  transition: 'transform 0.2s',
  cursor: 'pointer'
};

export default Wishlist;
