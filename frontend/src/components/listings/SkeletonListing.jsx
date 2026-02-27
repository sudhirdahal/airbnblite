import React from 'react';

/**
 * ============================================================================
 * SKELETON LISTING (The Perceived Performance Layer)
 * ============================================================================
 * This component manages the 'Loading State' of the discovery grid.
 * 
 * Logic: 
 * Instead of showing a blank screen or a generic spinning wheel, we render 
 * a structural 'ghost' of the upcoming content. This reduces the user's 
 * perceived waiting time and prevents jarring layout shifts when the 
 * actual data finally arrives.
 * 
 * UI Polish: Utilizes a CSS 'Shimmer' animation (defined in index.css) 
 * to make the app feel alive and actively working.
 */
const SkeletonListing = () => {
  /* --- HISTORICAL STAGE 1: STATIC TEXT ---
   * return <div>Loading property...</div>;
   * // Problem: Looked amateur and caused massive layout jumping.
   */

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
const skeletonContainer = { 
  display: 'flex', 
  flexDirection: 'column', 
  gap: '0.8rem', 
  width: '100%' 
};

/**
 * PROPORTION LOCK
 * It is critical that the skeleton matches the exact aspect ratio 
 * (20/19) of the final ListingCard. If it doesn't, the page will 
 * physically 'jump' when the real image loads.
 */
const skeletonImage = { 
  width: '100%', 
  aspectRatio: '20 / 19', 
  borderRadius: '12px', 
  backgroundColor: '#efefef', 
  position: 'relative', 
  overflow: 'hidden' 
};

const contentArea = { 
  display: 'flex', 
  flexDirection: 'column', 
  gap: '0.5rem', 
  padding: '0.2rem 0' 
};

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

const shimmerOverlay = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%)',
  // animation: 'shimmer 1.8s infinite' is handled globally in index.css
};

export default SkeletonListing;
