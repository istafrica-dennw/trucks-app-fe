import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createApiUrl, createAuthHeaders } from '../utils/apiConfig';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import './Trucks.css';

const Trucks = () => {
  const { user, token } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [truckToDelete, setTruckToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingTrucks, setDeletingTrucks] = useState({});
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 10
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    make: ''
  });
  const [newTruck, setNewTruck] = useState({
    plateNumber: '',
    make: '',
    model: '',
    year: '',
    capacity: '',
    fuelType: 'diesel',
    status: 'active',
    color: '',
    mileage: '',
    notes: '',
    vin: '',
    lastServiceDate: '',
    nextServiceDate: '',
    insuranceExpiry: '',
    registrationExpiry: ''
  });

  // Fetch trucks from API
  const fetchTrucks = async (page = 1, searchFilters = filters) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(searchFilters.search && { search: searchFilters.search }),
        ...(searchFilters.status && { status: searchFilters.status }),
        ...(searchFilters.make && { make: searchFilters.make })
      });

      const response = await fetch(createApiUrl(`api/trucks?${queryParams}`), {
        headers: createAuthHeaders(token)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch trucks');
      }

      const data = await response.json();
      setTrucks(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch truck details
  const fetchTruckDetails = async (truckId) => {
    try {
      const response = await fetch(createApiUrl(`api/trucks/${truckId}`), {
        headers: createAuthHeaders(token)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch truck details');
      }

      const data = await response.json();
      return data.data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  useEffect(() => {
    if (token) {
      fetchTrucks();
    }
  }, [token]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setFilters(prev => ({ ...prev, search: value }));
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchTrucks(1, { ...filters, search: value });
    }, 500);
    
    return () => clearTimeout(timeoutId);
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    fetchTrucks(1, newFilters);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchTrucks(newPage);
    }
  };

  // Handle add truck click
  const handleAddTruckClick = () => {
    setError(null); // Clear any previous errors
    setFieldErrors({}); // Clear field errors
    setNewTruck({
      plateNumber: '',
      make: '',
      model: '',
      year: '',
      capacity: '',
      fuelType: 'diesel',
      status: 'active',
      color: '',
      mileage: '',
      notes: '',
      vin: '',
      lastServiceDate: '',
      nextServiceDate: '',
      insuranceExpiry: '',
      registrationExpiry: ''
    });
    setShowAddModal(true);
  };

  // Handle input change for new truck
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTruck(prev => ({ ...prev, [name]: value }));
  };

  // Handle submit new truck
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Client-side validation
      if (!newTruck.plateNumber.trim()) {
        throw new Error('Plate number is required');
      }
      if (!newTruck.make.trim()) {
        throw new Error('Make is required');
      }
      if (!newTruck.model.trim()) {
        throw new Error('Model is required');
      }
      if (!newTruck.year || newTruck.year < 1900 || newTruck.year > new Date().getFullYear() + 1) {
        throw new Error('Please enter a valid year');
      }
      if (!newTruck.capacity || newTruck.capacity <= 0) {
        throw new Error('Capacity must be greater than 0');
      }

      const response = await fetch(createApiUrl('api/trucks'), {
        method: 'POST',
        headers: createAuthHeaders(token),
        body: JSON.stringify(newTruck)
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle Joi validation errors
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const fieldErrorsObj = {};
          const generalErrors = [];
          
          errorData.errors.forEach(error => {
            // Extract field name from error path (e.g., "vin" from "vin is not allowed to be empty")
            const fieldMatch = error.message.match(/^"([^"]+)"\s/);
            if (fieldMatch) {
              const fieldName = fieldMatch[1];
              fieldErrorsObj[fieldName] = error.message;
            } else {
              generalErrors.push(error.message);
            }
          });
          
          setFieldErrors(fieldErrorsObj);
          
          if (generalErrors.length > 0) {
            throw new Error(generalErrors.join('\n'));
          } else {
            throw new Error('Please fix the validation errors below');
          }
        }
        
        throw new Error(errorData.message || 'Failed to create truck');
      }

      setShowAddModal(false);
      await fetchTrucks();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDetailsModal(false);
    setShowDeleteModal(false);
    setSelectedTruck(null);
    setTruckToDelete(null);
    setError(null);
    setFieldErrors({});
  };

  // Handle edit truck click
  const handleEditTruckClick = async (truckId) => {
    setError(null); // Clear any previous errors
    setFieldErrors({}); // Clear field errors
    const truckDetails = await fetchTruckDetails(truckId);
    if (truckDetails) {
      setSelectedTruck(truckDetails);
      setShowEditModal(true);
    }
  };

  // Handle update truck
  const handleUpdateTruck = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(createApiUrl(`api/trucks/${selectedTruck._id}`), {
        method: 'PUT',
        headers: createAuthHeaders(token),
        body: JSON.stringify(selectedTruck)
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle Joi validation errors
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const fieldErrorsObj = {};
          const generalErrors = [];
          
          errorData.errors.forEach(error => {
            // Extract field name from error path (e.g., "vin" from "vin is not allowed to be empty")
            const fieldMatch = error.message.match(/^"([^"]+)"\s/);
            if (fieldMatch) {
              const fieldName = fieldMatch[1];
              fieldErrorsObj[fieldName] = error.message;
            } else {
              generalErrors.push(error.message);
            }
          });
          
          setFieldErrors(fieldErrorsObj);
          
          if (generalErrors.length > 0) {
            throw new Error(generalErrors.join('\n'));
          } else {
            throw new Error('Please fix the validation errors below');
          }
        }
        
        throw new Error(errorData.message || 'Failed to update truck');
      }

      setShowEditModal(false);
      await fetchTrucks();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle view details click
  const handleViewDetailsClick = async (truckId) => {
    const truckDetails = await fetchTruckDetails(truckId);
    if (truckDetails) {
      setSelectedTruck(truckDetails);
      setShowDetailsModal(true);
    }
  };

  // Handle delete truck click
  const handleDeleteTruckClick = (truck) => {
    setTruckToDelete(truck);
    setShowDeleteModal(true);
  };

  // Handle delete truck confirmation
  const handleDeleteTruckConfirm = async () => {
    if (!truckToDelete) return;

    setDeletingTrucks(prev => ({ ...prev, [truckToDelete._id]: true }));
    setError(null);

    try {
      const response = await fetch(createApiUrl(`api/trucks/${truckToDelete._id}`), {
        method: 'DELETE',
        headers: createAuthHeaders(token)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete truck');
      }

      setShowDeleteModal(false);
      setTruckToDelete(null);
      await fetchTrucks();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingTrucks(prev => ({ ...prev, [truckToDelete._id]: false }));
    }
  };

  // Handle delete modal close
  const handleDeleteModalClose = () => {
    setShowDeleteModal(false);
    setTruckToDelete(null);
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return 'status-badge active';
      case 'maintenance': return 'status-badge maintenance';
      case 'inactive': return 'status-badge inactive';
      default: return 'status-badge';
    }
  };

  // Get fuel type display
  const getFuelTypeDisplay = (fuelType) => {
    return fuelType.charAt(0).toUpperCase() + fuelType.slice(1);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Render field error
  const renderFieldError = (fieldName) => {
    if (fieldErrors[fieldName]) {
      return <div className="field-error">{fieldErrors[fieldName]}</div>;
    }
    return null;
  };

  if (loading && trucks.length === 0) {
    return (
      <div className="trucks-page">
        <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        <div className="trucks-main">
          <MobileHeader onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} isMenuOpen={isMenuOpen} />
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading trucks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="trucks-page">
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <div className="trucks-main">
        <MobileHeader onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} isMenuOpen={isMenuOpen} />
        
        <div className="trucks-content">
          <div className="trucks-header">
            <h1>Trucks</h1>
            <button onClick={handleAddTruckClick} className="add-truck-btn">
              <div className="add-truck-text">
                <span className="add-text">Add</span>
                <span className="truck-text">Truck</span>
              </div>
            </button>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="trucks-actions">
            <div className="search-container">
              <div className="search-input-wrapper">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search trucks..."
                  value={filters.search}
                  onChange={handleSearchChange}
                  className="search-input"
                />
              </div>
            </div>

            <div className="filters-container">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="filter-select"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                value={filters.make}
                onChange={(e) => handleFilterChange('make', e.target.value)}
                className="filter-select"
              >
                <option value="">All Makes</option>
                <option value="Ford">Ford</option>
                <option value="Chevrolet">Chevrolet</option>
                <option value="Toyota">Toyota</option>
                <option value="Nissan">Nissan</option>
                <option value="Isuzu">Isuzu</option>
              </select>
            </div>
          </div>

          <div className="trucks-grid">
            {trucks.map((truck) => (
              <div key={truck._id} className="truck-card">
                <div className="truck-header">
                  <div className="truck-plate">
                    <h3>{truck.plateNumber}</h3>
                    <span className={getStatusBadgeClass(truck.status)}>
                      {truck.status.charAt(0).toUpperCase() + truck.status.slice(1)}
                    </span>
                  </div>
                  <div className="truck-actions">
                    <button
                      onClick={() => handleViewDetailsClick(truck._id)}
                      className="view-details-btn"
                      title="View Details"
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => handleEditTruckClick(truck._id)}
                      className="edit-truck-btn"
                      title="Edit Truck"
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => handleDeleteTruckClick(truck)}
                      disabled={deletingTrucks[truck._id]}
                      className="delete-truck-btn"
                      title="Delete Truck"
                    >
                      {deletingTrucks[truck._id] ? (
                        <span>Deleting...</span>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="truck-info">
                  <div className="truck-details">
                    <div className="detail-row">
                      <span className="detail-label">Make/Model:</span>
                      <span className="detail-value">{truck.make} {truck.model}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Year:</span>
                      <span className="detail-value">{truck.year}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Capacity:</span>
                      <span className="detail-value">{truck.capacity.toLocaleString()} kg</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Fuel Type:</span>
                      <span className="detail-value">{getFuelTypeDisplay(truck.fuelType)}</span>
                    </div>
                    {truck.color && (
                      <div className="detail-row">
                        <span className="detail-label">Color:</span>
                        <span className="detail-value">{truck.color}</span>
                      </div>
                    )}
                    {truck.mileage && (
                      <div className="detail-row">
                        <span className="detail-label">Mileage:</span>
                        <span className="detail-value">{truck.mileage.toLocaleString()} km</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {trucks.length === 0 && !loading && (
            <div className="no-trucks">
              <p>No trucks found</p>
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.current - 1)}
                disabled={pagination.current === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {pagination.current} of {pagination.pages} ({pagination.total} total)
              </span>
              <button
                onClick={() => handlePageChange(pagination.current + 1)}
                disabled={pagination.current === pagination.pages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Truck Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Truck</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            {error && (
              <div className="modal-error-message">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="truck-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="plateNumber">Plate Number *</label>
                  <input
                    type="text"
                    id="plateNumber"
                    name="plateNumber"
                    value={newTruck.plateNumber}
                    onChange={handleInputChange}
                    required
                    placeholder="ABC-123"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="status">Status *</label>
                  <select
                    id="status"
                    name="status"
                    value={newTruck.status}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="make">Make *</label>
                  <input
                    type="text"
                    id="make"
                    name="make"
                    value={newTruck.make}
                    onChange={handleInputChange}
                    required
                    placeholder="Ford"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="model">Model *</label>
                  <input
                    type="text"
                    id="model"
                    name="model"
                    value={newTruck.model}
                    onChange={handleInputChange}
                    required
                    placeholder="F-150"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="year">Year *</label>
                  <input
                    type="number"
                    id="year"
                    name="year"
                    value={newTruck.year}
                    onChange={handleInputChange}
                    required
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    placeholder="2020"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="capacity">Capacity (kg) *</label>
                  <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    value={newTruck.capacity}
                    onChange={handleInputChange}
                    required
                    min="1"
                    placeholder="5000"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fuelType">Fuel Type *</label>
                  <select
                    id="fuelType"
                    name="fuelType"
                    value={newTruck.fuelType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="diesel">Diesel</option>
                    <option value="petrol">Petrol</option>
                    <option value="electric">Electric</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="color">Color</label>
                  <input
                    type="text"
                    id="color"
                    name="color"
                    value={newTruck.color}
                    onChange={handleInputChange}
                    placeholder="White"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="mileage">Mileage (km)</label>
                  <input
                    type="number"
                    id="mileage"
                    name="mileage"
                    value={newTruck.mileage}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="25000"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="vin">VIN</label>
                  <input
                    type="text"
                    id="vin"
                    name="vin"
                    value={newTruck.vin}
                    onChange={handleInputChange}
                    placeholder="17-character VIN"
                    maxLength="17"
                  />
                  {renderFieldError('vin')}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="lastServiceDate">Last Service Date</label>
                  <input
                    type="date"
                    id="lastServiceDate"
                    name="lastServiceDate"
                    value={newTruck.lastServiceDate}
                    onChange={handleInputChange}
                  />
                  {renderFieldError('lastServiceDate')}
                </div>
                <div className="form-group">
                  <label htmlFor="nextServiceDate">Next Service Date</label>
                  <input
                    type="date"
                    id="nextServiceDate"
                    name="nextServiceDate"
                    value={newTruck.nextServiceDate}
                    onChange={handleInputChange}
                  />
                  {renderFieldError('nextServiceDate')}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="insuranceExpiry">Insurance Expiry</label>
                  <input
                    type="date"
                    id="insuranceExpiry"
                    name="insuranceExpiry"
                    value={newTruck.insuranceExpiry}
                    onChange={handleInputChange}
                  />
                  {renderFieldError('insuranceExpiry')}
                </div>
                <div className="form-group">
                  <label htmlFor="registrationExpiry">Registration Expiry</label>
                  <input
                    type="date"
                    id="registrationExpiry"
                    name="registrationExpiry"
                    value={newTruck.registrationExpiry}
                    onChange={handleInputChange}
                  />
                  {renderFieldError('registrationExpiry')}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={newTruck.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes about the truck..."
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={handleCloseModal} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Creating...' : 'Create Truck'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Truck Modal */}
      {showEditModal && selectedTruck && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Truck</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            {error && (
              <div className="modal-error-message">
                {error}
              </div>
            )}
            
            <form onSubmit={handleUpdateTruck} className="truck-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-plateNumber">Plate Number *</label>
                  <input
                    type="text"
                    id="edit-plateNumber"
                    name="plateNumber"
                    value={selectedTruck.plateNumber}
                    onChange={(e) => setSelectedTruck({...selectedTruck, plateNumber: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-status">Status *</label>
                  <select
                    id="edit-status"
                    name="status"
                    value={selectedTruck.status}
                    onChange={(e) => setSelectedTruck({...selectedTruck, status: e.target.value})}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-make">Make *</label>
                  <input
                    type="text"
                    id="edit-make"
                    name="make"
                    value={selectedTruck.make}
                    onChange={(e) => setSelectedTruck({...selectedTruck, make: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-model">Model *</label>
                  <input
                    type="text"
                    id="edit-model"
                    name="model"
                    value={selectedTruck.model}
                    onChange={(e) => setSelectedTruck({...selectedTruck, model: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-year">Year *</label>
                  <input
                    type="number"
                    id="edit-year"
                    name="year"
                    value={selectedTruck.year}
                    onChange={(e) => setSelectedTruck({...selectedTruck, year: parseInt(e.target.value)})}
                    required
                    min="1900"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-capacity">Capacity (kg) *</label>
                  <input
                    type="number"
                    id="edit-capacity"
                    name="capacity"
                    value={selectedTruck.capacity}
                    onChange={(e) => setSelectedTruck({...selectedTruck, capacity: parseInt(e.target.value)})}
                    required
                    min="1"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-fuelType">Fuel Type *</label>
                  <select
                    id="edit-fuelType"
                    name="fuelType"
                    value={selectedTruck.fuelType}
                    onChange={(e) => setSelectedTruck({...selectedTruck, fuelType: e.target.value})}
                    required
                  >
                    <option value="diesel">Diesel</option>
                    <option value="petrol">Petrol</option>
                    <option value="electric">Electric</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="edit-color">Color</label>
                  <input
                    type="text"
                    id="edit-color"
                    name="color"
                    value={selectedTruck.color || ''}
                    onChange={(e) => setSelectedTruck({...selectedTruck, color: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-mileage">Mileage (km)</label>
                  <input
                    type="number"
                    id="edit-mileage"
                    name="mileage"
                    value={selectedTruck.mileage || ''}
                    onChange={(e) => setSelectedTruck({...selectedTruck, mileage: parseInt(e.target.value) || null})}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-vin">VIN</label>
                  <input
                    type="text"
                    id="edit-vin"
                    name="vin"
                    value={selectedTruck.vin || ''}
                    onChange={(e) => setSelectedTruck({...selectedTruck, vin: e.target.value})}
                    maxLength="17"
                  />
                  {renderFieldError('vin')}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-lastServiceDate">Last Service Date</label>
                  <input
                    type="date"
                    id="edit-lastServiceDate"
                    name="lastServiceDate"
                    value={selectedTruck.lastServiceDate ? selectedTruck.lastServiceDate.split('T')[0] : ''}
                    onChange={(e) => setSelectedTruck({...selectedTruck, lastServiceDate: e.target.value})}
                  />
                  {renderFieldError('lastServiceDate')}
                </div>
                <div className="form-group">
                  <label htmlFor="edit-nextServiceDate">Next Service Date</label>
                  <input
                    type="date"
                    id="edit-nextServiceDate"
                    name="nextServiceDate"
                    value={selectedTruck.nextServiceDate ? selectedTruck.nextServiceDate.split('T')[0] : ''}
                    onChange={(e) => setSelectedTruck({...selectedTruck, nextServiceDate: e.target.value})}
                  />
                  {renderFieldError('nextServiceDate')}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-insuranceExpiry">Insurance Expiry</label>
                  <input
                    type="date"
                    id="edit-insuranceExpiry"
                    name="insuranceExpiry"
                    value={selectedTruck.insuranceExpiry ? selectedTruck.insuranceExpiry.split('T')[0] : ''}
                    onChange={(e) => setSelectedTruck({...selectedTruck, insuranceExpiry: e.target.value})}
                  />
                  {renderFieldError('insuranceExpiry')}
                </div>
                <div className="form-group">
                  <label htmlFor="edit-registrationExpiry">Registration Expiry</label>
                  <input
                    type="date"
                    id="edit-registrationExpiry"
                    name="registrationExpiry"
                    value={selectedTruck.registrationExpiry ? selectedTruck.registrationExpiry.split('T')[0] : ''}
                    onChange={(e) => setSelectedTruck({...selectedTruck, registrationExpiry: e.target.value})}
                  />
                  {renderFieldError('registrationExpiry')}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="edit-notes">Notes</label>
                <textarea
                  id="edit-notes"
                  name="notes"
                  value={selectedTruck.notes || ''}
                  onChange={(e) => setSelectedTruck({...selectedTruck, notes: e.target.value})}
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={handleCloseModal} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Updating...' : 'Update Truck'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Truck Details Modal */}
      {showDetailsModal && selectedTruck && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content truck-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Truck Details</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            <div className="truck-details-content">
              <div className="truck-details-header">
                <h3>{selectedTruck.plateNumber}</h3>
                <span className={getStatusBadgeClass(selectedTruck.status)}>
                  {selectedTruck.status.charAt(0).toUpperCase() + selectedTruck.status.slice(1)}
                </span>
              </div>

              <div className="truck-details-grid">
                <div className="detail-section">
                  <h4>Basic Information</h4>
                  <div className="detail-row">
                    <span className="detail-label">Make:</span>
                    <span className="detail-value">{selectedTruck.make}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Model:</span>
                    <span className="detail-value">{selectedTruck.model}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Year:</span>
                    <span className="detail-value">{selectedTruck.year}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Capacity:</span>
                    <span className="detail-value">{selectedTruck.capacity.toLocaleString()} kg</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Fuel Type:</span>
                    <span className="detail-value">{getFuelTypeDisplay(selectedTruck.fuelType)}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Additional Details</h4>
                  <div className="detail-row">
                    <span className="detail-label">Color:</span>
                    <span className="detail-value">{selectedTruck.color || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Mileage:</span>
                    <span className="detail-value">{selectedTruck.mileage ? `${selectedTruck.mileage.toLocaleString()} km` : 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">VIN:</span>
                    <span className="detail-value">{selectedTruck.vin || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Age:</span>
                    <span className="detail-value">{selectedTruck.age || (new Date().getFullYear() - selectedTruck.year)} years</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Service Status:</span>
                    <span className="detail-value">{selectedTruck.serviceStatus || 'Unknown'}</span>
                  </div>
                </div>
              </div>

              {selectedTruck.notes && (
                <div className="detail-section">
                  <h4>Notes</h4>
                  <p className="truck-notes">{selectedTruck.notes}</p>
                </div>
              )}

              <div className="detail-section">
                <h4>Timestamps</h4>
                <div className="detail-row">
                  <span className="detail-label">Created:</span>
                  <span className="detail-value">{formatDate(selectedTruck.createdAt)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Last Updated:</span>
                  <span className="detail-value">{formatDate(selectedTruck.updatedAt)}</span>
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button type="button" onClick={handleCloseModal} className="btn-cancel">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && truckToDelete && (
        <div className="modal-overlay" onClick={handleDeleteModalClose}>
          <div className="modal-content delete-confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Truck</h2>
              <button className="modal-close" onClick={handleDeleteModalClose}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            <div className="delete-confirmation-content">
              <div className="delete-warning-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              
              <h3>Are you sure you want to delete this truck?</h3>
              <p className="delete-truck-info">
                <strong>Plate Number:</strong> {truckToDelete.plateNumber}
              </p>
              <p className="delete-truck-info">
                <strong>Make/Model:</strong> {truckToDelete.make} {truckToDelete.model}
              </p>
              <p className="delete-warning-text">
                This action cannot be undone. The truck will be permanently removed from the system.
              </p>
            </div>
            
            <div className="modal-actions">
              <button 
                type="button" 
                onClick={handleDeleteModalClose} 
                className="btn-cancel"
                disabled={deletingTrucks[truckToDelete._id]}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleDeleteTruckConfirm} 
                className="btn-delete"
                disabled={deletingTrucks[truckToDelete._id]}
              >
                {deletingTrucks[truckToDelete._id] ? 'Deleting...' : 'Delete Truck'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trucks;