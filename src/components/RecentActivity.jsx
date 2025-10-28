import React from 'react';
import './RecentActivity.css';

const RecentActivity = ({ activities = [] }) => {
  const defaultActivities = [
    {
      id: 1,
      type: 'drive_created',
      title: 'New drive created',
      details: 'Driver: John Doe • Truck: TRK-001',
      timestamp: '2 hours ago',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22S19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5Z" fill="currentColor"/>
        </svg>
      )
    },
    {
      id: 2,
      type: 'driver_added',
      title: 'Driver added',
      details: 'Driver: Jane Smith',
      timestamp: '5 hours ago',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7ZM12 13C15.3137 13 18 15.6863 18 19V21H6V19C6 15.6863 8.68629 13 12 13Z" fill="currentColor"/>
        </svg>
      )
    },
    {
      id: 3,
      type: 'maintenance_completed',
      title: 'Truck maintenance completed',
      details: 'Truck: TRK-003',
      timestamp: '1 day ago',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 8H17V4H3C1.9 4 1 4.9 1 6V17H3C3 18.66 4.34 20 6 20S9 18.66 9 17H15C15 18.66 16.34 20 18 20S21 18.66 21 17H23V12L20 8Z" fill="currentColor"/>
        </svg>
      )
    }
  ];

  const displayActivities = activities.length > 0 ? activities : defaultActivities;

  return (
    <div className="recent-activity">
      <div className="recent-activity__header">
        <h2 className="recent-activity__title">Recent Activity</h2>
      </div>
      
      <div className="recent-activity__body">
        {displayActivities.map((activity, index) => (
          <div key={activity.id} className="recent-activity__item">
            <div className="recent-activity__icon">
              {activity.icon}
            </div>
            <div className="recent-activity__content">
              <div className="recent-activity__item-header">
                <h4 className="recent-activity__item-title">{activity.title}</h4>
                <span className="recent-activity__timestamp">{activity.timestamp}</span>
              </div>
              <p className="recent-activity__details">{activity.details}</p>
            </div>
            {index < displayActivities.length - 1 && (
              <div className="recent-activity__divider"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;