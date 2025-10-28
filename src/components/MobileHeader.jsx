import React from 'react';
import './MobileHeader.css';

const MobileHeader = ({ onMenuToggle, isMenuOpen }) => {
  return (
    <div className="mobile-header">
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
        <span className="logo-text">TrucksApp</span>
      </div>
    </div>
  );
};

export default MobileHeader;