import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createApiUrl, createAuthHeaders } from '../utils/apiConfig';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import MetricCard from '../components/MetricCard';
import RecentActivity from '../components/RecentActivity';
import './Dashboard.css';

const Dashboard = () => {
  const { user, token } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Fetch user statistics
  const fetchUserStats = async () => {
    try {
      const response = await fetch(createApiUrl('api/users/stats'), {
        headers: createAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user statistics');
      }

      const data = await response.json();
      setUserStats(data.data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserStats();
    }
  }, [token]);

  // Mock data for user dashboard (read-only view)
  const metrics = [
    {
      title: 'Total Trucks',
      value: '24',
      description: 'Fleet overview',
      color: 'blue',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 8H17V4H3C1.9 4 1 4.9 1 6V17H3C3 18.66 4.34 20 6 20S9 18.66 9 17H15C15 18.66 16.34 20 18 20S21 18.66 21 17H23V12L20 8ZM6 18.5C5.17 18.5 4.5 17.83 4.5 17S5.17 15.5 6 15.5 7.5 16.17 7.5 17 6.83 18.5 6 18.5ZM18 18.5C17.17 18.5 16.5 17.83 16.5 17S17.17 15.5 18 15.5 19.5 16.17 19.5 17 18.83 18.5 18 18.5ZM17 12V10H19.5L21.46 12H17Z" fill="currentColor"/>
        </svg>
      )
    },
    {
      title: 'Active Drivers',
      value: '18',
      description: 'Currently working',
      color: 'green',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7ZM12 13C15.3137 13 18 15.6863 18 19V21H6V19C6 15.6863 8.68629 13 12 13Z" fill="currentColor"/>
        </svg>
      )
    },
    {
      title: 'Total Journeys',
      value: '156',
      description: 'This month',
      color: 'orange',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5Z" fill="currentColor"/>
        </svg>
      )
    },
    {
      title: 'System Users',
      value: loading ? '...' : (userStats ? userStats.total.toString() : '0'),
      description: userStats ? `Total users` : 'Loading...',
      color: 'purple',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor"/>
        </svg>
      )
    }
  ];

  return (
    <div className="user-dashboard">
      <MobileHeader onMenuToggle={toggleSidebar} isMenuOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h1>Dashboard</h1>
            <p>Welcome back, {user?.username}</p>
          </div>
        </div>
        
        <div className="dashboard-content">
          {/* Metrics Grid */}
          <div className="metrics-grid">
            {metrics.map((metric, index) => (
              <MetricCard
                key={index}
                title={metric.title}
                value={metric.value}
                description={metric.description}
                icon={metric.icon}
                color={metric.color}
              />
            ))}
          </div>
          
          {/* Recent Activity */}
          <div className="activity-section">
            <RecentActivity />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;