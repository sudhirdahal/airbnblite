import React from 'react';
import { Globe, DollarSign, Facebook, Twitter, Instagram } from 'lucide-react';

/**
 * ============================================================================
 * FOOTER COMPONENT (The Sitemap & Social Layer)
 * ============================================================================
 * Initially a simple <div> with a copyright notice.
 * It has evolved into a high-fidelity multi-column resource center 
 * that anchors the application's visual hierarchy.
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();

  /* --- HISTORICAL STAGE 1: PRIMITIVE FOOTER ---
   * return (
   *   <footer style={{ textAlign: 'center', padding: '1rem' }}>
   *     © {currentYear} AirBnB Lite
   *   </footer>
   * );
   */

  return (
    <footer style={footerContainer}>
      <div style={footerInner}>
        
        {/* --- TOP SECTION: MULTI-COLUMN SITEMAP --- */}
        <div style={footerGrid}>
          <div style={footerColumn}>
            <h4 style={columnTitle}>Support</h4>
            <ul style={linkList}>
              <li>Help Center</li>
              <li>AirCover</li>
              <li>Anti-discrimination</li>
              <li>Disability support</li>
              <li>Cancellation options</li>
            </ul>
          </div>
          <div style={footerColumn}>
            <h4 style={columnTitle}>Hosting</h4>
            <ul style={linkList}>
              <li>AirnbLite your home</li>
              <li>AirCover for Hosts</li>
              <li>Hosting resources</li>
              <li>Community forum</li>
              <li>Hosting responsibly</li>
            </ul>
          </div>
          <div style={footerColumn}>
            <h4 style={columnTitle}>AirnbLite</h4>
            <ul style={linkList}>
              <li>Newsroom</li>
              <li>New features</li>
              <li>Careers</li>
              <li>Investors</li>
              <li>Gift cards</li>
            </ul>
          </div>
        </div>

        {/* --- BOTTOM SECTION: LEGAL & LOCALE --- */}
        <div style={footerBottom}>
          <div style={bottomLeft}>
            <span>© {currentYear} AirnbLite, Inc.</span>
            <span style={dotSeparator}>·</span>
            <span style={footerLink}>Privacy</span>
            <span style={dotSeparator}>·</span>
            <span style={footerLink}>Terms</span>
            <span style={dotSeparator}>·</span>
            <span style={footerLink}>Sitemap</span>
          </div>
          
          <div style={bottomRight}>
            <div style={localeItem}><Globe size={18} /> <span>English (US)</span></div>
            <div style={localeItem}><DollarSign size={18} /> <span>USD</span></div>
            <div style={socialIcons}>
              <Facebook size={20} />
              <Twitter size={20} />
              <Instagram size={20} />
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

// --- PREMIUM FOOTER STYLES ---
const footerContainer = { 
  backgroundColor: '#f7f7f7', 
  borderTop: '1px solid #ddd', 
  padding: '3rem 0', 
  marginTop: 'auto',
  width: '100%' 
};

const footerInner = { 
  maxWidth: '2560px', 
  margin: '0 auto', 
  padding: '0 4rem' 
};

const footerGrid = { 
  display: 'grid', 
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
  gap: '2rem',
  paddingBottom: '3rem',
  borderBottom: '1px solid #ddd'
};

const footerColumn = { display: 'flex', flexDirection: 'column', gap: '1rem' };
const columnTitle = { fontSize: '0.9rem', fontWeight: '700', color: '#222', margin: 0 };
const linkList = { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem', color: '#444' };

const footerBottom = { 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  paddingTop: '1.5rem',
  flexWrap: 'wrap',
  gap: '1.5rem'
};

const bottomLeft = { fontSize: '0.9rem', color: '#222', display: 'flex', alignItems: 'center' };
const dotSeparator = { margin: '0 0.5rem', color: '#717171' };
const footerLink = { cursor: 'pointer' };

const bottomRight = { display: 'flex', alignItems: 'center', gap: '2rem' };
const localeItem = { display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' };
const socialIcons = { display: 'flex', gap: '1rem', cursor: 'pointer' };

export default Footer;
