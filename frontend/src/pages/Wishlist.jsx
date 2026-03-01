import React, { useState, useEffect } from 'react';
import { Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../services/api';
import PageHeader from '../components/layout/PageHeader';
import ListingCard from '../components/listings/ListingCard';
import { theme } from '../theme'; // --- NEW: THEME AUTHORITY ---

import SkeletonListing from '../components/listings/SkeletonListing';
import { useAuth } from '../context/AuthContext';

/**
 * ============================================================================
 * WISHLIST PAGE (The Dream Collection)
 * ============================================================================
 * OVERHAUL: Refactored to consume the centralized Design Token system.
 * This ensures that saved property grids and empty-state rewards are
 * visually synchronized with the global SaaS identity.
 * 
 * Update: Phase 30: Banned 'Synchronizing...' text in favor of Skeleton UI.
 */
const Wishlist = () => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      const response = await API.get('/auth/wishlist');
      setWishlist(response.data);
    } catch (err) { console.error('Sync Failure'); } finally { setLoading(false); }
  };

  useEffect(() => { fetchWishlist(); }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const handleWishlistUpdate = (updatedIds) => {
    setWishlist(prev => prev.filter(item => updatedIds.includes(item._id)));
  };

  return (
    <div style={{ maxWidth: '2560px', width: '98%', margin: '3rem auto', padding: '0 4rem' }}>
      <PageHeader title="Wishlist" subtitle={loading ? "Synchronizing your dream stays..." : `You have ${wishlist.length} properties saved for future stays.`} icon={Heart} />

      {loading ? (
        <div style={gridContainerStyle}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <SkeletonListing key={i} />)}
        </div>
      ) : wishlist.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={emptyStateStyle}>
          <div style={emptyIconWrapper}><Heart size={48} color={theme.colors.brand} fill={theme.colors.brand} /></div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', fontWeight: theme.typography.weights.extraBold }}>Start your next collection</h2>
          <p style={{ color: theme.colors.slate, marginBottom: '2rem' }}>Click the heart icon on any property to save it here for later.</p>
          <Link to="/" style={exploreBtnStyle}>Browse properties <ArrowRight size={18} /></Link>
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" style={gridContainerStyle}>
          {wishlist.map((listing) => (
            <ListingCard key={listing._id} listing={listing} user={user} onWishlistUpdate={handleWishlistUpdate} />
          ))}
        </motion.div>
      )}
    </div>
  );
};

// --- TOKEN-BASED STYLES ---
const gridContainerStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', columnGap: '1.5rem', rowGap: '2.5rem', padding: '2rem 0' };
const emptyStateStyle = { padding: '10rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', border: `1px solid ${theme.colors.divider}`, borderRadius: theme.radius.lg, backgroundColor: theme.colors.white, boxShadow: theme.shadows.card };
const emptyIconWrapper = { width: '100px', height: '100px', backgroundColor: '#fff1f2', borderRadius: theme.radius.full, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' };
const exploreBtnStyle = { display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1rem 2.5rem', backgroundColor: theme.colors.charcoal, color: theme.colors.white, borderRadius: theme.radius.md, textDecoration: 'none', fontWeight: theme.typography.weights.extraBold };

export default Wishlist;
