import React from 'react';
import { motion } from 'framer-motion';
import { 
  Waves, Castle, Palmtree, Mountain, Tent, 
  Flame, Snowflake, Landmark, Trees, Warehouse 
} from 'lucide-react';

/**
 * ============================================================================
 * CATEGORY BAR COMPONENT (The Discovery Pivot)
 * ============================================================================
 * Initially a static list of text links.
 * It has evolved into a high-fidelity visual filter bar that orchestrates
 * the global listing query based on property 'Category' metadata.
 * 
 * Logic: Toggles the 'activeCategory' state in App.jsx, which triggers
 * an immediate re-fetch of filtered results.
 */
const CategoryBar = ({ activeCategory, onSelect }) => {
  
  // --- DEFINED THEMATIC CATEGORIES ---
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

  /* --- HISTORICAL STAGE 1: STATIC LIST ---
   * return (
   *   <div>
   *     <button onClick={() => onSelect('pools')}>Pools</button>
   *     <button onClick={() => onSelect('beach')}>Beach</button>
   *   </div>
   * );
   */

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
              <motion.div 
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                style={iconWrapper}
              >
                <cat.icon size={24} color={isActive ? '#000' : '#717171'} />
              </motion.div>
              
              <span style={labelStyle(isActive)}>{cat.label}</span>
              
              {/* --- HIGH-FIDELITY ACTIVE INDICATOR --- */}
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
  top: '225px', // Below SearchBar
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
  scrollbarWidth: 'none', // Hide scrollbar for clean UI
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
