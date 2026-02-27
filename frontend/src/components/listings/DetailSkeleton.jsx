import React from 'react';
import { theme } from '../../theme';

/**
 * ============================================================================
 * DETAIL SKELETON (The High-Fidelity Page Ghost)
 * ============================================================================
 * This component manages the perceived performance of the property page.
 * It mirrors the V18 Cinematic layout to prevent layout jumping when 
 * listing data arrives.
 */
const DetailSkeleton = () => {
  return (
    <div style={containerStyle}>
      {/* --- SHIMMERING TITLE --- */}
      <div style={skeletonTitle}>
        <div className="shimmer-sweep" />
      </div>

      {/* --- SHIMMERING 5-PHOTO GRID --- */}
      <div style={galleryGrid}>
        <div style={mainImage}><div className="shimmer-sweep" /></div>
        <div style={sideGrid}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={sideTile}><div className="shimmer-sweep" /></div>
          ))}
        </div>
      </div>

      <div style={layoutFlex}>
        <div style={{ flex: 2 }}>
          {/* --- CONTENT BLOCKS --- */}
          <div style={skeletonLineFull}><div className="shimmer-sweep" /></div>
          <div style={skeletonLineMed}><div className="shimmer-sweep" /></div>
          
          <div style={divider} />
          
          <div style={skeletonHeader}><div className="shimmer-sweep" /></div>
          <div style={skeletonPara}><div className="shimmer-sweep" /></div>
          <div style={skeletonPara}><div className="shimmer-sweep" /></div>
        </div>

        <div style={{ flex: 1 }}>
          {/* --- SIDEBAR CARD GHOST --- */}
          <div style={sidebarCard}>
            <div className="shimmer-sweep" />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- STYLES ---
const containerStyle = { maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' };
const skeletonTitle = { width: '40%', height: '2.2rem', backgroundColor: '#f0f0f0', borderRadius: '8px', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' };
const galleryGrid = { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.8rem', height: '500px', borderRadius: '20px', overflow: 'hidden', marginBottom: '3rem' };
const mainImage = { width: '100%', height: '100%', backgroundColor: '#f0f0f0', position: 'relative', overflow: 'hidden' };
const sideGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '0.8rem' };
const sideTile = { width: '100%', height: '100%', backgroundColor: '#f0f0f0', position: 'relative', overflow: 'hidden' };
const layoutFlex = { display: 'flex', gap: '5rem' };
const divider = { margin: '2.5rem 0', borderBottom: '1px solid #eee' };
const skeletonHeader = { width: '30%', height: '1.6rem', backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '1rem', position: 'relative', overflow: 'hidden' };
const skeletonPara = { width: '100%', height: '1.1rem', backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '0.8rem', position: 'relative', overflow: 'hidden' };
const skeletonLineFull = { width: '100%', height: '1.2rem', backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '0.5rem', position: 'relative', overflow: 'hidden' };
const skeletonLineMed = { width: '60%', height: '1.2rem', backgroundColor: '#f0f0f0', borderRadius: '4px', position: 'relative', overflow: 'hidden' };
const sidebarCard = { border: '1px solid #eee', height: '400px', borderRadius: '24px', backgroundColor: '#fdfdfd', position: 'relative', overflow: 'hidden', boxShadow: theme.shadows.card };

export default DetailSkeleton;
