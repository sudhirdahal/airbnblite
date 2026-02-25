import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../services/api';

const MockPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { listingId, bookingDetails, listing } = location.state || {}; 

  const [cardDetails, setCardDetails] = useState({ cardNumber: '', cardName: '', expiry: '', cvv: '' });
  const [paymentStatus, setPaymentStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!listingId || !bookingDetails || !listing) {
      navigate('/', { replace: true });
    }
  }, [listingId, bookingDetails, listing, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === 'cardNumber') formattedValue = value.replace(/\D/g, '').substring(0, 16);
    else if (name === 'expiry') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
      if (formattedValue.length > 2) formattedValue = formattedValue.substring(0, 2) + '/' + formattedValue.substring(2);
    }
    else if (name === 'cvv') formattedValue = value.replace(/\D/g, '').substring(0, 4);
    setCardDetails(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPaymentStatus('');

    try {
      // 1. Process Mock Payment
      const paymentResponse = await API.post('/payment/process-mock', {
        cardNumber: cardDetails.cardNumber,
        cardName: cardDetails.cardName,
        expiry: cardDetails.expiry,
        cvv: cardDetails.cvv,
        totalAmount: bookingDetails.total 
      });

      if (paymentResponse.data.success) {
        setPaymentStatus('Payment successful! Finalizing booking...');
        
        try {
          // 2. Attempt Actual Booking (This will now fail if dates overlap!)
          await API.post('/bookings', {
            listingId: listingId,
            checkIn: bookingDetails.checkIn,
            checkOut: bookingDetails.checkOut,
            totalPrice: bookingDetails.total
          });
          setPaymentStatus('Booking confirmed! Redirecting...');
          setTimeout(() => navigate('/bookings', { replace: true }), 2000);
        } catch (err) {
          // DISPLAY BACKEND OVERLAP ERROR
          const errorMsg = err.response?.data?.message || 'Payment succeeded, but booking failed.';
          setPaymentStatus(errorMsg);
          console.error('Booking Error:', errorMsg);
        }
      }
    } catch (err) {
      setPaymentStatus(err.response?.data?.message || 'Payment processing failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!listingId || !bookingDetails || !listing) return null;

  return (
    <div style={containerStyle}>
      <div style={formCardStyle}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Complete Your Booking</h2>
        <p style={{ textAlign: 'center', color: '#717171', marginBottom: '1.5rem' }}>
          Booking **{listing.title}** for **${bookingDetails.total}**
        </p>

        <form onSubmit={handleSubmitPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="text" name="cardNumber" placeholder="Card Number" value={cardDetails.cardNumber} onChange={handleInputChange} required style={inputStyle} />
          <input type="text" name="cardName" placeholder="Name on Card" value={cardDetails.cardName} onChange={handleInputChange} required style={inputStyle} />
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input type="text" name="expiry" placeholder="MM/YY" value={cardDetails.expiry} onChange={handleInputChange} required style={{ ...inputStyle, flex: 1 }} />
            <input type="text" name="cvv" placeholder="CVV" value={cardDetails.cvv} onChange={handleInputChange} required style={{ ...inputStyle, flex: 1 }} />
          </div>
          
          {paymentStatus && (
            <div style={{ 
              color: paymentStatus.includes('confirmed') || paymentStatus.includes('successful') ? 'green' : 'red', 
              marginBottom: '1rem', textAlign: 'center', fontWeight: 'bold' 
            }}>
              {paymentStatus}
            </div>
          )}

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Processing...' : `Pay $${bookingDetails.total}`}
          </button>
        </form>
      </div>
    </div>
  );
};

const containerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', padding: '1rem' };
const formCardStyle = { width: '100%', maxWidth: '450px', padding: '2rem', border: '1px solid #ddd', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };
const inputStyle = { padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' };
const buttonStyle = { padding: '1rem', borderRadius: '8px', border: 'none', backgroundColor: '#ff385c', color: 'white', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' };

export default MockPayment;
