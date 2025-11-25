import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createApiUrl, createAuthHeaders } from '../utils/apiConfig';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import './Settings.css';

const Settings = () => {
  const { token, isAdminOrOfficer } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [exchangeRates, setExchangeRates] = useState({
    USD: 1200,
    RWF: 1,
    UGX: 3.2,
    TZX: 0.52
  });

  useEffect(() => {
    if (token && isAdminOrOfficer()) {
      fetchSettings();
    }
  }, [token, isAdminOrOfficer]);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(createApiUrl('api/settings'), {
        headers: createAuthHeaders(token)
      });
      const data = await response.json();

      if (response.ok) {
        setExchangeRates(data.data.exchangeRates || exchangeRates);
      } else {
        setError(data.message || 'Failed to fetch settings');
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setError('Network error or server unreachable.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (currency, value) => {
    // Allow empty string for clearing the field
    if (value === '' || value === null || value === undefined) {
      setExchangeRates(prev => ({
        ...prev,
        [currency]: ''
      }));
      return;
    }
    
    // Allow typing numbers (including decimals and negative for intermediate states)
    const numValue = parseFloat(value);
    
    // Only update if it's a valid number, otherwise keep the string value for typing
    if (!isNaN(numValue)) {
      setExchangeRates(prev => ({
        ...prev,
        [currency]: numValue
      }));
    } else {
      // Allow partial input while typing (e.g., "1.", "-", etc.)
      // Store as string temporarily
      setExchangeRates(prev => ({
        ...prev,
        [currency]: value
      }));
    }
  };

  const handleInputBlur = (currency, value) => {
    // Validate on blur - ensure we have a valid number
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      // Reset to previous valid value or default
      setExchangeRates(prev => {
        const current = prev[currency];
        const defaultRates = { USD: 1200, RWF: 1, UGX: 3.2, TZX: 0.52 };
        return {
          ...prev,
          [currency]: typeof current === 'number' ? current : defaultRates[currency]
        };
      });
    } else {
      // Ensure it's stored as a number
      setExchangeRates(prev => ({
        ...prev,
        [currency]: numValue
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    // Validate all rates before submitting
    const validatedRates = {};
    const defaultRates = { USD: 1200, RWF: 1, UGX: 3.2, TZX: 0.52 };
    
    Object.keys(exchangeRates).forEach(currency => {
      const value = exchangeRates[currency];
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        validatedRates[currency] = defaultRates[currency];
      } else {
        validatedRates[currency] = numValue;
      }
    });

    try {
      const response = await fetch(createApiUrl('api/settings/exchange-rates'), {
        method: 'PUT',
        headers: {
          ...createAuthHeaders(token),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ exchangeRates: validatedRates })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Exchange rates updated successfully!');
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data.message || 'Failed to update exchange rates');
      }
    } catch (err) {
      console.error('Failed to update exchange rates:', err);
      setError('Network error or server unreachable.');
    } finally {
      setSaving(false);
    }
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  if (!isAdminOrOfficer()) {
    return (
      <div className="settings-page">
        <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        <MobileHeader 
          title="Settings" 
          onMenuToggle={handleMenuToggle}
          isMenuOpen={isMenuOpen}
        />
        <div className="settings-main">
          <div className="settings-header">
            <h1>Settings</h1>
            <p>Access denied. Admin privileges required.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <MobileHeader 
        title="Settings" 
        onMenuToggle={handleMenuToggle}
        isMenuOpen={isMenuOpen}
      />
      <div className="settings-main">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage exchange rates for different currencies</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        <div className="settings-content">
          <form onSubmit={handleSubmit} className="settings-form">
            <div className="settings-section">
              <h2>Exchange Rates</h2>
              <p className="section-description">
                Set the default exchange rates for converting currencies to RWF (Rwandan Franc).
                These rates will be used as defaults when creating new journeys.
              </p>

              <div className="exchange-rates-grid">
                <div className="exchange-rate-card">
                  <div className="currency-header">
                    <h3>USD</h3>
                    <span className="currency-name">US Dollar</span>
                  </div>
                  <div className="exchange-rate-input">
                    <label htmlFor="usd-rate">1 USD =</label>
                    <input
                      type="number"
                      id="usd-rate"
                      value={exchangeRates.USD}
                      onChange={(e) => handleInputChange('USD', e.target.value)}
                      onBlur={(e) => handleInputBlur('USD', e.target.value)}
                      step="0.01"
                      min="0.01"
                      required
                      disabled={loading || saving}
                    />
                    <span className="currency-unit">RWF</span>
                  </div>
                </div>

                <div className="exchange-rate-card">
                  <div className="currency-header">
                    <h3>RWF</h3>
                    <span className="currency-name">Rwandan Franc</span>
                  </div>
                  <div className="exchange-rate-input">
                    <label htmlFor="rwf-rate">1 RWF =</label>
                    <input
                      type="number"
                      id="rwf-rate"
                      value={exchangeRates.RWF}
                      onChange={(e) => handleInputChange('RWF', e.target.value)}
                      onBlur={(e) => handleInputBlur('RWF', e.target.value)}
                      step="0.01"
                      min="0.01"
                      required
                      disabled={loading || saving}
                    />
                    <span className="currency-unit">RWF</span>
                  </div>
                </div>

                <div className="exchange-rate-card">
                  <div className="currency-header">
                    <h3>UGX</h3>
                    <span className="currency-name">Ugandan Shilling</span>
                  </div>
                  <div className="exchange-rate-input">
                    <label htmlFor="ugx-rate">1 UGX =</label>
                    <input
                      type="number"
                      id="ugx-rate"
                      value={exchangeRates.UGX}
                      onChange={(e) => handleInputChange('UGX', e.target.value)}
                      onBlur={(e) => handleInputBlur('UGX', e.target.value)}
                      step="0.01"
                      min="0.01"
                      required
                      disabled={loading || saving}
                    />
                    <span className="currency-unit">RWF</span>
                  </div>
                </div>

                <div className="exchange-rate-card">
                  <div className="currency-header">
                    <h3>TZX</h3>
                    <span className="currency-name">Tanzanian Shilling</span>
                  </div>
                  <div className="exchange-rate-input">
                    <label htmlFor="tzx-rate">1 TZX =</label>
                    <input
                      type="number"
                      id="tzx-rate"
                      value={exchangeRates.TZX}
                      onChange={(e) => handleInputChange('TZX', e.target.value)}
                      onBlur={(e) => handleInputBlur('TZX', e.target.value)}
                      step="0.01"
                      min="0.01"
                      required
                      disabled={loading || saving}
                    />
                    <span className="currency-unit">RWF</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={fetchSettings}
                className="btn-secondary"
                disabled={loading || saving}
              >
                Reset
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;


