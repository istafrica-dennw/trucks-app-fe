import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createApiUrl, createAuthHeaders } from '../utils/apiConfig';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import './Reports.css';

const Reports = () => {
  const { token } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [reportType, setReportType] = useState('daily');
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [groupBy, setGroupBy] = useState('day');
  const [selectedTruck, setSelectedTruck] = useState('');
  const [trucks, setTrucks] = useState([]);

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const fetchTrucks = async () => {
    if (!token) return; // Ensure token exists before fetching
    try {
      const response = await fetch(createApiUrl('api/trucks'), {
        headers: createAuthHeaders(token)
      });
      const data = await response.json();

      if (response.ok) {
        setTrucks(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch trucks');
      }
    } catch (err) {
      console.error('Failed to fetch trucks:', err);
      setError('Network error or server unreachable.');
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let url = '';
      const headers = createAuthHeaders(token);

      const truckParam = selectedTruck ? `?truckId=${selectedTruck}` : '';
      
      switch (reportType) {
        case 'daily':
          url = createApiUrl(`api/reports/daily/${selectedDate}${truckParam}`);
          break;
        case 'weekly':
          url = createApiUrl(`api/reports/weekly/${selectedWeek}${truckParam}`);
          break;
        case 'monthly':
          url = createApiUrl(`api/reports/monthly/${selectedMonth}${truckParam}`);
          break;
        case 'custom':
          const baseUrl = createApiUrl(`api/reports/custom?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&groupBy=${groupBy}`);
          url = selectedTruck ? `${baseUrl}&truckId=${selectedTruck}` : baseUrl;
          break;
        case 'summary':
          url = createApiUrl(`api/reports/summary${truckParam}`);
          break;
        default:
          throw new Error('Invalid report type');
      }

      const response = await fetch(url, { headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch report');
      }

      setReportData(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTrucks();
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchReport();
    }
  }, [reportType, selectedDate, selectedWeek, selectedMonth, dateRange, groupBy, selectedTruck, token]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const getCurrentWeek = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
  };

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (reportType === 'weekly' && !selectedWeek) {
      setSelectedWeek(getCurrentWeek());
    }
    if (reportType === 'monthly' && !selectedMonth) {
      setSelectedMonth(getCurrentMonth());
    }
  }, [reportType, selectedWeek, selectedMonth]);

  const renderReportSummary = (summary) => {
    if (!summary) return null;

    return (
      <div className="report-summary">
        <h3>Summary</h3>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-label">Total Journeys</div>
            <div className="summary-value">{formatNumber(summary.totalDrives)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Total Revenue</div>
            <div className="summary-value">{formatCurrency(summary.totalAmount)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Total Expenses</div>
            <div className="summary-value">{formatCurrency(summary.totalExpenses)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Total Paid</div>
            <div className="summary-value">{formatCurrency(summary.totalPaid)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Net Profit</div>
            <div className="summary-value profit">{formatCurrency(summary.netProfit)}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderBreakdown = (breakdown) => {
    if (!breakdown || !Array.isArray(breakdown)) return null;

    return (
      <div className="report-breakdown">
        <h3>Daily Breakdown</h3>
        <div className="breakdown-table">
          <div className="breakdown-header">
            <div>Date</div>
            <div>Journeys</div>
            <div>Revenue</div>
            <div>Expenses</div>
            <div>Paid</div>
            <div>Profit</div>
          </div>
          {breakdown.map((day, index) => (
            <div key={index} className="breakdown-row">
              <div>{day.date}</div>
              <div>{formatNumber(day.totalDrives)}</div>
              <div>{formatCurrency(day.totalAmount)}</div>
              <div>{formatCurrency(day.totalExpenses)}</div>
              <div>{formatCurrency(day.totalPaid)}</div>
              <div className={day.netProfit >= 0 ? 'profit' : 'loss'}>
                {formatCurrency(day.netProfit)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="reports-page">
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <MobileHeader 
        title="Reports" 
        isMenuOpen={isMenuOpen} 
        onMenuToggle={handleMenuToggle} 
      />
      
      <div className="reports-main">
        <div className="reports-header">
          <h1>Reports & Analytics</h1>
          <p>View comprehensive reports and analytics for your truck operations</p>
        </div>

        <div className="reports-controls">
          <div className="report-type-selector">
            <label>Report Type:</label>
            <select 
              value={reportType} 
              onChange={(e) => setReportType(e.target.value)}
              className="report-type-select"
            >
              <option value="daily">Daily Report</option>
              <option value="weekly">Weekly Report</option>
              <option value="monthly">Monthly Report</option>
              <option value="custom">Custom Date Range</option>
              <option value="summary">Overall Summary</option>
            </select>
          </div>

          <div className="truck-selector">
            <label>Filter by Truck (Optional):</label>
            <select 
              value={selectedTruck} 
              onChange={(e) => setSelectedTruck(e.target.value)}
              className="truck-select"
            >
              <option value="">All Trucks</option>
              {trucks.map(truck => (
                <option key={truck._id} value={truck._id}>
                  {truck.plateNumber} - {truck.make} {truck.model}
                </option>
              ))}
            </select>
          </div>

          {reportType === 'daily' && (
            <div className="date-input">
              <label>Select Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-picker"
              />
            </div>
          )}

          {reportType === 'weekly' && (
            <div className="week-input">
              <label>Select Week:</label>
              <input
                type="week"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="week-picker"
              />
            </div>
          )}

          {reportType === 'monthly' && (
            <div className="month-input">
              <label>Select Month:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="month-picker"
              />
            </div>
          )}

          {reportType === 'custom' && (
            <div className="custom-range">
              <div className="date-input">
                <label>Start Date:</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  className="date-picker"
                />
              </div>
              <div className="date-input">
                <label>End Date:</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  className="date-picker"
                />
              </div>
              <div className="group-by-input">
                <label>Group By:</label>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="group-by-select"
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading report...</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>Error: {error}</p>
          </div>
        )}

        {reportData && !loading && (
          <div className="report-content">
            {reportData.summary && renderReportSummary(reportData.summary)}
            {reportData.breakdown && renderBreakdown(reportData.breakdown)}
            {reportData.overall && renderReportSummary({ summary: reportData.overall })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;