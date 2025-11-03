import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createApiUrl, createAuthHeaders } from '../utils/apiConfig';
import './RecentActivity.css';

const RecentActivity = () => {
  const { token } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Activity type icons mapping
  const getActivityIcon = (type) => {
    const iconMap = {
      journey_started: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5Z" fill="currentColor"/>
        </svg>
      ),
      journey_completed: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
        </svg>
      ),
      payment_received: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
        </svg>
      ),
      installment_paid: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
        </svg>
      ),
      driver_assigned: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7ZM12 13C15.3137 13 18 15.6863 18 19V21H6V19C6 15.6863 8.68629 13 12 13Z" fill="currentColor"/>
        </svg>
      ),
      truck_added: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 8H17V4H3C1.9 4 1 4.9 1 6V17H3C3 18.66 4.34 20 6 20S9 18.66 9 17H15C15 18.66 16.34 20 18 20S21 18.66 21 17H23V12L20 8Z" fill="currentColor"/>
        </svg>
      ),
      driver_added: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7ZM12 13C15.3137 13 18 15.6863 18 19V21H6V19C6 15.6863 8.68629 13 12 13Z" fill="currentColor"/>
        </svg>
      ),
      user_created: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z" fill="currentColor"/>
        </svg>
      ),
      maintenance_completed: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 8H17V4H3C1.9 4 1 4.9 1 6V17H3C3 18.66 4.34 20 6 20S9 18.66 9 17H15C15 18.66 16.34 20 18 20S21 18.66 21 17H23V12L20 8Z" fill="currentColor"/>
        </svg>
      ),
      default: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
        </svg>
      )
    };
    return iconMap[type] || iconMap.default;
  };

  // Fetch activities from API
  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await fetch(createApiUrl('api/activities?limit=5'), {
        headers: createAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const data = await response.json();
      setActivities(data.data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchActivities();
    }
  }, [token]);

  // Remove static fallback; show only real activities or empty state
  const displayActivities = activities;

  if (loading) {
    return (
      <div className="recent-activity">
        <div className="recent-activity__header">
          <h2 className="recent-activity__title">Recent Activity</h2>
        </div>
        <div className="recent-activity__body">
          <div className="recent-activity__loading">
            <p>Loading activities...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recent-activity">
        <div className="recent-activity__header">
          <h2 className="recent-activity__title">Recent Activity</h2>
        </div>
        <div className="recent-activity__body">
          <div className="recent-activity__error">
            <p>Error loading activities: {error}</p>
            <button onClick={fetchActivities} className="retry-btn">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="recent-activity">
      <div className="recent-activity__header">
        <h2 className="recent-activity__title">Recent Activity</h2>
        <button onClick={fetchActivities} className="refresh-btn" title="Refresh activities">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>
          </svg>
        </button>
      </div>
      
      <div className="recent-activity__body">
        {displayActivities.map((activity, index) => (
          <div key={activity._id || activity.id} className="recent-activity__item">
            <div className="recent-activity__icon">
              {activity.icon || getActivityIcon(activity.type)}
            </div>
            <div className="recent-activity__content">
              <div className="recent-activity__item-header">
                <h4 className="recent-activity__item-title">{activity.title}</h4>
                <span className="recent-activity__timestamp">
                  {activity.formattedTimestamp || activity.timestamp}
                </span>
              </div>
              <p className="recent-activity__details">
                {activity.description || activity.details}
              </p>
              {activity.performedBy && (
                <p className="recent-activity__performer">
                  by {activity.performedBy.username}
                </p>
              )}
            </div>
            {index < displayActivities.length - 1 && (
              <div className="recent-activity__divider"></div>
            )}
          </div>
        ))}
        
        {displayActivities.length === 0 && (
          <div className="recent-activity__empty">
            <p>No recent activities found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;