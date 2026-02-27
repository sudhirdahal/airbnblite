import React, { useState } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Star, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN; // SECURITY: Use environment variables for secrets

/**
 * ============================================================================
 * LISTING MAP (The Interactive Discovery Engine)
 * ============================================================================
 * This component manages the spatial discovery of properties.
 * It has evolved from a simple marker-only view to an interactive experience
 * featuring smart popups and deep-linking.
 */
const ListingMap = ({ listings }) => {
  const [selectedListing, setSelectedListing] = useState(null);
  const [viewState, setViewState] = useState({
    latitude: 40.7128, // Default to NYC
    longitude: -74.0060,
    zoom: 11
  });

  /* --- HISTORICAL STAGE 1: PRIMITIVE MARKERS ---
   * return (
   *   <Map ...>
   *     {listings.map(l => <Marker key={l._id} latitude={l.coordinates.lat} longitude={l.coordinates.lng} />)}
   *   </Map>
   * );
   */

  return (
    <div style={mapContainerStyle}>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <FullscreenControl position="top-left" />
        <NavigationControl position="top-left" />

        {listings.map((listing) => (
          <Marker
            key={listing._id}
            latitude={listing.coordinates?.lat || 0}
            longitude={listing.coordinates?.lng || 0}
            anchor="bottom"
            onClick={e => { e.originalEvent.stopPropagation(); setSelectedListing(listing); }}
          >
            {/* --- HIGH-FIDELITY PRICE TAG MARKER --- */}
            <motion.div whileHover={{ scale: 1.1 }} style={markerTagStyle}>
              ${listing.rate}
            </motion.div>
          </Marker>
        ))}

        <AnimatePresence>
          {selectedListing && (
            <Popup
              latitude={selectedListing.coordinates?.lat}
              longitude={selectedListing.coordinates?.lng}
              anchor="top"
              onClose={() => setSelectedListing(null)}
              closeButton={false}
              maxWidth="300px"
            >
              {/* --- INTERACTIVE POPUP CARD --- */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={popupCardStyle}>
                <Link to={`/listing/${selectedListing._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <img src={selectedListing.images[0]} style={popupImgStyle} alt="Thumb" />
                  <div style={popupContentStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <h4 style={popupTitleStyle}>{selectedListing.title}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Star size={12} fill="black" /> {selectedListing.rating || 'New'}
                      </div>
                    </div>
                    <p style={popupLocationStyle}>{selectedListing.location}</p>
                    <p style={popupPriceStyle}><b>${selectedListing.rate}</b> night</p>
                  </div>
                </Link>
                <button onClick={() => setSelectedListing(null)} style={closePopupBtn}><X size={14} /></button>
              </motion.div>
            </Popup>
          )}
        </AnimatePresence>
      </Map>
    </div>
  );
};

// --- PREMIUM MAP STYLES ---
const mapContainerStyle = { width: '100%', height: 'calc(100vh - 160px)', minHeight: '500px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #ddd', marginTop: '2rem' };
const markerTagStyle = { backgroundColor: 'white', color: 'black', fontWeight: '800', padding: '0.4rem 0.8rem', borderRadius: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.15)', cursor: 'pointer', border: '1px solid #eee', fontSize: '0.9rem' };
const popupCardStyle = { width: '220px', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', position: 'relative' };
const popupImgStyle = { width: '100%', height: '140px', objectFit: 'cover' };
const popupContentStyle = { padding: '0.8rem' };
const popupTitleStyle = { margin: 0, fontSize: '0.9rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const popupLocationStyle = { margin: '0.2rem 0', fontSize: '0.8rem', color: '#717171' };
const popupPriceStyle = { margin: 0, fontSize: '0.9rem', color: '#222' };
const closePopupBtn = { position: 'absolute', top: '8px', right: '8px', backgroundColor: 'white', border: 'none', borderRadius: '50%', padding: '0.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' };

export default ListingMap;
