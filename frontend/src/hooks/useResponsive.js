import { useState, useEffect } from 'react';

/**
 * ============================================================================
 * 📱 USE-RESPONSIVE HOOK (The Convergence Engine)
 * ============================================================================
 * Logic: Provides a real-time, synchronized source of truth for the 
 * viewport dimensions. Standardizes the 'isMobile' threshold (1024px)
 * across the entire architecture.
 */
export const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
      setWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile, isTablet, width };
};
