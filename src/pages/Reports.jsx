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

  // Helper to get selected truck plate number
  const getSelectedTruckPlate = () => {
    const t = trucks.find(truck => truck._id === selectedTruck);
    return t ? t.plateNumber : '';
  };

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let url = '';
      const headers = createAuthHeaders(token);

      switch (reportType) {
        case 'daily':
          url = createApiUrl(`api/reports/daily/${selectedDate}${selectedTruck ? `?truckId=${selectedTruck}` : ''}`);
          break;
        case 'weekly':
          url = createApiUrl(`api/reports/weekly/${selectedWeek}${selectedTruck ? `?truckId=${selectedTruck}` : ''}`);
          break;
        case 'monthly':
          url = createApiUrl(`api/reports/monthly/${selectedMonth}${selectedTruck ? `?truckId=${selectedTruck}` : ''}`);
          break;
        case 'custom':
          const params = new URLSearchParams({
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
            groupBy: groupBy
          });
          if (selectedTruck && selectedTruck.trim() !== '') {
            params.append('truckId', selectedTruck);
          }
          url = createApiUrl(`api/reports/custom?${params.toString()}`);
          break;
        case 'summary':
          url = createApiUrl(`api/reports/summary${selectedTruck ? `?truckId=${selectedTruck}` : ''}`);
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

  // Format currency - reports always show in RWF
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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

  // Export CSV helpers
  const buildCsv = () => {
    if (!reportData) return '';

    const rows = [];
    const pushRow = (arr) => rows.push(arr.map(v => {
      if (v == null) return '';
      const s = String(v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(','));

    // Metadata header
    pushRow([`Report Type`, reportType]);
    if (reportType === 'daily') pushRow(['Date', selectedDate]);
    if (reportType === 'weekly') pushRow(['Week', selectedWeek]);
    if (reportType === 'monthly') pushRow(['Month', selectedMonth]);
    if (reportType === 'custom') pushRow(['Range', `${dateRange.startDate} to ${dateRange.endDate}`, 'Group By', groupBy]);
    if (selectedTruck) pushRow(['Truck Plate', getSelectedTruckPlate()]);
    pushRow(['Generated At', new Date().toISOString()]);
    pushRow([]);

    // Summary
    const summary = reportData.summary || reportData.overall;
    if (summary) {
      pushRow(['Summary']);
      pushRow(['Total Journeys', summary.totalDrives]);
      pushRow(['Total Revenue', summary.totalAmount]);
      pushRow(['Total Expenses', summary.totalExpenses]);
      pushRow(['Total Paid', summary.totalPaid]);
      pushRow(['Net Profit', summary.netProfit]);
      pushRow([]);
    }

    // Breakdown
    if (Array.isArray(reportData.breakdown) && reportData.breakdown.length) {
      pushRow(['Breakdown']);
      pushRow(['Date', 'Journeys', 'Revenue', 'Expenses', 'Paid', 'Profit']);
      reportData.breakdown.forEach(d => {
        pushRow([d.date, d.totalDrives, d.totalAmount, d.totalExpenses, d.totalPaid, d.netProfit]);
      });
    }

    return rows.join('\n');
  };

  const handleExportCsv = () => {
    const csv = buildCsv();
    if (!csv) return;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
    let name = `report-${reportType}-${stamp}`;
    if (reportType === 'daily') name += `-${selectedDate}`;
    if (reportType === 'weekly') name += `-${selectedWeek}`;
    if (reportType === 'monthly') name += `-${selectedMonth}`;
    if (reportType === 'custom') name += `-${dateRange.startDate}_to_${dateRange.endDate}`;
    a.href = url;
    a.download = `${name}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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

        {/* Exchange Rates Display */}
        {reportData && (reportData.summary?.exchangeRates || reportData.overall?.exchangeRates) && (
          <div className="exchange-rates-banner" style={{
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#0369a1', fontSize: '1rem', fontWeight: '600' }}>
              Exchange Rates Used (All amounts converted to RWF)
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              {Object.entries(reportData.summary?.exchangeRates || reportData.overall?.exchangeRates || {}).map(([currency, rate]) => (
                <div key={currency} style={{
                  background: 'white',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e0f2fe'
                }}>
                  <strong>{currency}:</strong> 1 {currency} = {parseFloat(rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RWF
                </div>
              ))}
            </div>
          </div>
        )}

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

          {/* Export Button */}
          <div className="export-controls">
            <button onClick={handleExportCsv} className="btn-export">Export CSV</button>
          </div>
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
            {reportData.overall && renderReportSummary(reportData.overall)}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;