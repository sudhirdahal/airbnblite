import React from 'react';
import { theme } from '../../theme';

/**
 * ============================================================================
 * SKELETON TRIP (The Perceived Performance Layer)
 * ============================================================================
 * Logic: Mimics the structure of a TripCard in the Bookings.jsx page.
 * Provides a shimmering 'ghost' to reduce perceived waiting time and 
 * prevent layout shift during travel history synchronization.
 */
const SkeletonTrip = () => {
  return (
    <div style={skeletonContainer}>
      {/* --- SHIMMERING IMAGE BLOCK --- */}
      <div style={skeletonImage}>
        <div className="shimmer-sweep" style={shimmerOverlay} />
      </div>

      <div style={contentArea}>
        {/* --- SHIMMERING TEXT BLOCKS --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={skeletonTitle}>
              <div className="shimmer-sweep" style={shimmerOverlay} />
            </div>
            <div style={skeletonSubtitle}>
              <div className="shimmer-sweep" style={shimmerOverlay} />
            </div>
            <div style={skeletonDate}>
              <div className="shimmer-sweep" style={shimmerOverlay} />
            </div>
          </div>
          <div style={skeletonPrice}>
            <div className="shimmer-sweep" style={shimmerOverlay} />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- STYLES (Synchronized with TripCard) ---
const skeletonContainer = { 
  display: 'flex', 
  gap: '2rem', 
  padding: '1.2rem', 
  border: `1px solid ${theme.colors.divider}`, 
  borderRadius: theme.radius.lg, 
  backgroundColor: theme.colors.white,
  boxShadow: theme.shadows.card,
  width: '100%'
};

const skeletonImage = { 
  width: '220px', 
  height: '150px', 
  borderRadius: '16px', 
  backgroundColor: '#efefef', 
  position: 'relative', 
  overflow: 'hidden',
  flexShrink: 0
};

const contentArea = { 
  flex: 1,
  display: 'flex', 
  flexDirection: 'column', 
  justifyContent: 'center',
  gap: '0.8rem',
  paddingRight: '1rem'
};

const skeletonTitle = { 
  width: '40%', 
  height: '1.4rem', 
  backgroundColor: '#efefef', 
  borderRadius: '6px', 
  position: 'relative', 
  overflow: 'hidden',
  marginBottom: '0.5rem'
};

const skeletonSubtitle = { 
  width: '25%', 
  height: '1rem', 
  backgroundColor: '#efefef', 
  borderRadius: '4px', 
  position: 'relative', 
  overflow: 'hidden',
  marginBottom: '1rem'
};

const skeletonDate = { 
  width: '35%', 
  height: '1.8rem', 
  backgroundColor: '#efefef', 
  borderRadius: '8px', 
  position: 'relative', 
  overflow: 'hidden' 
};

const skeletonPrice = { 
  width: '80px', 
  height: '2rem', 
  backgroundColor: '#efefef', 
  borderRadius: '6px', 
  position: 'relative', 
  overflow: 'hidden' 
};

const shimmerOverlay = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%)',
};

export default SkeletonTrip;
