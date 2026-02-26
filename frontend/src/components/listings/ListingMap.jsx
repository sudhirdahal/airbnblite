import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet marker icons in React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/**
 * ListingMap Component: Displays properties on an interactive map.
 * UPDATED: Added high-fidelity Popups with property mini-cards.
 */
const ListingMap = ({ listings }) => {
  // Center of the map (Default to a general US view or the first listing)
  const center = listings.length > 0 
    ? [listings[0].coordinates.lat, listings[0].coordinates.lng] 
    : [39.8283, -98.5795];

  return (
    <div style={{ height: 'calc(100vh - 180px)', width: '100%', borderRadius: '12px', overflow: 'hidden', marginTop: '1rem' }}>
      <MapContainer center={center} zoom={listings.length > 0 ? 10 : 4} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {listings.map((listing) => (
          <Marker key={listing._id} position={[listing.coordinates.lat, listing.coordinates.lng]}>
            <Popup minWidth={240} className="custom-map-popup">
              <Link to={`/listing/${listing._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={popupCardStyle}>
                  <img 
                    src={listing.images[0]} 
                    alt={listing.title} 
                    style={popupImageStyle} 
                  />
                  <div style={popupContentStyle}>
                    <div style={popupTitleStyle}>{listing.title}</div>
                    <div style={popupPriceStyle}>
                      <span style={{ fontWeight: '800' }}>${listing.rate}</span> / night
                    </div>
                  </div>
                </div>
              </Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Internal CSS for the popup arrow and styling */}
      <style>{`
        .leaflet-popup-content-wrapper { border-radius: 12px !important; padding: 0 !important; overflow: hidden; }
        .leaflet-popup-content { margin: 0 !important; width: 240px !important; }
        .leaflet-popup-tip-container { display: none; }
      `}</style>
    </div>
  );
};

// --- POPUP MINI-CARD STYLES ---
const popupCardStyle = {
  width: '100%',
  cursor: 'pointer',
};

const popupImageStyle = {
  width: '100%',
  height: '140px',
  objectFit: 'cover',
  display: 'block'
};

const popupContentStyle = {
  padding: '0.8rem',
  backgroundColor: '#fff'
};

const popupTitleStyle = {
  fontSize: '0.9rem',
  fontWeight: '700',
  color: '#222',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  marginBottom: '0.3rem'
};

const popupPriceStyle = {
  fontSize: '0.85rem',
  color: '#222'
};

export default ListingMap;
