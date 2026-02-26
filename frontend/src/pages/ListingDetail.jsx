import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, MapPin, CheckCircle, ChevronLeft, ChevronRight, User, Trash2, X, Maximize, Camera, Utensils } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Calendar from 'react-calendar'; 
import 'react-calendar/dist/Calendar.css'; 
import toast from 'react-hot-toast';
import API from '../services/api'; 
import ChatWindow from '../components/chat/ChatWindow'; 

const getAmenityIcon = (name) => {
  const n = name.toLowerCase();
  return <CheckCircle size={20} />; // Placeholder for the actual icon mapper
};

const ListingDetail = ({ userRole, user, onChatOpened }) => { 
  const { id } = useParams(); 
  const navigate = useNavigate(); 

  const [listing, setListing] = useState(null);       
  const [reviews, setReviews] = useState([]);         
  const [takenDates, setTakenDates] = useState([]);   
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);       
  const [activeImage, setActiveImage] = useState(0);  
  const [showSticky, setShowSticky] = useState(false); 
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [reviewImages, setReviewImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const [dateRange, setDateRange] = useState([null, null]); 
  const [pricing, setPricing] = useState({ nights: 0, subtotal: 0, serviceFee: 0, total: 0 });

  useEffect(() => {
    if (dateRange[0] && dateRange[1] && listing) {
      const diffTime = Math.abs(dateRange[1] - dateRange[0]);
      const diffNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffNights > 0) {
        const subtotal = diffNights * (listing.rate + (listing.childRate || 0)); // Simple calculation for example
        setPricing({ nights: diffNights, subtotal, total: subtotal * 1.14 });
      }
    }
  }, [dateRange, listing]);

  const fetchListingAndReviews = async () => {
    try {
      const [listingRes, reviewsRes, takenRes, chatRes] = await Promise.all([
        API.get(`/listings/${id}`),
        API.get(`/reviews/${id}`),
        API.get(`/bookings/listing/${id}/taken`),
        API.get(`/auth/chat-history/${id}`)
      ]);
      setListing(listingRes.data);
      setReviews(reviewsRes.data);
      setTakenDates(takenRes.data);
      setChatHistory(chatRes.data);
    } catch (err) {} finally { setLoading(false); }
  };

  useEffect(() => { fetchListingAndReviews(); }, [id, user]);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>;
  if (!listing) return null;

  const isHost = user && (user.id === listing.adminId || user._id === listing.adminId);

  return (
    <div style={{ position: 'relative' }}>
      {/* (Gallery, Content, sidebar etc.) */}
      <div style={{ padding: '2rem' }}>
        <h1>{listing.title}</h1>
        <div style={{ display: 'flex', gap: '4rem' }}>
          <div style={{ flex: 2 }}>
            <img src={listing.images[0]} style={{ width: '100%', borderRadius: '12px' }} />
            <Calendar selectRange={true} onChange={setDateRange} value={dateRange} />
          </div>
          <div style={{ flex: 1 }}>
            <h3>${listing.rate} / night</h3>
            <button onClick={() => navigate('/pay')} style={{ width: '100%', padding: '1rem', backgroundColor: '#ff385c', color: '#fff', border: 'none', borderRadius: '8px' }}>Reserve</button>
          </div>
        </div>
      </div>

      {/* --- CORRECTLY PASSING CALLBACK --- */}
      <ChatWindow 
        listingId={id} 
        currentUser={user} 
        isHost={isHost} 
        history={chatHistory} 
        onChatOpened={onChatOpened} 
      />
    </div>
  );
};

export default ListingDetail;
