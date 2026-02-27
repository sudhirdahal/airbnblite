import React from 'react';
import { motion } from 'framer-motion';
import { 
  Waves, Castle, Palmtree, Mountain, Tent, 
  Flame, Snowflake, Landmark, Trees, Warehouse 
} from 'lucide-react';

/**
 * ============================================================================
 * 🏊 CATEGORY BAR (The Thematic Filter)
 * ============================================================================
 * 
 * MASTERCLASS NOTES:
 * This component handles thematic discovery. It allows users to filter the 
 * entire database based on property "Vibe" rather than just location.
 * 
 * Logic: Toggles the 'activeCategory' state in App.jsx, which triggers
 * an immediate re-fetch of filtered results from the backend.
 * 
 * Evolution Timeline:
 * - Phase 1: Simple list of text buttons.
 * - Phase 14: Transition to Iconography-driven navigation.
 * - Phase 21: High-Fidelity Shared Layout Animations (Spring-loaded underline).
 */

/* ============================================================================
 * 👻 HISTORICAL GHOST: PHASE 1 (The Text List)
 * ============================================================================
 * return (
 *   <div style={{ display: 'flex' }}>
 *     <button onClick={() => onSelect('pools')}>Pools</button>
 *     <button onClick={() => onSelect('beach')}>Beach</button>
 *   </div>
 * );
 * 
 * THE FLAW: It felt like a generic web form. It lacked the visual "vibe" 
 * that users expect from a travel platform.
 * ============================================================================ */

const CategoryBar = ({ activeCategory, onSelect }) => {
  
  // THEMATIC DATASET
  const categories = [
    { id: 'pools', label: 'Amazing pools', icon: Waves },
    { id: 'beach', label: 'Beachfront', icon: Palmtree },
    { id: 'cabins', label: 'Cabins', icon: Landmark },
    { id: 'arctic', label: 'Arctic', icon: Snowflake },
    { id: 'castles', label: 'Castles', icon: Castle },
    { id: 'camping', label: 'Camping', icon: Tent },
    { id: 'trending', label: 'Trending', icon: Flame },
    { id: 'countryside', label: 'Countryside', icon: Trees },
    { id: 'barns', label: 'Barns', icon: Warehouse },
    { id: 'mountain', label: 'Mountains', icon: Mountain },
  ];

  return (
    <div style={containerStyle}>
      <div style={scrollWrapper}>
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button 
              key={cat.id} 
              onClick={() => onSelect(cat.id)}
              style={itemStyle(isActive)}
            >
              {/* INTERACTIVE ICON: Cinematic zoom and color shift */}
              <motion.div 
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                style={iconWrapper}
              >
                <cat.icon size={24} color={isActive ? '#000' : '#717171'} />
              </motion.div>
              
              <span style={labelStyle(isActive)}>{cat.label}</span>
              
              {/* --- 💎 HIGH-FIDELITY ACTIVE INDICATOR (Phase 21) --- */}
              {/* layoutId="categoryUnderline" allows Framer Motion to 
                  physically slide the underline from one button to the next, 
                  creating a professional "Shared Element" animation. */}
              {isActive && (
                <motion.div 
                  layoutId="categoryUnderline"
                  style={underlineStyle}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- PREMIUM VISUAL STYLES ---
const containerStyle = {
  width: '100%',
  backgroundColor: '#fff',
  borderBottom: '1px solid #f0f0f0',
  position: 'sticky',
  top: '225px', // Positioning: Sits perfectly below the SearchBar
  zIndex: 90,
  padding: '0.5rem 0'
};

const scrollWrapper = {
  display: 'flex',
  alignItems: 'center',
  gap: '2.5rem',
  padding: '0 4rem',
  maxWidth: '2560px',
  margin: '0 auto',
  overflowX: 'auto',
  scrollbarWidth: 'none', // Hide scrollbar for a sleek, app-like experience
  WebkitOverflowScrolling: 'touch'
};

const itemStyle = (active) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.8rem 0',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  minWidth: 'fit-content',
  position: 'relative',
  transition: 'color 0.2s',
  color: active ? '#000' : '#717171',
  opacity: active ? 1 : 0.7
});

const iconWrapper = { display: 'flex', alignItems: 'center', justifyContent: 'center' };

const labelStyle = (active) => ({
  fontSize: '0.75rem',
  fontWeight: '700',
  whiteSpace: 'nowrap',
  borderBottom: '2px solid transparent'
});

const underlineStyle = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: '2px',
  backgroundColor: '#000'
};

export default CategoryBar;
