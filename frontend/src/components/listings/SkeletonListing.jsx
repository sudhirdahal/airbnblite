import React from 'react';
import { motion } from 'framer-motion';

/**
 * ============================================================================
 * SKELETON LISTING (High-Fidelity V2)
 * ============================================================================
 * This component handles 'Perceived Performance'. 
 * Instead of showing a blank screen, we show an animated ghost of the UI.
 * UPDATED: Added a professional shimmer animation using linear gradients.
 */
const SkeletonListing = () => {
  return (
    <div style={skeletonContainer}>
      {/* --- SHIMMERING IMAGE BLOCK --- */}
      <div style={skeletonImage}>
        <div className="shimmer-sweep" style={shimmerOverlay} />
      </div>

      <div style={contentArea}>
        {/* --- SHIMMERING TEXT BLOCKS --- */}
        <div style={skeletonTitle}>
          <div className="shimmer-sweep" style={shimmerOverlay} />
        </div>
        <div style={skeletonSubtitle}>
          <div className="shimmer-sweep" style={shimmerOverlay} />
        </div>
        <div style={skeletonPrice}>
          <div className="shimmer-sweep" style={shimmerOverlay} />
        </div>
      </div>
    </div>
  );
};

// --- PREMIUM SHIMMER STYLES ---
const skeletonContainer = { display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%' };

const skeletonImage = { 
  width: '100%', 
  aspectRatio: '20 / 19', // MATCHES THE REAL CARD PROPORTIONS
  borderRadius: '12px', 
  backgroundColor: '#efefef', 
  position: 'relative', 
  overflow: 'hidden' 
};

const contentArea = { display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.2rem 0' };

const skeletonTitle = { 
  width: '70%', 
  height: '1.2rem', 
  backgroundColor: '#efefef', 
  borderRadius: '4px', 
  position: 'relative', 
  overflow: 'hidden' 
};

const skeletonSubtitle = { 
  width: '40%', 
  height: '1rem', 
  backgroundColor: '#efefef', 
  borderRadius: '4px', 
  position: 'relative', 
  overflow: 'hidden' 
};

const skeletonPrice = { 
  width: '30%', 
  height: '1.2rem', 
  marginTop: '0.2rem', 
  backgroundColor: '#efefef', 
  borderRadius: '4px', 
  position: 'relative', 
  overflow: 'hidden' 
};

/**
 * THE SHIMMER EFFECT
 * This overlay moves from left to right, creating the 'Alive' pulsing look.
 * Keyframes are defined in index.css.
 */
const shimmerOverlay = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%)',
  animation: 'shimmer 1.8s infinite'
};

export default SkeletonListing;
