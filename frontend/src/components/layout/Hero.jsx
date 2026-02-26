import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Home } from 'lucide-react';

const Hero = ({ user }) => {
  const userRole = user ? user.role : 'guest';
  
  const getHeading = () => {
    if (userRole === 'admin') return "Property Management";
    if (userRole === 'registered') return `Welcome back, ${user.name.split(' ')[0]}`;
    return "Explore the world";
  };

  const getSubheading = () => {
    if (userRole === 'admin') return "Overview of your listings and earnings";
    if (userRole === 'registered') return "Pick up where you left off";
    return "Find unique stays for your next trip";
  };

  return (
    <div style={bannerContainerStyle}>
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} style={contentWrapperStyle}>
        <div style={topRowStyle}>
          <div style={iconBadgeStyle}>{userRole === 'admin' ? <Home size={16} /> : <Sparkles size={16} />}</div>
          <Link to="/" style={{ textDecoration: 'none' }}><span style={breadcrumbStyle}>AirBnB Lite / {userRole}</span></Link>
        </div>
        <h1 style={modernHeadingStyle}>{getHeading()}</h1>
        <p style={modernSubheadingStyle}>{getSubheading()}</p>
      </motion.div>

      {user && (
        <Link to="/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.02, backgroundColor: '#fcfcfc', borderColor: '#ff385c' }} whileTap={{ scale: 0.98 }} transition={{ delay: 0.2 }} style={profileCardStyle}>
            {/* UPDATED: Show Avatar Image if it exists */}
            <div style={avatarCircleStyle}>
              {user.avatar ? (
                <img src={user.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} alt="Avatar" />
              ) : user.name.charAt(0)}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{user.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#717171' }}>{userRole === 'admin' ? 'Superhost' : 'Verified Guest'}</div>
            </div>
          </motion.div>
        </Link>
      )}
    </div>
  );
};

const bannerContainerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2rem 4rem', backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0', maxWidth: '2560px', margin: '0 auto', width: '100%', boxSizing: 'border-box' };
const contentWrapperStyle = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };
const topRowStyle = { display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.2rem' };
const iconBadgeStyle = { padding: '0.4rem', backgroundColor: '#f7f7f7', borderRadius: '8px', display: 'flex', color: '#ff385c' };
const breadcrumbStyle = { fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#b0b0b0', cursor: 'pointer' };
const modernHeadingStyle = { fontSize: '2rem', fontWeight: '800', margin: 0, color: '#222', letterSpacing: '-0.03em' };
const modernSubheadingStyle = { fontSize: '1rem', color: '#717171', margin: 0, fontWeight: '500' };
const profileCardStyle = { display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem 1.2rem', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', cursor: 'pointer', transition: 'border-color 0.2s' };
const avatarCircleStyle = { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#222', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' };

export default Hero;
