import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Star, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import { theme } from '../../theme';

/**
 * ============================================================================
 * LISTING MAP (V2 - THE SPATIAL HANDSHAKE UPDATE)
 * ============================================================================
 * UPDATED: Implemented reactive marker highlighting.
 * The Map now responds to 'hoveredListingId' from the Grid, providing
 * instant visual orientation across the discovery layer.
 */

// Custom Map Marker Generator
const createCustomMarker = (price, isHighlighted) => {
  const bgColor = isHighlighted ? theme.colors.charcoal : theme.colors.white;
  const textColor = isHighlighted ? theme.colors.white : theme.colors.charcoal;
  const scale = isHighlighted ? 'scale(1.15)' : 'scale(1)';
  const zIndex = isHighlighted ? 1000 : 1;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${bgColor}; 
        color: ${textColor}; 
        font-weight: 800; 
        padding: 0.4rem 0.8rem; 
        border-radius: 20px; 
        box-shadow: ${theme.shadows.md}; 
        border: 1px solid #eee; 
        font-size: 0.95rem; 
        text-align: center;
        transform: ${scale};
        transition: all 0.2s cubic-bezier(0.2, 1, 0.3, 1);
        z-index: ${zIndex};
      ">$${price}</div>
    `,
    iconSize: [60, 30],
    iconAnchor: [30, 15]
  });
};

const ListingMap = ({ listings, hoveredListingId }) => {
  const [selectedListing, setSelectedListing] = useState(null);
  
  const centerPosition = listings.length > 0 && listings[0].coordinates 
    ? [listings[0].coordinates.lat, listings[0].coordinates.lng]
    : [40.7128, -74.0060];

  return (
    <div style={mapContainerStyle}>
      <MapContainer 
        center={centerPosition} zoom={11} style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {listings.map((listing) => {
          // --- LOGIC: Highlight if this is the hovered listing from the grid ---
          const isHighlighted = hoveredListingId === listing._id;

          return listing.coordinates && (
            <Marker
              key={listing._id}
              position={[listing.coordinates.lat, listing.coordinates.lng]}
              icon={createCustomMarker(listing.rate, isHighlighted)}
              eventHandlers={{ click: () => setSelectedListing(listing) }}
            >
              <Popup closeButton={false} offset={[0, -10]} className="custom-popup">
                <div style={popupCardStyle}>
                  <Link to={`/listing/${listing._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <img src={listing.images[0]} style={popupImgStyle} alt="Thumb" />
                    <div style={popupContentStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <h4 style={popupTitleStyle}>{listing.title}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Star size={12} fill="black" /> {listing.rating || '4.5'}
                        </div>
                      </div>
                      <p style={popupLocationStyle}>{listing.location}</p>
                      <p style={popupPriceStyle}><b>${listing.rate}</b> night</p>
                    </div>
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

// --- STYLES ---
const mapContainerStyle = { width: '100%', height: 'calc(100vh - 160px)', minHeight: '500px', borderRadius: '16px', overflow: 'hidden', border: `1px solid ${theme.colors.divider}`, marginTop: '2rem' };
const popupCardStyle = { width: '220px', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', position: 'relative', margin: '-14px -20px -14px -20px' };
const popupImgStyle = { width: '100%', height: '140px', objectFit: 'cover' };
const popupContentStyle = { padding: '0.8rem' };
const popupTitleStyle = { margin: 0, fontSize: '0.9rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: theme.colors.charcoal };
const popupLocationStyle = { margin: '0.2rem 0', fontSize: '0.8rem', color: theme.colors.slate };
const popupPriceStyle = { margin: 0, fontSize: '0.9rem', color: theme.colors.charcoal };

export default ListingMap;
