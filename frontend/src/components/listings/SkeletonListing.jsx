import React from 'react';

/**
 * SkeletonListing: A pulsing placeholder component.
 * Used to maintain layout and visual interest while data is fetching.
 */
const SkeletonListing = () => {
  return (
    <div style={{ width: '300px', margin: '1rem', animation: 'pulse 1.5s infinite' }}>
      {/* Pulse Animation Definition */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>

      {/* Placeholder Image Box */}
      <div style={{ width: '100%', aspectRatio: '1/1', backgroundColor: '#eee', borderRadius: '12px', marginBottom: '0.8rem' }} />
      
      {/* Placeholder Title Line */}
      <div style={{ width: '70%', height: '1.2rem', backgroundColor: '#eee', borderRadius: '4px', marginBottom: '0.5rem' }} />
      
      {/* Placeholder Subtitle Line */}
      <div style={{ width: '40%', height: '1rem', backgroundColor: '#eee', borderRadius: '4px', marginBottom: '0.5rem' }} />
      
      {/* Placeholder Price Line */}
      <div style={{ width: '30%', height: '1.2rem', backgroundColor: '#eee', borderRadius: '4px' }} />
    </div>
  );
};

export default SkeletonListing;
