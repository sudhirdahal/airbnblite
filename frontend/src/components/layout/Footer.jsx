import React from 'react';

const Footer = () => {
  return (
    <footer style={{ 
      borderTop: '1px solid #ddd', 
      padding: '2rem 1rem', 
      marginTop: '3rem', 
      backgroundColor: '#f7f7f7',
      color: '#717171'
    }}>
      <div style={{ 
        maxWidth: '2560px', width: '98%', 
        margin: '0 auto', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '2rem' 
      }}>
        <div>
          <h4 style={{ color: '#333', marginBottom: '1rem' }}>Support</h4>
          <ul style={listStyle}>
            <li>Help Center</li>
            <li>AirCover</li>
            <li>Anti-discrimination</li>
            <li>Disability support</li>
            <li>Cancellation options</li>
          </ul>
        </div>
        <div>
          <h4 style={{ color: '#333', marginBottom: '1rem' }}>Hosting</h4>
          <ul style={listStyle}>
            <li>AirBnB your home</li>
            <li>AirCover for Hosts</li>
            <li>Hosting resources</li>
            <li>Community forum</li>
            <li>Hosting responsibly</li>
          </ul>
        </div>
        <div>
          <h4 style={{ color: '#333', marginBottom: '1rem' }}>AirBnB Lite</h4>
          <ul style={listStyle}>
            <li>Newsroom</li>
            <li>New features</li>
            <li>Careers</li>
            <li>Investors</li>
            <li>Gift cards</li>
          </ul>
        </div>
      </div>
      <div style={{ 
        maxWidth: '2560px', width: '98%', 
        margin: '2rem auto 0', 
        paddingTop: '1rem', 
        borderTop: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.9rem'
      }}>
        <div>© 2026 AirBnB Lite, Inc. · Privacy · Terms · Sitemap</div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <span>English (US)</span>
          <span>$ USD</span>
        </div>
      </div>
    </footer>
  );
};

const listStyle = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  lineHeight: '2'
};

export default Footer;
