import React from 'react';
import { Palmtree, Waves, Castle, Tent, Mountain, Coffee, Snowflake, Landmark } from 'lucide-react';

const categories = [
  { id: 'pools', label: 'Amazing pools', icon: <Waves size={24} /> },
  { id: 'beach', label: 'Beachfront', icon: <Palmtree size={24} /> },
  { id: 'cabins', label: 'Cabins', icon: <Mountain size={24} /> },
  { id: 'castles', label: 'Castles', icon: <Castle size={24} /> },
  { id: 'camping', label: 'Camping', icon: <Tent size={24} /> },
  { id: 'arctic', label: 'Arctic', icon: <Snowflake size={24} /> },
  { id: 'breakfast', label: 'Breakfasts', icon: <Coffee size={24} /> },
  { id: 'iconic', label: 'Iconic cities', icon: <Landmark size={24} /> },
];

const CategoryBar = ({ activeCategory, onSelect }) => {
  return (
    <div style={{ 
      display: 'flex', 
      gap: '2.5rem', 
      padding: '1rem 2rem', 
      overflowX: 'auto', 
      whiteSpace: 'nowrap',
      borderBottom: '1px solid #eee',
      backgroundColor: 'white',
      justifyContent: 'center'
    }}>
      {categories.map((cat) => (
        <div 
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: 'pointer',
            color: activeCategory === cat.id ? '#000' : '#717171',
            borderBottom: activeCategory === cat.id ? '2px solid #000' : '2px solid transparent',
            paddingBottom: '0.5rem',
            transition: 'all 0.2s',
            opacity: activeCategory === cat.id ? 1 : 0.7
          }}
        >
          {cat.icon}
          <span style={{ fontSize: '0.75rem', fontWeight: activeCategory === cat.id ? 'bold' : '500' }}>
            {cat.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default CategoryBar;
