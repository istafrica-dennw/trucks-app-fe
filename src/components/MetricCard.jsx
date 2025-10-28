import React from 'react';
import './MetricCard.css';

const MetricCard = ({ title, value, description, icon, color = 'blue' }) => {
  return (
    <div className={`metric-card metric-card--${color}`}>
      <div className="metric-card__content">
        <div className="metric-card__header">
          <h3 className="metric-card__title">{title}</h3>
          <div className={`metric-card__icon metric-card__icon--${color}`}>
            {icon}
          </div>
        </div>
        <div className="metric-card__body">
          <div className="metric-card__value">{value}</div>
          <div className="metric-card__description">{description}</div>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;