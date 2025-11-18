import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createApiUrl, createAuthHeaders } from '../utils/apiConfig';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import './Customers.css';

const Customers = () => {
  const { token, isAdminOrOfficer } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [customerJourneys, setCustomerJourneys] = useState([]);
  const [loadingJourneys, setLoadingJourneys] = useState(false);
  const [journeysLoaded, setJourneysLoaded] = useState(false);
  
  // Form states
  const [submitting, setSubmitting] = useState(false);
  const [deletingCustomers, setDeletingCustomers] = useState({});
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    country: 'Rwanda',
    phone: ''
  });
  
  // Countries list
  const countries = [
    'Rwanda', 'Uganda', 'Tanzania', 'Kenya', 'Burundi', 'DRC', 'South Sudan',
    'Ethiopia', 'Somalia', 'Sudan', 'Eritrea', 'Djibouti', 'Other'
  ];
  
  // Pagination and filters
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    country: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // Fetch customers
  const fetchCustomers = async (page = 1, limit = 10, search = '', country = '', sortBy = 'name', sortOrder = 'asc') => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        country,
        sortBy,
        sortOrder
      });

      const response = await fetch(createApiUrl(`api/customers?${queryParams}`), {
        headers: createAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data = await response.json();
      setCustomers(data.data);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch customer details
  const fetchCustomerDetails = async (customerId) => {
    try {
      const response = await fetch(createApiUrl(`api/customers/${customerId}`), {
        headers: createAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customer details');
      }

      const data = await response.json();
      return data.data;
    } catch (err) {
      console.error('Error fetching customer details:', err);
      throw err;
    }
  };

  // Handle search change
  const handleSearchChange = (e) => {
    const search = e.target.value;
    setFilters(prev => ({ ...prev, search }));
    fetchCustomers(1, pagination.limit, search, filters.country, filters.sortBy, filters.sortOrder);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    fetchCustomers(1, pagination.limit, filters.search, value, filters.sortBy, filters.sortOrder);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    fetchCustomers(newPage, pagination.limit, filters.search, filters.country, filters.sortBy, filters.sortOrder);
  };

  // Handle add customer click
  const handleAddCustomerClick = () => {
    setNewCustomer({
      name: '',
      country: 'Rwanda',
      phone: ''
    });
    setError(null);
    setFieldErrors({});
    setShowAddModal(true);
  };

  // Handle edit customer click
  const handleEditCustomerClick = async (customer) => {
    try {
      const customerDetails = await fetchCustomerDetails(customer._id);
      setSelectedCustomer(customerDetails);
      setError(null);
      setFieldErrors({});
      setShowEditModal(true);
    } catch (err) {
      setError('Failed to load customer details');
    }
  };

  // Fetch customer journeys
  const fetchCustomerJourneys = async (customerId) => {
    try {
      setLoadingJourneys(true);
      const response = await fetch(createApiUrl(`api/drives/by-customer/${customerId}?limit=50`), {
        headers: createAuthHeaders(token)
      });
      if (!response.ok) throw new Error('Failed to fetch customer journeys');
      const data = await response.json();
      setCustomerJourneys(data.data || []);
      setJourneysLoaded(true);
    } catch (err) {
      console.error('Error fetching customer journeys:', err);
      setCustomerJourneys([]);
      setJourneysLoaded(true);
    } finally {
      setLoadingJourneys(false);
    }
  };

  // Handle view details click
  const handleViewDetailsClick = async (customer) => {
    try {
      const customerDetails = await fetchCustomerDetails(customer._id);
      setSelectedCustomer(customerDetails);
      setShowDetailsModal(true);
      // Reset journeys state when opening details
      setCustomerJourneys([]);
      setJourneysLoaded(false);
    } catch (err) {
      setError('Failed to load customer details');
    }
  };

  // Handle delete customer click
  const handleDeleteCustomerClick = (customer) => {
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  // Handle delete confirmation
  const handleDeleteCustomerConfirm = async () => {
    if (!customerToDelete) return;

    try {
      setDeletingCustomers(prev => ({ ...prev, [customerToDelete._id]: true }));
      
      const response = await fetch(createApiUrl(`api/customers/${customerToDelete._id}`), {
        method: 'DELETE',
        headers: createAuthHeaders(token)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete customer');
      }

      // Refresh customers list
      await fetchCustomers(pagination.page, pagination.limit, filters.search, filters.country, filters.sortBy, filters.sortOrder);
      setShowDeleteModal(false);
      setCustomerToDelete(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingCustomers(prev => ({ ...prev, [customerToDelete._id]: false }));
    }
  };

  // Handle delete modal close
  const handleDeleteModalClose = () => {
    setShowDeleteModal(false);
    setCustomerToDelete(null);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (showAddModal) {
      setNewCustomer(prev => ({ ...prev, [name]: value }));
    } else if (showEditModal && selectedCustomer) {
      setSelectedCustomer(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle form submit (Add)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const response = await fetch(createApiUrl('api/customers'), {
        method: 'POST',
        headers: createAuthHeaders(token),
        body: JSON.stringify(newCustomer)
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          // Parse Joi validation errors
          const errors = {};
          data.errors.forEach(error => {
            const field = error.path ? error.path[0] : 'general';
            errors[field] = error.message;
          });
          setFieldErrors(errors);
        } else {
          setError(data.message || 'Failed to create customer');
        }
        return;
      }

      // Success
      setShowAddModal(false);
      setNewCustomer({
        name: '',
        country: 'Rwanda',
        phone: ''
      });
      
      // Refresh customers list
      await fetchCustomers(pagination.page, pagination.limit, filters.search, filters.country, filters.sortBy, filters.sortOrder);
    } catch (err) {
      setError('Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle update customer
  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const response = await fetch(createApiUrl(`api/customers/${selectedCustomer._id}`), {
        method: 'PUT',
        headers: createAuthHeaders(token),
        body: JSON.stringify(selectedCustomer)
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          // Parse Joi validation errors
          const errors = {};
          data.errors.forEach(error => {
            const field = error.path ? error.path[0] : 'general';
            errors[field] = error.message;
          });
          setFieldErrors(errors);
        } else {
          setError(data.message || 'Failed to update customer');
        }
        return;
      }

      // Success
      setShowEditModal(false);
      setSelectedCustomer(null);
      
      // Refresh customers list
      await fetchCustomers(pagination.page, pagination.limit, filters.search, filters.country, filters.sortBy, filters.sortOrder);
    } catch (err) {
      setError('Failed to update customer');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDetailsModal(false);
    setSelectedCustomer(null);
    setCustomerJourneys([]);
    setJourneysLoaded(false);
    setError(null);
    setFieldErrors({});
  };

  // Render field error
  const renderFieldError = (fieldName) => {
    const error = fieldErrors[fieldName];
    return error ? <div className="field-error">{error}</div> : null;
  };

  // Get customer initials
  const getCustomerInitials = (name) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
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

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'started': return 'status-badge status-started';
      case 'completed': return 'status-badge status-completed';
      default: return 'status-badge';
    }
  };

  // Load customers on component mount
  useEffect(() => {
    if (token) {
      fetchCustomers();
    }
  }, [token]);

  if (loading && customers.length === 0) {
    return (
      <div className="customers-page">
        <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        <div className="customers-main">
          <MobileHeader onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} isMenuOpen={isMenuOpen} />
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading customers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="customers-page">
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <div className="customers-main">
        <MobileHeader onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} isMenuOpen={isMenuOpen} />
        
        <div className="customers-content">
          <div className="customers-header">
            <h1>Customers</h1>
            {isAdminOrOfficer() && (
              <button 
                className="add-customer-btn"
                onClick={handleAddCustomerClick}
              >
                <div className="add-customer-text">
                  <span className="add-text">Add</span>
                  <span className="customer-text">Customer</span>
                </div>
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="customers-actions">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search customers..."
                value={filters.search}
                onChange={handleSearchChange}
                className="search-input"
              />
              <div className="search-icon">🔍</div>
            </div>
            
            <div className="filters-container">
              <select
                name="country"
                value={filters.country}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">All Countries</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Customers Grid */}
          <div className="customers-grid">
            {customers.length === 0 ? (
              <div className="no-customers">
                <p>No customers found</p>
              </div>
            ) : (
              customers.map((customer) => (
                <div key={customer._id} className="customer-card">
                  <div className="customer-header">
                    <div className="customer-avatar">
                      {getCustomerInitials(customer.name)}
                    </div>
                    <div className="customer-info">
                      <h3 className="customer-name">{customer.name}</h3>
                      <p className="customer-phone">{customer.phone}</p>
                    </div>
                  </div>
                  
                  <div className="customer-details">
                    <div className="detail-row">
                      <span className="detail-label">Country:</span>
                      <span className="detail-value">{customer.country}</span>
                    </div>
                  </div>

                  <div className="customer-actions">
                    <button
                      className="view-details-btn"
                      onClick={() => handleViewDetailsClick(customer)}
                    >
                      View Details
                    </button>
                    {isAdminOrOfficer() && (
                      <>
                        <button
                          className="edit-customer-btn"
                          onClick={() => handleEditCustomerClick(customer)}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-customer-btn"
                          onClick={() => handleDeleteCustomerClick(customer)}
                          disabled={deletingCustomers[customer._id]}
                        >
                          {deletingCustomers[customer._id] ? 'Deleting...' : 'Delete'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </button>
              
              <span className="pagination-info">
                Page {pagination.page} of {pagination.pages}
              </span>
              
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Customer</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            {error && (
              <div className="modal-error-message">{error}</div>
            )}
            
            <form onSubmit={handleSubmit} className="customer-form">
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newCustomer.name}
                  onChange={handleInputChange}
                  required
                />
                {renderFieldError('name')}
              </div>
              
              <div className="form-group">
                <label htmlFor="country">Country *</label>
                <select
                  id="country"
                  name="country"
                  value={newCustomer.country}
                  onChange={handleInputChange}
                  required
                >
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
                {renderFieldError('country')}
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={newCustomer.phone}
                  onChange={handleInputChange}
                  required
                />
                {renderFieldError('phone')}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && selectedCustomer && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Customer</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            {error && (
              <div className="modal-error-message">{error}</div>
            )}
            
            <form onSubmit={handleUpdateCustomer} className="customer-form">
              <div className="form-group">
                <label htmlFor="edit-name">Name *</label>
                <input
                  type="text"
                  id="edit-name"
                  name="name"
                  value={selectedCustomer.name}
                  onChange={handleInputChange}
                  required
                />
                {renderFieldError('name')}
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-country">Country *</label>
                <select
                  id="edit-country"
                  name="country"
                  value={selectedCustomer.country}
                  onChange={handleInputChange}
                  required
                >
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
                {renderFieldError('country')}
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-phone">Phone Number *</label>
                <input
                  type="tel"
                  id="edit-phone"
                  name="phone"
                  value={selectedCustomer.phone}
                  onChange={handleInputChange}
                  required
                />
                {renderFieldError('phone')}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Update Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {showDetailsModal && selectedCustomer && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content customer-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Customer Details</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <div className="customer-details-content">
              <div className="detail-section">
                <h3>Customer Information</h3>
                <div className="detail-row">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{selectedCustomer.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Country:</span>
                  <span className="detail-value">{selectedCustomer.country}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{selectedCustomer.phone}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Created:</span>
                  <span className="detail-value">
                    {new Date(selectedCustomer.createdAt).toLocaleDateString()} at {new Date(selectedCustomer.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Last Updated:</span>
                  <span className="detail-value">
                    {new Date(selectedCustomer.updatedAt).toLocaleDateString()} at {new Date(selectedCustomer.updatedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {!journeysLoaded && (
                <div className="detail-section" style={{ textAlign: 'center', padding: '20px 0' }}>
                  <button
                    type="button"
                    onClick={() => fetchCustomerJourneys(selectedCustomer._id)}
                    className="btn-primary"
                    disabled={loadingJourneys}
                  >
                    {loadingJourneys ? 'Loading...' : 'Load Journeys'}
                  </button>
                </div>
              )}

              {journeysLoaded && (
                <div className="detail-section">
                  <h3>Associated Journeys ({customerJourneys.length})</h3>
                  {loadingJourneys ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                      <p>Loading journeys...</p>
                    </div>
                  ) : customerJourneys.length === 0 ? (
                    <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>No journeys found for this customer.</p>
                  ) : (
                    <div className="journeys-list">
                      {customerJourneys.map((journey) => (
                        <div key={journey._id} className="journey-item">
                          <div className="journey-item-header">
                            <div className="journey-route">
                              <strong>{journey.departureCity} → {journey.destinationCity}</strong>
                            </div>
                            <span className={getStatusBadgeClass(journey.status)}>
                              {journey.status}
                            </span>
                          </div>
                          <div className="journey-item-details">
                            <div className="journey-detail-row">
                              <span className="journey-detail-label">Date:</span>
                              <span className="journey-detail-value">{formatDate(journey.date)}</span>
                            </div>
                            <div className="journey-detail-row">
                              <span className="journey-detail-label">Driver:</span>
                              <span className="journey-detail-value">{journey.driver?.fullName || 'N/A'}</span>
                            </div>
                            <div className="journey-detail-row">
                              <span className="journey-detail-label">Truck:</span>
                              <span className="journey-detail-value">{journey.truck?.plateNumber || 'N/A'}</span>
                            </div>
                            <div className="journey-detail-row">
                              <span className="journey-detail-label">Cargo:</span>
                              <span className="journey-detail-value">{journey.cargo}</span>
                            </div>
                            <div className="journey-detail-row">
                              <span className="journey-detail-label">Amount:</span>
                              <span className="journey-detail-value">
                                {formatCurrency(journey.pay?.totalAmount || 0, journey.pay?.currency || 'RWF')}
                              </span>
                            </div>
                            <div className="journey-detail-row">
                              <span className="journey-detail-label">Payment:</span>
                              <span className="journey-detail-value">
                                {journey.pay?.paidOption === 'full' ? 'Full Payment' : 'Installment'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={handleCloseModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && customerToDelete && (
        <div className="modal-overlay" onClick={handleDeleteModalClose}>
          <div className="modal-content delete-confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirmation-content">
              <div className="delete-warning-icon">⚠️</div>
              <h2>Delete Customer</h2>
              <div className="delete-customer-info">
                <p>Are you sure you want to delete this customer?</p>
                <div className="customer-info">
                  <strong>{customerToDelete.name}</strong>
                  <span>{customerToDelete.phone}</span>
                </div>
              </div>
              <p className="delete-warning-text">
                This action cannot be undone. If the customer has associated journeys, deletion will be prevented.
              </p>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={handleDeleteModalClose}>
                  Cancel
                </button>
                <button 
                  className="btn-delete" 
                  onClick={handleDeleteCustomerConfirm}
                  disabled={deletingCustomers[customerToDelete._id]}
                >
                  {deletingCustomers[customerToDelete._id] ? 'Deleting...' : 'Delete Customer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;

