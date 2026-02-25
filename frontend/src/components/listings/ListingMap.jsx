import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import L from 'leaflet';

// Fix for default marker icons in Leaflet + React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const ListingMap = ({ listings }) => {
  // Filter out listings that don't have valid coordinates to prevent map crashes
  const validListings = listings.filter(l => 
    l.coordinates && 
    typeof l.coordinates.lat === 'number' && 
    typeof l.coordinates.lng === 'number'
  );

  // Center map on the first valid listing or a default global location
  const center = validListings.length > 0 
    ? [validListings[0].coordinates.lat, validListings[0].coordinates.lng] 
    : [20, 0]; 

  return (
    <div style={{ height: '85vh', width: '100%', overflow: 'hidden' }}>
      <MapContainer center={center} zoom={3} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validListings.map((listing) => (
          <Marker key={listing._id} position={[listing.coordinates.lat, listing.coordinates.lng]}>
            <Popup>
              <div style={{ width: '150px' }}>
                <img src={listing.images[0]} alt={listing.title} style={{ width: '100%', borderRadius: '4px' }} />
                <h4 style={{ margin: '0.5rem 0 0.2rem' }}>{listing.title}</h4>
                <p style={{ margin: '0', fontWeight: 'bold' }}>${listing.rate} / night</p>
                <Link to={`/listing/${listing._id}`} style={{ color: '#ff385c', fontSize: '0.8rem', fontWeight: 'bold' }}>View Details</Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default ListingMap;
