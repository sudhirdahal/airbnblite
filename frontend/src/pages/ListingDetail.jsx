import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, MapPin, CheckCircle, ChevronLeft, ChevronRight, X, Grid } from 'lucide-react';
import API from '../services/api'; 

/**
 * ============================================================================
 * LISTING DETAIL (V17 - SURVIVAL DIAGNOSTIC VERSION)
 * ============================================================================
 * GOAL: Restore visibility by removing all complex dependencies.
 * If this page shows a GREEN BANNER, it means the React tree is healthy.
 */
const ListingDetail = ({ user }) => { 
  const { id } = useParams(); 
  const navigate = useNavigate(); 

  const [listing, setListing] = useState(null);       
  const [loading, setLoading] = useState(true);       
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/listings/${id}`);
        setListing(res.data);
      } catch (err) {
        setError("API Connection Failed");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div style={{padding: '5rem', textAlign: 'center'}}><h1>Loading...</h1></div>;
  if (error || !listing) return <div style={{padding: '5rem', textAlign: 'center'}}><h1>Error: {error}</h1><Link to="/">Go Home</Link></div>;

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#fff', color: '#000' }}>
      
      {/* VISUAL CONFIRMATION BANNER */}
      <div style={{ backgroundColor: '#16a34a', color: '#fff', padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>
        DIAGNOSTIC MODE: ListingDetail Mounted Successfully
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{listing.title}</h1>
        <p style={{ fontSize: '1.2rem', color: '#717171', marginBottom: '2rem' }}>{listing.location}</p>

        {/* RAW IMAGE DISPLAY */}
        <div style={{ width: '100%', height: '500px', backgroundColor: '#eee', borderRadius: '12px', overflow: 'hidden' }}>
          {listing.images && listing.images[0] ? (
            <img src={listing.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Listing" />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>No Photo Data Found</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '4rem', marginTop: '3rem' }}>
          <div style={{ flex: 2 }}>
            <h2 style={{ borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>Property Description</h2>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.6', marginTop: '1rem' }}>{listing.fullDescription || listing.description}</p>
            
            <div style={{ marginTop: '2rem' }}>
              <h3>Price: ${listing.rate} / night</h3>
              <button 
                onClick={() => navigate('/pay', { state: { listingId: id, bookingDetails: { total: listing.rate, nights: 1, guests: {adults: 1, children: 0} }, listing }})}
                style={{ padding: '1rem 2rem', backgroundColor: '#ff385c', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '1rem' }}
              >
                Go to Payment
              </button>
            </div>
          </div>
          
          <div style={{ flex: 1, backgroundColor: '#f9f9f9', padding: '2rem', borderRadius: '12px', height: 'fit-content' }}>
            <h3>Quick Details</h3>
            <p>Max Guests: {listing.maxGuests || 2}</p>
            <p>Rating: {listing.rating || 'New'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;
