import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) {
      onClose();
    }
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor"/>
        </svg>
      ),
      path: '/admin/dashboard'
    },
    {
      id: 'users',
      label: 'Users',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7ZM12 13C15.3137 13 18 15.6863 18 19V21H6V19C6 15.6863 8.68629 13 12 13ZM20 7C20 10.866 16.866 14 13 14C9.13401 14 6 10.866 6 7C6 3.13401 9.13401 0 13 0C16.866 0 20 3.13401 20 7ZM13 12C15.7614 12 18 9.76142 18 7C18 4.23858 15.7614 2 13 2C10.2386 2 8 4.23858 8 7C8 9.76142 10.2386 12 13 12ZM20 19V21H14V19C14 16.7909 12.2091 15 10 15H16C18.2091 15 20 16.7909 20 19Z" fill="currentColor"/>
        </svg>
      ),
      path: '/admin/users'
    },
    {
      id: 'trucks',
      label: 'Trucks',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 8H17V4H3C1.9 4 1 4.9 1 6V17H3C3 18.66 4.34 20 6 20S9 18.66 9 17H15C15 18.66 16.34 20 18 20S21 18.66 21 17H23V12L20 8ZM6 18.5C5.17 18.5 4.5 17.83 4.5 17S5.17 15.5 6 15.5 7.5 16.17 7.5 17 6.83 18.5 6 18.5ZM18 18.5C17.17 18.5 16.5 17.83 16.5 17S17.17 15.5 18 15.5 19.5 16.17 19.5 17 18.83 18.5 18 18.5ZM17 12V10H19.5L21.46 12H17Z" fill="currentColor"/>
        </svg>
      ),
      path: '/admin/trucks'
    },
    {
      id: 'drivers',
      label: 'Drivers',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
        </svg>
      ),
      path: '/admin/drivers'
    },
    {
      id: 'journeys',
      label: 'Journeys',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5Z" fill="currentColor"/>
        </svg>
      ),
      path: '/admin/journeys'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM9 17H7V10H9V17ZM13 17H11V7H13V17ZM17 17H15V13H17V17Z" fill="currentColor"/>
        </svg>
      ),
      path: '/admin/reports'
    }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo and Brand */}
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 17H4C4.55 17 5 16.55 5 16V7C5 6.45 4.55 6 4 6H2V17ZM20 6H8C7.45 6 7 6.45 7 7V16C7 16.55 7.45 17 8 17H20V6ZM18 15H10V8H18V15ZM12 12H16V13H12V12Z" fill="white"/>
              </svg>
            </div>
          </div>
          <div className="brand">
            <h1 className="brand-name">TrucksApp</h1>
            <p className="brand-subtitle">Admin Panel</p>
          </div>
        </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <h3 className="nav-section-title">Navigation</h3>
        <ul className="nav-menu">
          {menuItems.map((item) => (
            <li key={item.id} className="nav-item">
              <button
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => handleNavigation(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Actions */}
      <div className="sidebar-footer">
        <button className="nav-link profile-link" onClick={() => handleNavigation(isAdmin() ? '/admin/profile' : '/profile')}>
          <span className="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
            </svg>
          </span>
          <span className="nav-label">Profile</span>
        </button>
        
        <button className="nav-link logout-link" onClick={handleLogout}>
          <span className="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.59L17 17L22 12L17 7ZM4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z" fill="currentColor"/>
            </svg>
          </span>
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </div>
    </>
  );
};

export default Sidebar;