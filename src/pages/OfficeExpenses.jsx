import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createApiUrl, createAuthHeaders } from '../utils/apiConfig';
import { parseValidationErrors, getGeneralError } from '../utils/formErrorHandler';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import './OfficeExpenses.css';

const OfficeExpenses = () => {
  const { token, isAdminOrOfficer } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [defaultExchangeRates, setDefaultExchangeRates] = useState({
    USD: 1200,
    RWF: 1,
    UGX: 3.2,
    TZX: 0.52
  });
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  
  // Form states
  const [submitting, setSubmitting] = useState(false);
  const [deletingExpenses, setDeletingExpenses] = useState({});
  const [newExpense, setNewExpense] = useState({
    title: '',
    description: '',
    amount: '',
    currency: 'RWF',
    exchangeRate: 1,
    date: new Date().toISOString().split('T')[0],
    attachment: null
  });
  
  // Pagination and filters
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  // Fetch default exchange rates
  const fetchDefaultExchangeRates = async () => {
    try {
      const response = await fetch(createApiUrl('api/settings'), {
        headers: createAuthHeaders(token)
      });
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.exchangeRates) {
          setDefaultExchangeRates(data.data.exchangeRates);
        }
      }
    } catch (err) {
      console.error('Error fetching exchange rates:', err);
    }
  };

  // Fetch expenses
  const fetchExpenses = async (page = 1, limit = 10, search = '', startDate = '', endDate = '', sortBy = 'date', sortOrder = 'desc') => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        sortBy,
        sortOrder
      });
      
      if (startDate) {
        queryParams.append('startDate', startDate);
      }
      if (endDate) {
        queryParams.append('endDate', endDate);
      }

      const response = await fetch(createApiUrl(`api/office-expenses?${queryParams}`), {
        headers: createAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch office expenses');
      }

      const data = await response.json();
      setExpenses(data.data);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle search change
  const handleSearchChange = (e) => {
    const search = e.target.value;
    setFilters(prev => ({ ...prev, search }));
    fetchExpenses(1, pagination.limit, search, filters.startDate, filters.endDate, filters.sortBy, filters.sortOrder);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    fetchExpenses(1, pagination.limit, filters.search, name === 'startDate' ? value : filters.startDate, name === 'endDate' ? value : filters.endDate, filters.sortBy, filters.sortOrder);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    fetchExpenses(newPage, pagination.limit, filters.search, filters.startDate, filters.endDate, filters.sortBy, filters.sortOrder);
  };

  // Handle add expense click
  const handleAddExpenseClick = () => {
    setNewExpense({
      title: '',
      description: '',
      amount: '',
      currency: 'RWF',
      exchangeRate: 1,
      date: new Date().toISOString().split('T')[0],
      attachment: null
    });
    setError(null);
    setFieldErrors({});
    setShowAddModal(true);
  };

  // Handle edit expense click
  const handleEditExpenseClick = (expense) => {
    setSelectedExpense(expense);
    setError(null);
    setFieldErrors({});
    setShowEditModal(true);
  };

  // Handle view details click
  const handleViewDetailsClick = async (expense) => {
    try {
      const response = await fetch(createApiUrl(`api/office-expenses/${expense._id}`), {
        headers: createAuthHeaders(token)
      });
      if (!response.ok) {
        throw new Error('Failed to fetch expense details');
      }
      const data = await response.json();
      setSelectedExpense(data.data);
      setShowDetailsModal(true);
    } catch (err) {
      setError('Failed to load expense details');
    }
  };

  // Handle delete click
  const handleDeleteClick = (expense) => {
    setExpenseToDelete(expense);
    setShowDeleteModal(true);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'currency') {
      const exchangeRate = defaultExchangeRates[value] || 1;
      setNewExpense(prev => ({ ...prev, [name]: value, exchangeRate }));
    } else {
      setNewExpense(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle number blur (for direct typing)
  const handleNumberBlur = (e, fieldName) => {
    const value = e.target.value;
    const numValue = value === '' ? '' : parseFloat(value);
    setNewExpense(prev => ({ ...prev, [fieldName]: numValue }));
  };

  // Handle file change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Only images (JPEG, PNG, GIF, WEBP) and PDF files are allowed.');
        e.target.value = '';
        return;
      }
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit.');
        e.target.value = '';
        return;
      }
      
      setNewExpense(prev => ({ ...prev, attachment: file }));
      setError(null);
    }
  };

  // Handle add expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', newExpense.title);
      formData.append('description', newExpense.description || '');
      formData.append('amount', newExpense.amount);
      formData.append('currency', newExpense.currency);
      formData.append('exchangeRate', newExpense.exchangeRate || 1);
      formData.append('date', newExpense.date);
      
      if (newExpense.attachment) {
        formData.append('attachment', newExpense.attachment);
      }

      // Get token from headers
      const headers = createAuthHeaders(token);
      // Remove Content-Type header to let browser set it with boundary for FormData
      delete headers['Content-Type'];

      const response = await fetch(createApiUrl('api/office-expenses'), {
        method: 'POST',
        headers: headers,
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        const fieldErrors = parseValidationErrors(data);
        if (Object.keys(fieldErrors).length > 0) {
          setFieldErrors(fieldErrors);
          setError(getGeneralError(data));
        } else {
          setError(data.message || 'Failed to create expense');
        }
        return;
      }

      // Success
      setShowAddModal(false);
      setNewExpense({
        title: '',
        description: '',
        amount: '',
        currency: 'RWF',
        exchangeRate: 1,
        date: new Date().toISOString().split('T')[0],
        attachment: null
      });
      
      // Refresh expenses list
      await fetchExpenses(pagination.page, pagination.limit, filters.search, filters.startDate, filters.endDate, filters.sortBy, filters.sortOrder);
    } catch (err) {
      setError(err.message || 'Failed to create expense');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle update expense
  const handleUpdateExpense = async (e) => {
    e.preventDefault();
    if (!selectedExpense) return;

    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', selectedExpense.title);
      formData.append('description', selectedExpense.description || '');
      formData.append('amount', selectedExpense.amount);
      formData.append('currency', selectedExpense.currency);
      formData.append('exchangeRate', selectedExpense.exchangeRate || 1);
      formData.append('date', selectedExpense.date);
      
      if (selectedExpense.attachmentFile) {
        formData.append('attachment', selectedExpense.attachmentFile);
      }

      // Get token from headers
      const headers = createAuthHeaders(token);
      // Remove Content-Type header to let browser set it with boundary for FormData
      delete headers['Content-Type'];

      const response = await fetch(createApiUrl(`api/office-expenses/${selectedExpense._id}`), {
        method: 'PUT',
        headers: headers,
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        const fieldErrors = parseValidationErrors(data);
        if (Object.keys(fieldErrors).length > 0) {
          setFieldErrors(fieldErrors);
          setError(getGeneralError(data));
        } else {
          setError(data.message || 'Failed to update expense');
        }
        return;
      }

      // Success
      setShowEditModal(false);
      setSelectedExpense(null);
      
      // Refresh expenses list
      await fetchExpenses(pagination.page, pagination.limit, filters.search, filters.startDate, filters.endDate, filters.sortBy, filters.sortOrder);
    } catch (err) {
      setError(err.message || 'Failed to update expense');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete expense
  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;

    try {
      setDeletingExpenses(prev => ({ ...prev, [expenseToDelete._id]: true }));
      const response = await fetch(createApiUrl(`api/office-expenses/${expenseToDelete._id}`), {
        method: 'DELETE',
        headers: createAuthHeaders(token)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete expense');
      }

      setShowDeleteModal(false);
      setExpenseToDelete(null);
      
      // Refresh expenses list
      await fetchExpenses(pagination.page, pagination.limit, filters.search, filters.startDate, filters.endDate, filters.sortBy, filters.sortOrder);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingExpenses(prev => ({ ...prev, [expenseToDelete._id]: false }));
    }
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDetailsModal(false);
    setShowDeleteModal(false);
    setSelectedExpense(null);
    setExpenseToDelete(null);
    setError(null);
    setFieldErrors({});
  };

  // Handle edit input change
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'currency') {
      const exchangeRate = defaultExchangeRates[value] || 1;
      setSelectedExpense(prev => ({ ...prev, [name]: value, exchangeRate }));
    } else {
      setSelectedExpense(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle edit file change
  const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Only images (JPEG, PNG, GIF, WEBP) and PDF files are allowed.');
        e.target.value = '';
        return;
      }
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit.');
        e.target.value = '';
        return;
      }
      
      setSelectedExpense(prev => ({ ...prev, attachmentFile: file }));
      setError(null);
    }
  };

  // Handle edit number blur
  const handleEditNumberBlur = (e, fieldName) => {
    const value = e.target.value;
    const numValue = value === '' ? '' : parseFloat(value);
    setSelectedExpense(prev => ({ ...prev, [fieldName]: numValue }));
  };

  // Render field error
  const renderFieldError = (fieldName) => {
    const error = fieldErrors[fieldName];
    return error ? <div className="field-error">{error}</div> : null;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Format currency
  const formatCurrency = (amount, currency = 'RWF') => {
    const currencyMap = {
      'USD': 'en-US',
      'RWF': 'en-RW',
      'UGX': 'en-UG',
      'TZX': 'en-TZ'
    };
    
    const locale = currencyMap[currency] || 'en-US';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount || 0);
  };

  // View expense proof
  const viewExpenseProof = (expenseId) => {
    window.open(createApiUrl(`api/office-expenses/${expenseId}/proof`), '_blank');
  };

  // Load expenses on component mount
  useEffect(() => {
    if (token) {
      fetchExpenses();
      fetchDefaultExchangeRates();
    }
  }, [token]);

  return (
    <div className="office-expenses-page">
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <MobileHeader onMenuClick={() => setIsMenuOpen(true)} />
      
      <main className="office-expenses-main">
        <div className="office-expenses-content">
          {/* Header */}
          <div className="office-expenses-header">
            <h1>Office Expenses</h1>
            {isAdminOrOfficer() && (
              <button className="add-expense-btn" onClick={handleAddExpenseClick}>
                <span className="add-expense-text">
                  <span className="add-text">+ Add Expense</span>
                </span>
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="office-expenses-actions">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search expenses..."
                value={filters.search}
                onChange={handleSearchChange}
                className="search-input"
              />
              <div className="search-icon">🔍</div>
            </div>
            
            <div className="filters-container">
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="filter-date-input"
                placeholder="Start Date"
              />

              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="filter-date-input"
                placeholder="End Date"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Expenses List */}
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading expenses...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="empty-state">
              <p>No expenses found</p>
            </div>
          ) : (
            <>
              <div className="expenses-grid">
                {expenses.map((expense) => (
                  <div key={expense._id} className="expense-card">
                    <div className="expense-header">
                      <h3>{expense.title}</h3>
                    </div>
                    
                    <div className="expense-details">
                      <div className="detail-row">
                        <span className="detail-label">Amount:</span>
                        <span className="detail-value">{formatCurrency(expense.amount, expense.currency)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Date:</span>
                        <span className="detail-value">{formatDate(expense.date)}</span>
                      </div>
                      {expense.description && (
                        <div className="detail-row">
                          <span className="detail-label">Description:</span>
                          <span className="detail-value">{expense.description}</span>
                        </div>
                      )}
                    </div>

                    <div className="expense-actions">
                      <button
                        className="view-btn"
                        onClick={() => handleViewDetailsClick(expense)}
                      >
                        View Details
                      </button>
                      {isAdminOrOfficer() && (
                        <>
                          <button
                            className="edit-btn"
                            onClick={() => handleEditExpenseClick(expense)}
                          >
                            Edit
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteClick(expense)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="pagination-btn"
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}

          {/* Add Expense Modal */}
          {showAddModal && (
            <div className="modal-overlay" onClick={handleCloseModal}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Add Office Expense</h2>
                  <button className="modal-close" onClick={handleCloseModal}>×</button>
                </div>
                
                <form onSubmit={handleAddExpense} className="expense-form">
                  <div className="form-group">
                    <label htmlFor="title">Title *</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={newExpense.title}
                      onChange={handleInputChange}
                      required
                      placeholder="Expense title"
                    />
                    {renderFieldError('title')}
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={newExpense.description}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Expense description"
                    />
                    {renderFieldError('description')}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="amount">Amount *</label>
                      <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={newExpense.amount}
                        onChange={handleInputChange}
                        onBlur={(e) => handleNumberBlur(e, 'amount')}
                        step="0.01"
                        min="0"
                        required
                        placeholder="0.00"
                      />
                      {renderFieldError('amount')}
                    </div>

                    <div className="form-group">
                      <label htmlFor="currency">Currency *</label>
                      <select
                        id="currency"
                        name="currency"
                        value={newExpense.currency}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="RWF">RWF</option>
                        <option value="USD">USD</option>
                        <option value="UGX">UGX</option>
                        <option value="TZX">TZX</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="date">Date *</label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={newExpense.date}
                      onChange={handleInputChange}
                      required
                      max={new Date().toISOString().split('T')[0]}
                    />
                    {renderFieldError('date')}
                  </div>

                  <div className="form-group">
                    <label htmlFor="attachment">Proof of Expense (Optional)</label>
                    <input
                      type="file"
                      id="attachment"
                      name="attachment"
                      onChange={handleFileChange}
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf"
                    />
                    {newExpense.attachment && (
                      <span style={{ padding: '4px', color: '#3b82f6', fontSize: '0.875rem', display: 'block', marginTop: '4px' }}>
                        📎 {newExpense.attachment.name}
                      </span>
                    )}
                    {renderFieldError('attachment')}
                  </div>

                  {error && <div className="error-message">{error}</div>}

                  <div className="form-actions">
                    <button type="button" onClick={handleCloseModal} className="btn-cancel">
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting} className="btn-submit">
                      {submitting ? 'Adding...' : 'Add Expense'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Expense Modal */}
          {showEditModal && selectedExpense && (
            <div className="modal-overlay" onClick={handleCloseModal}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Edit Office Expense</h2>
                  <button className="modal-close" onClick={handleCloseModal}>×</button>
                </div>
                
                <form onSubmit={handleUpdateExpense} className="expense-form">
                  <div className="form-group">
                    <label htmlFor="edit-title">Title *</label>
                    <input
                      type="text"
                      id="edit-title"
                      name="title"
                      value={selectedExpense.title}
                      onChange={handleEditInputChange}
                      required
                    />
                    {renderFieldError('title')}
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-description">Description</label>
                    <textarea
                      id="edit-description"
                      name="description"
                      value={selectedExpense.description || ''}
                      onChange={handleEditInputChange}
                      rows="3"
                    />
                    {renderFieldError('description')}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="edit-amount">Amount *</label>
                      <input
                        type="number"
                        id="edit-amount"
                        name="amount"
                        value={selectedExpense.amount}
                        onChange={handleEditInputChange}
                        onBlur={(e) => handleEditNumberBlur(e, 'amount')}
                        step="0.01"
                        min="0"
                        required
                      />
                      {renderFieldError('amount')}
                    </div>

                    <div className="form-group">
                      <label htmlFor="edit-currency">Currency *</label>
                      <select
                        id="edit-currency"
                        name="currency"
                        value={selectedExpense.currency}
                        onChange={handleEditInputChange}
                        required
                      >
                        <option value="RWF">RWF</option>
                        <option value="USD">USD</option>
                        <option value="UGX">UGX</option>
                        <option value="TZX">TZX</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-date">Date *</label>
                    <input
                      type="date"
                      id="edit-date"
                      name="date"
                      value={selectedExpense.date ? new Date(selectedExpense.date).toISOString().split('T')[0] : ''}
                      onChange={handleEditInputChange}
                      required
                      max={new Date().toISOString().split('T')[0]}
                    />
                    {renderFieldError('date')}
                  </div>

                  <div className="form-group">
                    <label htmlFor="edit-attachment">Proof of Expense (Optional)</label>
                    <input
                      type="file"
                      id="edit-attachment"
                      name="attachment"
                      onChange={handleEditFileChange}
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf"
                    />
                    {selectedExpense.attachmentFile && (
                      <span style={{ padding: '4px', color: '#3b82f6', fontSize: '0.875rem', display: 'block', marginTop: '4px' }}>
                        📎 {selectedExpense.attachmentFile.name} (New)
                      </span>
                    )}
                    {selectedExpense.attachment && !selectedExpense.attachmentFile && (
                      <div style={{ marginTop: '8px' }}>
                        <span style={{ padding: '4px', color: '#059669', fontSize: '0.875rem', display: 'block', marginBottom: '4px' }}>
                          📎 {selectedExpense.attachment.filename} (Current)
                        </span>
                        <button
                          type="button"
                          onClick={() => viewExpenseProof(selectedExpense._id)}
                          className="btn-view-proof"
                        >
                          View Current Proof
                        </button>
                      </div>
                    )}
                    {renderFieldError('attachment')}
                  </div>

                  {error && <div className="error-message">{error}</div>}

                  <div className="form-actions">
                    <button type="button" onClick={handleCloseModal} className="btn-cancel">
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting} className="btn-submit">
                      {submitting ? 'Updating...' : 'Update Expense'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* View Details Modal */}
          {showDetailsModal && selectedExpense && (
            <div className="modal-overlay" onClick={handleCloseModal}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Expense Details</h2>
                  <button className="modal-close" onClick={handleCloseModal}>×</button>
                </div>
                
                <div className="expense-details-view">
                  <div className="detail-section">
                    <h3>{selectedExpense.title}</h3>
                  </div>

                  <div className="detail-section">
                    <div className="detail-item">
                      <span className="detail-label">Amount:</span>
                      <span className="detail-value">{formatCurrency(selectedExpense.amount, selectedExpense.currency)}</span>
                    </div>
                    {selectedExpense.currency !== 'RWF' && (
                      <div className="detail-item">
                        <span className="detail-label">Amount in RWF:</span>
                        <span className="detail-value">{formatCurrency(selectedExpense.amountInRWF || (selectedExpense.amount * (selectedExpense.exchangeRate || 1)), 'RWF')}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <span className="detail-label">Date:</span>
                      <span className="detail-value">{formatDate(selectedExpense.date)}</span>
                    </div>
                    {selectedExpense.description && (
                      <div className="detail-item">
                        <span className="detail-label">Description:</span>
                        <span className="detail-value">{selectedExpense.description}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <span className="detail-label">Created By:</span>
                      <span className="detail-value">{selectedExpense.createdBy?.email || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Created At:</span>
                      <span className="detail-value">{formatDate(selectedExpense.createdAt)}</span>
                    </div>
                  </div>

                  {selectedExpense.attachment && (
                    <div className="detail-section">
                      <div className="detail-item">
                        <span className="detail-label">Proof of Expense:</span>
                        <button
                          onClick={() => viewExpenseProof(selectedExpense._id)}
                          className="btn-view-proof"
                        >
                          View Proof
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="modal-actions">
                    <button onClick={handleCloseModal} className="btn-close">
                      Close
                    </button>
                    {isAdminOrOfficer() && (
                      <button
                        onClick={() => {
                          setShowDetailsModal(false);
                          handleEditExpenseClick(selectedExpense);
                        }}
                        className="btn-edit"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && expenseToDelete && (
            <div className="modal-overlay" onClick={handleCloseModal}>
              <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Delete Expense</h2>
                  <button className="modal-close" onClick={handleCloseModal}>×</button>
                </div>
                
                <div className="modal-body">
                  <p>Are you sure you want to delete the expense "{expenseToDelete.title}"?</p>
                  <p className="warning-text">This action cannot be undone.</p>
                </div>

                <div className="modal-actions">
                  <button onClick={handleCloseModal} className="btn-cancel">
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteExpense}
                    disabled={deletingExpenses[expenseToDelete._id]}
                    className="btn-delete"
                  >
                    {deletingExpenses[expenseToDelete._id] ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OfficeExpenses;

