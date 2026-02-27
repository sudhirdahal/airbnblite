import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Star, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';

/**
 * ============================================================================
 * LISTING MAP (The Interactive Discovery Engine)
 * ============================================================================
 * RESTORED LEAFLET IMPLEMENTATION: Switched back to react-leaflet to prevent 
 * Mapbox token errors while keeping the high-fidelity UI popup logic.
 */

// Custom Map Marker using Leaflet DivIcon
const createCustomMarker = (price) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `<div style="background-color: white; color: black; font-weight: 800; padding: 0.4rem 0.8rem; border-radius: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.15); border: 1px solid #eee; font-size: 0.9rem; text-align: center;">$${price}</div>`,
    iconSize: [60, 30],
    iconAnchor: [30, 30] // Centered
  });
};

const ListingMap = ({ listings }) => {
  const [selectedListing, setSelectedListing] = useState(null);
  
  // Default to New York if no listings, otherwise center on the first listing
  const centerPosition = listings.length > 0 && listings[0].coordinates 
    ? [listings[0].coordinates.lat, listings[0].coordinates.lng]
    : [40.7128, -74.0060];

  return (
    <div style={mapContainerStyle}>
      <MapContainer 
        center={centerPosition} 
        zoom={11} 
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {listings.map((listing) => (
          listing.coordinates && (
            <Marker
              key={listing._id}
              position={[listing.coordinates.lat, listing.coordinates.lng]}
              icon={createCustomMarker(listing.rate)}
              eventHandlers={{
                click: () => {
                  setSelectedListing(listing);
                },
              }}
            >
              <Popup closeButton={false} offset={[0, -20]} className="custom-popup">
                {/* --- INTERACTIVE POPUP CARD --- */}
                <div style={popupCardStyle}>
                  <Link to={`/listing/${listing._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <img src={listing.images[0]} style={popupImgStyle} alt="Thumb" />
                    <div style={popupContentStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <h4 style={popupTitleStyle}>{listing.title}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Star size={12} fill="black" /> {listing.rating || 'New'}
                        </div>
                      </div>
                      <p style={popupLocationStyle}>{listing.location}</p>
                      <p style={popupPriceStyle}><b>${listing.rate}</b> night</p>
                    </div>
                  </Link>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
};

// --- PREMIUM MAP STYLES ---
const mapContainerStyle = { width: '100%', height: 'calc(100vh - 160px)', minHeight: '500px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #ddd', marginTop: '2rem' };
const popupCardStyle = { width: '220px', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', position: 'relative', margin: '-14px -20px -14px -20px' };
const popupImgStyle = { width: '100%', height: '140px', objectFit: 'cover' };
const popupContentStyle = { padding: '0.8rem' };
const popupTitleStyle = { margin: 0, fontSize: '0.9rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#222' };
const popupLocationStyle = { margin: '0.2rem 0', fontSize: '0.8rem', color: '#717171' };
const popupPriceStyle = { margin: 0, fontSize: '0.9rem', color: '#222' };

export default ListingMap;
