import React, { useState, useEffect, useRef, useCallback } from 'react';
import './MobileHeader.css';

const MobileHeader = ({ onMenuToggle, isMenuOpen }) => {
  const [shouldShowHeader, setShouldShowHeader] = useState(true);
  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  const scrollTimeoutRef = useRef(null);
  const isMobileRef = useRef(isMobile);

  // Keep isMobileRef in sync
  useEffect(() => {
    isMobileRef.current = isMobile;
  }, [isMobile]);

  const showHeader = useCallback(() => {
    // Show header immediately
    setShouldShowHeader(true);

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Hide header after 3 seconds of no scrolling (only on mobile)
    if (isMobileRef.current) {
      scrollTimeoutRef.current = setTimeout(() => {
        setShouldShowHeader(false);
      }, 3000);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      showHeader();
    };

    const handleTouchStart = () => {
      showHeader();
    };

    const handleTouchMove = () => {
      showHeader();
    };

    const handleWheel = () => {
      showHeader();
    };

    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // Reset timeout on resize
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (mobile) {
        // Reset to show header, then hide after 3 seconds if no scroll
        setShouldShowHeader(true);
        scrollTimeoutRef.current = setTimeout(() => {
          setShouldShowHeader(false);
        }, 3000);
      } else {
        // Always show on desktop
        setShouldShowHeader(true);
      }
    };

    // Only add listeners on mobile devices
    if (isMobile) {
      // Add multiple event listeners for better detection
      // Listen on both window and document for maximum coverage
      window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
      document.addEventListener('scroll', handleScroll, { passive: true, capture: true });
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('wheel', handleWheel, { passive: true });
      window.addEventListener('resize', handleResize);
      
      // Initial timeout - hide after 3 seconds if no initial scroll
      scrollTimeoutRef.current = setTimeout(() => {
        setShouldShowHeader(false);
      }, 3000);
    } else {
      // Listen for resize to detect mobile
      window.addEventListener('resize', handleResize);
    }

    // Cleanup
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      window.removeEventListener('scroll', handleScroll, { capture: true });
      document.removeEventListener('scroll', handleScroll, { capture: true });
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobile, showHeader]);

  // Don't hide if menu is open or if we should show header
  const shouldHide = !isMenuOpen && !shouldShowHeader && isMobile;

  // Update body class when header is hidden to adjust page padding
  useEffect(() => {
    if (shouldHide) {
      document.body.classList.add('mobile-header-hidden');
    } else {
      document.body.classList.remove('mobile-header-hidden');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('mobile-header-hidden');
    };
  }, [shouldHide]);

  return (
    <div className={`mobile-header ${isMenuOpen ? 'hidden' : ''} ${shouldHide ? 'scrolled-hidden' : ''}`}>
      <button 
        className="mobile-menu-button"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
      >
        <div className={`hamburger ${isMenuOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>
      
      <div className="mobile-logo">
        <div className="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 17H4C4.55 17 5 16.55 5 16V7C5 6.45 4.55 6 4 6H2V17ZM20 6H8C7.45 6 7 6.45 7 7V16C7 16.55 7.45 17 8 17H20V6ZM18 15H10V8H18V15ZM12 12H16V13H12V12Z" fill="white"/>
          </svg>
        </div>
        <span className="logo-text">UrwuriApp</span>
      </div>
    </div>
  );
};

export default MobileHeader;