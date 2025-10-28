import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createApiUrl, createAuthHeaders } from '../utils/apiConfig';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import './Drivers.css';

const Drivers = () => {
  const { token } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverToDelete, setDriverToDelete] = useState(null);
  
  // Form states
  const [submitting, setSubmitting] = useState(false);
  const [deletingDrivers, setDeletingDrivers] = useState({});
  const [newDriver, setNewDriver] = useState({
    fullName: '',
    phone: '',
    email: '',
    nationalId: '',
    licenseNumber: '',
    address: '',
    hireDate: '',
    status: 'active'
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
    status: '',
    sortBy: 'fullName',
    sortOrder: 'asc'
  });

  // Fetch drivers
  const fetchDrivers = async (page = 1, limit = 10, search = '', status = '', sortBy = 'fullName', sortOrder = 'asc') => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        status,
        sortBy,
        sortOrder
      });

      const response = await fetch(createApiUrl(`api/drivers?${queryParams}`), {
        headers: createAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch drivers');
      }

      const data = await response.json();
      setDrivers(data.data);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch driver details
  const fetchDriverDetails = async (driverId) => {
    try {
      const response = await fetch(createApiUrl(`api/drivers/${driverId}`), {
        headers: createAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch driver details');
      }

      const data = await response.json();
      return data.data;
    } catch (err) {
      console.error('Error fetching driver details:', err);
      throw err;
    }
  };

  // Handle search change
  const handleSearchChange = (e) => {
    const search = e.target.value;
    setFilters(prev => ({ ...prev, search }));
    fetchDrivers(1, pagination.limit, search, filters.status, filters.sortBy, filters.sortOrder);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    fetchDrivers(1, pagination.limit, filters.search, value, filters.sortBy, filters.sortOrder);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    fetchDrivers(newPage, pagination.limit, filters.search, filters.status, filters.sortBy, filters.sortOrder);
  };

  // Handle add driver click
  const handleAddDriverClick = () => {
    setNewDriver({
      fullName: '',
      phone: '',
      email: '',
      nationalId: '',
      licenseNumber: '',
      address: '',
      hireDate: '',
      status: 'active'
    });
    setError(null);
    setFieldErrors({});
    setShowAddModal(true);
  };

  // Handle edit driver click
  const handleEditDriverClick = async (driver) => {
    try {
      const driverDetails = await fetchDriverDetails(driver._id);
      setSelectedDriver(driverDetails);
      setError(null);
      setFieldErrors({});
      setShowEditModal(true);
    } catch (err) {
      setError('Failed to load driver details');
    }
  };

  // Handle view details click
  const handleViewDetailsClick = async (driver) => {
    try {
      const driverDetails = await fetchDriverDetails(driver._id);
      setSelectedDriver(driverDetails);
      setShowDetailsModal(true);
    } catch (err) {
      setError('Failed to load driver details');
    }
  };

  // Handle delete driver click
  const handleDeleteDriverClick = (driver) => {
    setDriverToDelete(driver);
    setShowDeleteModal(true);
  };

  // Handle delete confirmation
  const handleDeleteDriverConfirm = async () => {
    if (!driverToDelete) return;

    try {
      setDeletingDrivers(prev => ({ ...prev, [driverToDelete._id]: true }));
      
      const response = await fetch(createApiUrl(`api/drivers/${driverToDelete._id}`), {
        method: 'DELETE',
        headers: createAuthHeaders(token)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete driver');
      }

      // Refresh drivers list
      await fetchDrivers(pagination.page, pagination.limit, filters.search, filters.status, filters.sortBy, filters.sortOrder);
      setShowDeleteModal(false);
      setDriverToDelete(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingDrivers(prev => ({ ...prev, [driverToDelete._id]: false }));
    }
  };

  // Handle delete modal close
  const handleDeleteModalClose = () => {
    setShowDeleteModal(false);
    setDriverToDelete(null);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (showAddModal) {
      setNewDriver(prev => ({ ...prev, [name]: value }));
    } else if (showEditModal && selectedDriver) {
      setSelectedDriver(prev => ({ ...prev, [name]: value }));
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
      const response = await fetch(createApiUrl('api/drivers'), {
        method: 'POST',
        headers: createAuthHeaders(token),
        body: JSON.stringify(newDriver)
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
          setError(data.message || 'Failed to create driver');
        }
        return;
      }

      // Success
      setShowAddModal(false);
      setNewDriver({
        fullName: '',
        phone: '',
        email: '',
        nationalId: '',
        licenseNumber: '',
        address: '',
        hireDate: '',
        status: 'active'
      });
      
      // Refresh drivers list
      await fetchDrivers(pagination.page, pagination.limit, filters.search, filters.status, filters.sortBy, filters.sortOrder);
    } catch (err) {
      setError('Failed to create driver');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle update driver
  const handleUpdateDriver = async (e) => {
    e.preventDefault();
    if (!selectedDriver) return;

    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const response = await fetch(createApiUrl(`api/drivers/${selectedDriver._id}`), {
        method: 'PUT',
        headers: createAuthHeaders(token),
        body: JSON.stringify(selectedDriver)
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
          setError(data.message || 'Failed to update driver');
        }
        return;
      }

      // Success
      setShowEditModal(false);
      setSelectedDriver(null);
      
      // Refresh drivers list
      await fetchDrivers(pagination.page, pagination.limit, filters.search, filters.status, filters.sortBy, filters.sortOrder);
    } catch (err) {
      setError('Failed to update driver');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDetailsModal(false);
    setSelectedDriver(null);
    setError(null);
    setFieldErrors({});
  };

  // Render field error
  const renderFieldError = (fieldName) => {
    const error = fieldErrors[fieldName];
    return error ? <div className="field-error">{error}</div> : null;
  };

  // Get driver initials
  const getDriverInitials = (fullName) => {
    if (!fullName) return '??';
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return 'status-badge status-active';
      case 'inactive': return 'status-badge status-inactive';
      case 'suspended': return 'status-badge status-suspended';
      default: return 'status-badge';
    }
  };

  // Load drivers on component mount
  useEffect(() => {
    if (token) {
      fetchDrivers();
    }
  }, [token]);

  if (loading && drivers.length === 0) {
    return (
      <div className="drivers-page">
        <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        <div className="drivers-main">
          <MobileHeader onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} isMenuOpen={isMenuOpen} />
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading drivers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="drivers-page">
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <div className="drivers-main">
        <MobileHeader onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} isMenuOpen={isMenuOpen} />
        
        <div className="drivers-content">
          <div className="drivers-header">
            <h1>Drivers</h1>
            <button 
              className="add-driver-btn"
              onClick={handleAddDriverClick}
            >
              <div className="add-driver-text">
                <span className="add-text">Add</span>
                <span className="driver-text">Driver</span>
              </div>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="drivers-actions">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search drivers..."
                value={filters.search}
                onChange={handleSearchChange}
                className="search-input"
              />
              <div className="search-icon">🔍</div>
            </div>
            
            <div className="filters-container">
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Drivers Grid */}
          <div className="drivers-grid">
            {drivers.map((driver) => (
              <div key={driver._id} className="driver-card">
                <div className="driver-header">
                  <div className="driver-avatar">
                    {getDriverInitials(driver.fullName)}
                  </div>
                  <div className="driver-info">
                    <h3 className="driver-name">{driver.fullName}</h3>
                    <p className="driver-phone">{driver.phone}</p>
                  </div>
                  <span className={getStatusBadgeClass(driver.status)}>
                    {driver.status}
                  </span>
                </div>
                
                <div className="driver-details">
                  <div className="detail-row">
                    <span className="detail-label">License:</span>
                    <span className="detail-value">{driver.licenseNumber}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">National ID:</span>
                    <span className="detail-value">{driver.nationalId}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Hire Date:</span>
                    <span className="detail-value">{formatDate(driver.hireDate)}</span>
                  </div>
                </div>

                <div className="driver-actions">
                  <button
                    className="view-details-btn"
                    onClick={() => handleViewDetailsClick(driver)}
                  >
                    View Details
                  </button>
                  <button
                    className="edit-driver-btn"
                    onClick={() => handleEditDriverClick(driver)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-driver-btn"
                    onClick={() => handleDeleteDriverClick(driver)}
                    disabled={deletingDrivers[driver._id]}
                  >
                    {deletingDrivers[driver._id] ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
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

      {/* Add Driver Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Driver</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            {error && (
              <div className="modal-error-message">{error}</div>
            )}
            
            <form onSubmit={handleSubmit} className="driver-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fullName">Full Name *</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={newDriver.fullName}
                    onChange={handleInputChange}
                    required
                  />
                  {renderFieldError('fullName')}
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Phone *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={newDriver.phone}
                    onChange={handleInputChange}
                    required
                  />
                  {renderFieldError('phone')}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={newDriver.email}
                    onChange={handleInputChange}
                  />
                  {renderFieldError('email')}
                </div>
                
                <div className="form-group">
                  <label htmlFor="nationalId">National ID *</label>
                  <input
                    type="text"
                    id="nationalId"
                    name="nationalId"
                    value={newDriver.nationalId}
                    onChange={handleInputChange}
                    required
                  />
                  {renderFieldError('nationalId')}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="licenseNumber">License Number *</label>
                  <input
                    type="text"
                    id="licenseNumber"
                    name="licenseNumber"
                    value={newDriver.licenseNumber}
                    onChange={handleInputChange}
                    required
                  />
                  {renderFieldError('licenseNumber')}
                </div>
                
                <div className="form-group">
                  <label htmlFor="hireDate">Hire Date</label>
                  <input
                    type="date"
                    id="hireDate"
                    name="hireDate"
                    value={newDriver.hireDate}
                    onChange={handleInputChange}
                  />
                  {renderFieldError('hireDate')}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="address">Address *</label>
                <textarea
                  id="address"
                  name="address"
                  value={newDriver.address}
                  onChange={handleInputChange}
                  rows="3"
                  required
                />
                {renderFieldError('address')}
              </div>

              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={newDriver.status}
                  onChange={handleInputChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
                {renderFieldError('status')}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Driver Modal */}
      {showEditModal && selectedDriver && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Driver</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            {error && (
              <div className="modal-error-message">{error}</div>
            )}
            
            <form onSubmit={handleUpdateDriver} className="driver-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-fullName">Full Name *</label>
                  <input
                    type="text"
                    id="edit-fullName"
                    name="fullName"
                    value={selectedDriver.fullName}
                    onChange={handleInputChange}
                    required
                  />
                  {renderFieldError('fullName')}
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit-phone">Phone *</label>
                  <input
                    type="tel"
                    id="edit-phone"
                    name="phone"
                    value={selectedDriver.phone}
                    onChange={handleInputChange}
                    required
                  />
                  {renderFieldError('phone')}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-email">Email</label>
                  <input
                    type="email"
                    id="edit-email"
                    name="email"
                    value={selectedDriver.email || ''}
                    onChange={handleInputChange}
                  />
                  {renderFieldError('email')}
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit-nationalId">National ID *</label>
                  <input
                    type="text"
                    id="edit-nationalId"
                    name="nationalId"
                    value={selectedDriver.nationalId}
                    onChange={handleInputChange}
                    required
                  />
                  {renderFieldError('nationalId')}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-licenseNumber">License Number *</label>
                  <input
                    type="text"
                    id="edit-licenseNumber"
                    name="licenseNumber"
                    value={selectedDriver.licenseNumber}
                    onChange={handleInputChange}
                    required
                  />
                  {renderFieldError('licenseNumber')}
                </div>
                
                <div className="form-group">
                  <label htmlFor="edit-hireDate">Hire Date</label>
                  <input
                    type="date"
                    id="edit-hireDate"
                    name="hireDate"
                    value={selectedDriver.hireDate ? selectedDriver.hireDate.split('T')[0] : ''}
                    onChange={handleInputChange}
                  />
                  {renderFieldError('hireDate')}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="edit-address">Address *</label>
                <textarea
                  id="edit-address"
                  name="address"
                  value={selectedDriver.address}
                  onChange={handleInputChange}
                  rows="3"
                  required
                />
                {renderFieldError('address')}
              </div>

              <div className="form-group">
                <label htmlFor="edit-status">Status</label>
                <select
                  id="edit-status"
                  name="status"
                  value={selectedDriver.status}
                  onChange={handleInputChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
                {renderFieldError('status')}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Update Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Driver Details Modal */}
      {showDetailsModal && selectedDriver && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content driver-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Driver Details</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <div className="driver-details-content">
              <div className="detail-section">
                <h3>Personal Information</h3>
                <div className="detail-row">
                  <span className="detail-label">Full Name:</span>
                  <span className="detail-value">{selectedDriver.fullName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{selectedDriver.phone}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{selectedDriver.email || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">National ID:</span>
                  <span className="detail-value">{selectedDriver.nationalId}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>License Information</h3>
                <div className="detail-row">
                  <span className="detail-label">License Number:</span>
                  <span className="detail-value">{selectedDriver.licenseNumber}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Employment Information</h3>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`detail-value ${getStatusBadgeClass(selectedDriver.status)}`}>
                    {selectedDriver.status}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Hire Date:</span>
                  <span className="detail-value">{formatDate(selectedDriver.hireDate)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">{selectedDriver.address}</span>
                </div>
              </div>
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
      {showDeleteModal && driverToDelete && (
        <div className="modal-overlay" onClick={handleDeleteModalClose}>
          <div className="modal-content delete-confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirmation-content">
              <div className="delete-warning-icon">⚠️</div>
              <h2>Delete Driver</h2>
              <div className="delete-driver-info">
                <p>Are you sure you want to delete this driver?</p>
                <div className="driver-info">
                  <strong>{driverToDelete.fullName}</strong>
                  <span>{driverToDelete.phone}</span>
                </div>
              </div>
              <p className="delete-warning-text">
                This action cannot be undone. If the driver has associated drives, deletion will be prevented.
              </p>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={handleDeleteModalClose}>
                  Cancel
                </button>
                <button 
                  className="btn-delete" 
                  onClick={handleDeleteDriverConfirm}
                  disabled={deletingDrivers[driverToDelete._id]}
                >
                  {deletingDrivers[driverToDelete._id] ? 'Deleting...' : 'Delete Driver'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drivers;