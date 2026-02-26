import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Heart, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import API from '../../services/api';
import toast from 'react-hot-toast';

const ListingCard = ({ listing, userRole, onWishlistUpdate, onSearch }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const navigate = useNavigate();
  const placeholderImage = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.wishlist) setIsWishlisted(user.wishlist.includes(listing._id));
  }, [listing._id]);

  const toggleWishlist = async (e) => {
    e.preventDefault(); 
    const token = localStorage.getItem('token');
    if (!token) return toast.error('Please log in to save favorites');
    try {
      const response = await API.post(`/auth/wishlist/${listing._id}`);
      const newStatus = !isWishlisted;
      setIsWishlisted(newStatus);
      const user = JSON.parse(localStorage.getItem('user'));
      user.wishlist = response.data;
      localStorage.setItem('user', JSON.stringify(user));
      if (newStatus) toast.success('Saved!', { icon: '❤️' });
      else toast('Removed', { icon: '🗑️' });
      if (onWishlistUpdate) onWishlistUpdate();
    } catch (err) { toast.error('Could not update wishlist'); }
  };

  const handleLocationClick = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (onSearch) { onSearch({ location: listing.location }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else navigate('/', { state: { searchLocation: listing.location } });
    toast(`Searching in ${listing.location}`, { icon: '🔍' });
  };

  return (
    /* ADDED CLASS: listing-card */
    <motion.div className="listing-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} whileHover={{ y: -5 }} style={{ position: 'relative', width: '300px', margin: '1rem' }}>
      <Link to={`/listing/${listing._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{ borderRadius: '12px', overflow: 'hidden', cursor: 'pointer' }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1' }}>
            <img src={listing.images[0]} alt={listing.title} onError={(e) => e.target.src = placeholderImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button onClick={toggleWishlist} style={wishlistBtnStyle(isWishlisted)}><Heart size={24} fill={isWishlisted ? '#ff385c' : 'rgba(0,0,0,0.3)'} /></button>
          </div>
          <div style={{ padding: '0.8rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: '0', fontSize: '1rem', color: '#333', fontWeight: '600' }}>{listing.title}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.9rem' }}><Star size={14} fill="#000" color="#000" /><span>{listing.rating}</span></div>
            </div>
            <motion.div onClick={handleLocationClick} whileHover={{ color: '#ff385c', x: 2 }} style={locationLinkStyle}><MapPin size={14} /> {listing.location}</motion.div>
            <p style={{ margin: '0.5rem 0', fontWeight: '600', fontSize: '1rem', color: '#333' }}>${listing.rate} <span style={{ fontWeight: 'normal' }}>night</span></p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const wishlistBtnStyle = (active) => ({ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: active ? '#ff385c' : 'rgba(0,0,0,0.5)', filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.3))' });
const locationLinkStyle = { margin: '0.2rem 0', color: '#717171', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', width: 'fit-content', transition: 'color 0.2s' };

export default ListingCard;
