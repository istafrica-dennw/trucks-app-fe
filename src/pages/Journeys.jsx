import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createApiUrl, createAuthHeaders } from '../utils/apiConfig';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import './Journeys.css';

const Journeys = () => {
  const { token, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [journeys, setJourneys] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [selectedJourney, setSelectedJourney] = useState(null);
  const [journeyToDelete, setJourneyToDelete] = useState(null);
  
  // Form states
  const [submitting, setSubmitting] = useState(false);
  const [deletingJourneys, setDeletingJourneys] = useState({});
  const [completingJourneys, setCompletingJourneys] = useState({});
  const [newJourney, setNewJourney] = useState({
    driver: '',
    truck: '',
    departureCity: '',
    destinationCity: '',
    cargo: '',
    customer: '',
    expenses: [],
    pay: {
      totalAmount: '',
      paidOption: 'full',
      installments: []
    },
    notes: '',
    status: 'started',
    date: new Date().toISOString().split('T')[0]
  });
  
  // Installment form
  const [newInstallment, setNewInstallment] = useState({
    amount: '',
    note: ''
  });

  // Helpers for installments
  const computeInstallmentsTotal = (installments = []) => {
    if (!Array.isArray(installments) || installments.length === 0) return 0;
    return installments.reduce((sum, inst) => sum + (parseFloat(inst.amount) || 0), 0);
  };

  // Mark journey as completed
  const handleMarkCompleted = async (journey) => {
    try {
      setCompletingJourneys(prev => ({ ...prev, [journey._id]: true }));
      const response = await fetch(createApiUrl(`api/drives/${journey._id}`), {
        method: 'PUT',
        headers: createAuthHeaders(token),
        body: JSON.stringify({ status: 'completed' })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to mark as completed');
      }
      await fetchJourneys(pagination.page, pagination.limit, filters.search, filters.status, filters.truckId, filters.driverId, filters.customer, filters.departureCity, filters.destinationCity, filters.paidOption, filters.sortBy, filters.sortOrder);
    } catch (err) {
      setError(err.message);
    } finally {
      setCompletingJourneys(prev => ({ ...prev, [journey._id]: false }));
    }
  };

  const addInstallmentRow = () => {
    if (showAddModal) {
      setNewJourney(prev => ({
        ...prev,
        pay: {
          ...prev.pay,
          installments: [...(prev.pay.installments || []), { amount: '', note: '' }]
        }
      }));
    } else if (showEditModal && selectedJourney) {
      setSelectedJourney(prev => ({
        ...prev,
        pay: {
          ...prev.pay,
          installments: [...(prev.pay.installments || []), { amount: '', note: '' }]
        }
      }));
    }
  };

  const removeInstallmentRow = (index) => {
    if (showAddModal) {
      setNewJourney(prev => ({
        ...prev,
        pay: {
          ...prev.pay,
          installments: prev.pay.installments.filter((_, i) => i !== index)
        }
      }));
    } else if (showEditModal && selectedJourney) {
      setSelectedJourney(prev => ({
        ...prev,
        pay: {
          ...prev.pay,
          installments: prev.pay.installments.filter((_, i) => i !== index)
        }
      }));
    }
  };

  const handleInstallmentChange = (index, field, value) => {
    if (showAddModal) {
      setNewJourney(prev => ({
        ...prev,
        pay: {
          ...prev.pay,
          installments: prev.pay.installments.map((inst, i) => i === index ? { ...inst, [field]: value } : inst)
        }
      }));
    } else if (showEditModal && selectedJourney) {
      setSelectedJourney(prev => ({
        ...prev,
        pay: {
          ...prev.pay,
          installments: prev.pay.installments.map((inst, i) => i === index ? { ...inst, [field]: value } : inst)
        }
      }));
    }
  };
  
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
    truckId: '',
    driverId: '',
    customer: '',
    departureCity: '',
    destinationCity: '',
    paidOption: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  // Fetch journeys
  const fetchJourneys = async (page = 1, limit = 10, search = '', status = '', truckId = '', driverId = '', customer = '', departureCity = '', destinationCity = '', paidOption = '', sortBy = 'date', sortOrder = 'desc') => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        status,
        truckId,
        driverId,
        customer,
        departureCity,
        destinationCity,
        paidOption,
        sortBy,
        sortOrder
      });

      const response = await fetch(createApiUrl(`api/drives?${queryParams}`), {
        headers: createAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch journeys');
      }

      const data = await response.json();
      setJourneys(data.data);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching journeys:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch drivers and trucks for dropdowns
  const fetchDriversAndTrucks = async () => {
    try {
        const [driversResponse, trucksResponse] = await Promise.all([
          fetch(createApiUrl('api/drivers'), {
            headers: createAuthHeaders(token)
          }),
          fetch(createApiUrl('api/trucks'), {
            headers: createAuthHeaders(token)
          })
        ]);

      if (driversResponse.ok) {
        const driversData = await driversResponse.json();
        setDrivers(driversData.data || []);
      }

      if (trucksResponse.ok) {
        const trucksData = await trucksResponse.json();
        setTrucks(trucksData.data || []);
      }
    } catch (err) {
      console.error('Error fetching drivers and trucks:', err);
    }
  };

  // Fetch journey details
  const fetchJourneyDetails = async (journeyId) => {
    try {
      const response = await fetch(createApiUrl(`api/drives/${journeyId}`), {
        headers: createAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch journey details');
      }

      const data = await response.json();
      return data.data;
    } catch (err) {
      console.error('Error fetching journey details:', err);
      throw err;
    }
  };

  // Handle search change
  const handleSearchChange = (e) => {
    const search = e.target.value;
    setFilters(prev => ({ ...prev, search }));
    fetchJourneys(1, pagination.limit, search, filters.status, filters.truckId, filters.driverId, filters.customer, filters.departureCity, filters.destinationCity, filters.paidOption, filters.sortBy, filters.sortOrder);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    fetchJourneys(1, pagination.limit, filters.search, name === 'status' ? value : filters.status, name === 'truckId' ? value : filters.truckId, name === 'driverId' ? value : filters.driverId, name === 'customer' ? value : filters.customer, name === 'departureCity' ? value : filters.departureCity, name === 'destinationCity' ? value : filters.destinationCity, name === 'paidOption' ? value : filters.paidOption, filters.sortBy, filters.sortOrder);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    fetchJourneys(newPage, pagination.limit, filters.search, filters.status, filters.truckId, filters.driverId, filters.customer, filters.departureCity, filters.destinationCity, filters.paidOption, filters.sortBy, filters.sortOrder);
  };

  // Handle add journey click
  const handleAddJourneyClick = () => {
    setNewJourney({
      driver: '',
      truck: '',
      departureCity: '',
      destinationCity: '',
      cargo: '',
      customer: '',
      expenses: [],
      pay: {
        totalAmount: '',
        paidOption: 'full',
        installments: []
      },
      notes: '',
      status: 'started',
      date: new Date().toISOString().split('T')[0]
    });
    setError(null);
    setFieldErrors({});
    setShowAddModal(true);
  };

  // Handle edit journey click
  const handleEditJourneyClick = async (journey) => {
    try {
      const journeyDetails = await fetchJourneyDetails(journey._id);
      setSelectedJourney(journeyDetails);
      setError(null);
      setFieldErrors({});
      setShowEditModal(true);
    } catch (err) {
      setError('Failed to load journey details');
    }
  };

  // Handle view details click
  const handleViewDetailsClick = async (journey) => {
    try {
      const journeyDetails = await fetchJourneyDetails(journey._id);
      setSelectedJourney(journeyDetails);
      setShowDetailsModal(true);
    } catch (err) {
      setError('Failed to load journey details');
    }
  };

  // Handle delete journey click
  const handleDeleteJourneyClick = (journey) => {
    setJourneyToDelete(journey);
    setShowDeleteModal(true);
  };

  // Handle add installment click
  const handleAddInstallmentClick = async (journey) => {
    try {
      const journeyDetails = await fetchJourneyDetails(journey._id);
      setSelectedJourney(journeyDetails);
    } catch (err) {
      setSelectedJourney(journey); // fallback
    }
    setNewInstallment({ amount: '', note: '' });
    setError(null);
    setFieldErrors({});
    setShowInstallmentModal(true);
  };

  // Handle delete confirmation
  const handleDeleteJourneyConfirm = async () => {
    if (!journeyToDelete) return;

    try {
      setDeletingJourneys(prev => ({ ...prev, [journeyToDelete._id]: true }));
      
      const response = await fetch(createApiUrl(`api/drives/${journeyToDelete._id}`), {
        method: 'DELETE',
        headers: createAuthHeaders(token)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete journey');
      }

      // Refresh journeys list
      await fetchJourneys(pagination.page, pagination.limit, filters.search, filters.status, filters.truckId, filters.driverId, filters.customer, filters.departureCity, filters.destinationCity, filters.paidOption, filters.sortBy, filters.sortOrder);
      setShowDeleteModal(false);
      setJourneyToDelete(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingJourneys(prev => ({ ...prev, [journeyToDelete._id]: false }));
    }
  };

  // Handle delete modal close
  const handleDeleteModalClose = () => {
    setShowDeleteModal(false);
    setJourneyToDelete(null);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (showAddModal) {
      if (name.startsWith('pay.')) {
        const payField = name.split('.')[1];
        if (payField === 'paidOption') {
          setNewJourney(prev => ({
            ...prev,
            pay: { ...prev.pay, paidOption: value, installments: value === 'full' ? [] : prev.pay.installments }
          }));
        } else {
          setNewJourney(prev => ({
            ...prev,
            pay: { ...prev.pay, [payField]: value }
          }));
        }
      } else {
        setNewJourney(prev => ({ ...prev, [name]: value }));
      }
    } else if (showEditModal && selectedJourney) {
      if (name.startsWith('pay.')) {
        const payField = name.split('.')[1];
        if (payField === 'paidOption') {
          setSelectedJourney(prev => ({
            ...prev,
            pay: { ...prev.pay, paidOption: value, installments: value === 'full' ? [] : prev.pay.installments }
          }));
        } else {
          setSelectedJourney(prev => ({
            ...prev,
            pay: { ...prev.pay, [payField]: value }
          }));
        }
      } else {
        setSelectedJourney(prev => ({ ...prev, [name]: value }));
      }
    } else if (showInstallmentModal) {
      setNewInstallment(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle expense change
  const handleExpenseChange = (index, field, value) => {
    if (showAddModal) {
      setNewJourney(prev => ({
        ...prev,
        expenses: prev.expenses.map((expense, i) => 
          i === index ? { ...expense, [field]: value } : expense
        )
      }));
    } else if (showEditModal && selectedJourney) {
      setSelectedJourney(prev => ({
        ...prev,
        expenses: prev.expenses.map((expense, i) => 
          i === index ? { ...expense, [field]: value } : expense
        )
      }));
    }
  };

  // Add expense
  const addExpense = () => {
    if (showAddModal) {
      setNewJourney(prev => ({
        ...prev,
        expenses: [...prev.expenses, { title: '', amount: '', note: '' }]
      }));
    } else if (showEditModal && selectedJourney) {
      setSelectedJourney(prev => ({
        ...prev,
        expenses: [...prev.expenses, { title: '', amount: '', note: '' }]
      }));
    }
  };

  // Remove expense
  const removeExpense = (index) => {
    if (showAddModal) {
      setNewJourney(prev => ({
        ...prev,
        expenses: prev.expenses.filter((_, i) => i !== index)
      }));
    } else if (showEditModal && selectedJourney) {
      setSelectedJourney(prev => ({
        ...prev,
        expenses: prev.expenses.filter((_, i) => i !== index)
      }));
    }
  };

  // Handle form submit (Add)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      // Prepare journey data
      const journeyData = {
        ...newJourney,
        pay: {
          ...newJourney.pay,
          totalAmount: parseFloat(newJourney.pay.totalAmount),
          installments: newJourney.pay.paidOption === 'full' ? [] : newJourney.pay.installments
        },
        expenses: newJourney.expenses.map(expense => ({
          ...expense,
          amount: parseFloat(expense.amount)
        }))
      };

      const response = await fetch(createApiUrl('api/drives'), {
        method: 'POST',
        headers: createAuthHeaders(token),
        body: JSON.stringify(journeyData)
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
          setError(data.message || 'Failed to create journey');
        }
        return;
      }

      // Success
      setShowAddModal(false);
      setNewJourney({
        driver: '',
        truck: '',
        departureCity: '',
        destinationCity: '',
        cargo: '',
        customer: '',
        expenses: [],
        pay: {
          totalAmount: '',
          paidOption: 'full',
          installments: []
        },
        notes: '',
        status: 'started',
        date: new Date().toISOString().split('T')[0]
      });
      
      // Refresh journeys list
      await fetchJourneys(pagination.page, pagination.limit, filters.search, filters.status, filters.truckId, filters.driverId, filters.customer, filters.departureCity, filters.destinationCity, filters.paidOption, filters.sortBy, filters.sortOrder);
    } catch (err) {
      setError('Failed to create journey');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle update journey
  const handleUpdateJourney = async (e) => {
    e.preventDefault();
    if (!selectedJourney) return;

    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      // Prepare journey data (only allowed fields; convert populated objects to IDs)
      const journeyData = {
        driver: selectedJourney.driver?._id || selectedJourney.driver,
        truck: selectedJourney.truck?._id || selectedJourney.truck,
        departureCity: selectedJourney.departureCity,
        destinationCity: selectedJourney.destinationCity,
        cargo: selectedJourney.cargo,
        customer: selectedJourney.customer,
        notes: selectedJourney.notes,
        status: selectedJourney.status,
        date: selectedJourney.date,
        expenses: (selectedJourney.expenses || []).map(expense => ({
          title: expense.title,
          amount: parseFloat(expense.amount),
          note: expense.note
        })),
        pay: {
          totalAmount: parseFloat(selectedJourney.pay?.totalAmount ?? 0),
          paidOption: selectedJourney.pay?.paidOption || 'full',
          installments: (selectedJourney.pay?.paidOption === 'full') ? [] : ((selectedJourney.pay?.installments || []).map(inst => ({
            amount: parseFloat(inst.amount),
            note: inst.note,
            date: inst.date
          })))
        }
      };

      const response = await fetch(createApiUrl(`api/drives/${selectedJourney._id}`), {
        method: 'PUT',
        headers: createAuthHeaders(token),
        body: JSON.stringify(journeyData)
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
          setError(data.message || 'Failed to update journey');
        }
        return;
      }

      // Success
      setShowEditModal(false);
      setSelectedJourney(null);
      
      // Refresh journeys list
      await fetchJourneys(pagination.page, pagination.limit, filters.search, filters.status, filters.truckId, filters.driverId, filters.customer, filters.departureCity, filters.destinationCity, filters.paidOption, filters.sortBy, filters.sortOrder);
    } catch (err) {
      setError('Failed to update journey');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle add installment
  const handleAddInstallment = async (e) => {
    e.preventDefault();
    if (!selectedJourney) return;

    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const installmentData = {
        amount: parseFloat(newInstallment.amount),
        note: newInstallment.note
      };

      const response = await fetch(createApiUrl(`api/drives/${selectedJourney._id}/installment`), {
        method: 'POST',
        headers: createAuthHeaders(token),
        body: JSON.stringify(installmentData)
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
          setError(data.message || 'Failed to add installment');
        }
        return;
      }

      // Success
      setShowInstallmentModal(false);
      setSelectedJourney(null);
      setNewInstallment({ amount: '', note: '' });
      
      // Refresh journeys list
      await fetchJourneys(pagination.page, pagination.limit, filters.search, filters.status, filters.truckId, filters.driverId, filters.customer, filters.departureCity, filters.destinationCity, filters.paidOption, filters.sortBy, filters.sortOrder);
    } catch (err) {
      setError('Failed to add installment');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDetailsModal(false);
    setShowInstallmentModal(false);
    setSelectedJourney(null);
    setError(null);
    setFieldErrors({});
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
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'started': return 'status-badge status-started';
      case 'completed': return 'status-badge status-completed';
      default: return 'status-badge';
    }
  };

  // Get payment badge class
  const getPaymentBadgeClass = (paidOption) => {
    switch (paidOption) {
      case 'full': return 'payment-badge payment-full';
      case 'installment': return 'payment-badge payment-installment';
      default: return 'payment-badge';
    }
  };

  // Load journeys on component mount
  useEffect(() => {
    if (token) {
      fetchJourneys();
      fetchDriversAndTrucks();
    }
  }, [token]);

  if (loading && journeys.length === 0) {
    return (
      <div className="journeys-page">
        <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        <div className="journeys-main">
          <MobileHeader onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} isMenuOpen={isMenuOpen} />
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading journeys...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="journeys-page">
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <div className="journeys-main">
        <MobileHeader onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} isMenuOpen={isMenuOpen} />
        
        <div className="journeys-content">
          <div className="journeys-header">
            <h1>Journeys</h1>
            {user?.role === 'admin' && (
              <button 
                className="add-journey-btn"
                onClick={handleAddJourneyClick}
              >
                <div className="add-journey-text">
                  <span className="add-text">Add</span>
                  <span className="journey-text">Journey</span>
                </div>
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="journeys-actions">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search journeys..."
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
                <option value="started">Started</option>
                <option value="completed">Completed</option>
              </select>
              
              <select
                name="paidOption"
                value={filters.paidOption}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">All Payments</option>
                <option value="full">Full Payment</option>
                <option value="installment">Installment</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Journeys Grid */}
          <div className="journeys-grid">
            {journeys.map((journey) => (
              <div key={journey._id} className="journey-card">
                <div className="journey-header">
                  <div className="journey-route">
                    <span className="departure">{journey.departureCity}</span>
                    <span className="arrow">→</span>
                    <span className="destination">{journey.destinationCity}</span>
                  </div>
                  <div className="journey-badges">
                    <span className={getStatusBadgeClass(journey.status)}>
                      {journey.status}
                    </span>
                    <span className={getPaymentBadgeClass(journey.pay.paidOption)}>
                      {journey.pay.paidOption}
                    </span>
                  </div>
                </div>
                
                <div className="journey-details">
                  <div className="detail-row">
                    <span className="detail-label">Driver:</span>
                    <span className="detail-value">{journey.driver?.fullName || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Truck:</span>
                    <span className="detail-value">{journey.truck?.plateNumber || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Customer:</span>
                    <span className="detail-value">{journey.customer}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Cargo:</span>
                    <span className="detail-value">{journey.cargo}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Amount:</span>
                    <span className="detail-value">{formatCurrency(journey.pay.totalAmount)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Balance:</span>
                    <span className="detail-value">{formatCurrency(journey.balance || 0)}</span>
                  </div>
                </div>

                <div className="journey-actions">
                  <button
                    className="view-details-btn"
                    onClick={() => handleViewDetailsClick(journey)}
                  >
                    View Details
                  </button>
                  {user?.role === 'admin' && (
                    <>
                      {journey.status !== 'completed' && (
                        <button
                          className="add-installment-btn"
                          onClick={() => handleMarkCompleted(journey)}
                          disabled={completingJourneys[journey._id]}
                        >
                          {completingJourneys[journey._id] ? 'Completing...' : 'Mark Completed'}
                        </button>
                      )}
                      <button
                        className="edit-journey-btn"
                        onClick={() => handleEditJourneyClick(journey)}
                      >
                        Edit
                      </button>
                      {journey.pay.paidOption === 'installment' && (
                        <button
                          className="add-installment-btn"
                          onClick={() => handleAddInstallmentClick(journey)}
                        >
                          Add Payment
                        </button>
                      )}
                      <button
                        className="delete-journey-btn"
                        onClick={() => handleDeleteJourneyClick(journey)}
                        disabled={deletingJourneys[journey._id]}
                      >
                        {deletingJourneys[journey._id] ? 'Deleting...' : 'Delete'}
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

      {/* Add Journey Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Journey</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            {error && (
              <div className="modal-error-message">{error}</div>
            )}
            
            <form onSubmit={handleSubmit} className="journey-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="driver">Driver *</label>
                  <select
                    id="driver"
                    name="driver"
                    value={newJourney.driver}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Driver</option>
                    {drivers.map(driver => (
                      <option key={driver._id} value={driver._id}>
                        {driver.fullName} - {driver.phone}
                      </option>
                    ))}
                  </select>
                  {renderFieldError('driver')}
                </div>
                
                <div className="form-group">
                  <label htmlFor="truck">Truck *</label>
                  <select
                    id="truck"
                    name="truck"
                    value={newJourney.truck}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Truck</option>
                    {trucks.map(truck => (
                      <option key={truck._id} value={truck._id}>
                        {truck.plateNumber} - {truck.make} {truck.model}
                      </option>
                    ))}
                  </select>
                  {renderFieldError('truck')}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="departureCity">Departure City *</label>
                  <input
                    type="text"
                    id="departureCity"
                    name="departureCity"
                    value={newJourney.departureCity}
                    onChange={handleInputChange}
                    required
                  />
                  {renderFieldError('departureCity')}
                </div>
                
                <div className="form-group">
                  <label htmlFor="destinationCity">Destination City *</label>
                  <input
                    type="text"
                    id="destinationCity"
                    name="destinationCity"
                    value={newJourney.destinationCity}
                    onChange={handleInputChange}
                    required
                  />
                  {renderFieldError('destinationCity')}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cargo">Cargo *</label>
                  <input
                    type="text"
                    id="cargo"
                    name="cargo"
                    value={newJourney.cargo}
                    onChange={handleInputChange}
                    required
                  />
                  {renderFieldError('cargo')}
                </div>
                
                <div className="form-group">
                  <label htmlFor="customer">Customer *</label>
                  <input
                    type="text"
                    id="customer"
                    name="customer"
                    value={newJourney.customer}
                    onChange={handleInputChange}
                    required
                  />
                  {renderFieldError('customer')}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="pay.totalAmount">Total Amount *</label>
                  <input
                    type="number"
                    id="pay.totalAmount"
                    name="pay.totalAmount"
                    value={newJourney.pay.totalAmount}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                  />
                  {renderFieldError('pay.totalAmount')}
                </div>
                
                <div className="form-group">
                  <label htmlFor="pay.paidOption">Payment Option *</label>
                  <select
                    id="pay.paidOption"
                    name="pay.paidOption"
                    value={newJourney.pay.paidOption}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="full">Full Payment</option>
                    <option value="installment">Installment</option>
                  </select>
                  {renderFieldError('pay.paidOption')}
                </div>
              </div>

              {/* Installments Section (only when paidOption is installment) */}
              {newJourney.pay.paidOption === 'installment' && (
                <div className="expenses-section">
                  <div className="section-header">
                    <h3>Installments</h3>
                    <button
                      type="button"
                      onClick={addInstallmentRow}
                      className="add-expense-btn"
                      disabled={(parseFloat(newJourney.pay.totalAmount || 0) - computeInstallmentsTotal(newJourney.pay.installments)) <= 0}
                    >
                      + Add Installment
                    </button>
                  </div>

                  {newJourney.pay.installments.length === 0 && (
                    <p style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '0.875rem' }}>No installments added yet.</p>
                  )}

                  {newJourney.pay.installments.map((inst, index) => (
                    <div key={index} className="expense-row">
                      <input
                        type="number"
                        placeholder="Amount"
                        value={inst.amount}
                        onChange={(e) => handleInstallmentChange(index, 'amount', e.target.value)}
                        step="0.01"
                        min="0"
                        className="expense-amount"
                      />
                      <input
                        type="text"
                        placeholder="Note (optional)"
                        value={inst.note}
                        onChange={(e) => handleInstallmentChange(index, 'note', e.target.value)}
                        className="expense-note"
                      />
                      <button
                        type="button"
                        onClick={() => removeInstallmentRow(index)}
                        className="remove-expense-btn"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  <div className="journey-info">
                    <p><strong>Total Amount:</strong> {formatCurrency(parseFloat(newJourney.pay.totalAmount || 0))}</p>
                    <p><strong>Total Installments:</strong> {formatCurrency(computeInstallmentsTotal(newJourney.pay.installments))}</p>
                    <p><strong>Remaining:</strong> {formatCurrency(Math.max(0, (parseFloat(newJourney.pay.totalAmount || 0) - computeInstallmentsTotal(newJourney.pay.installments))))}</p>
                  </div>
                </div>
              )}

              {/* Expenses Section */}
              <div className="expenses-section">
                <div className="section-header">
                  <h3>Expenses</h3>
                  <button type="button" onClick={addExpense} className="add-expense-btn">
                    + Add Expense
                  </button>
                </div>
                
                {newJourney.expenses.map((expense, index) => (
                  <div key={index} className="expense-row">
                    <input
                      type="text"
                      placeholder="Expense title"
                      value={expense.title}
                      onChange={(e) => handleExpenseChange(index, 'title', e.target.value)}
                      className="expense-title"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={expense.amount}
                      onChange={(e) => handleExpenseChange(index, 'amount', e.target.value)}
                      step="0.01"
                      min="0"
                      className="expense-amount"
                    />
                    <input
                      type="text"
                      placeholder="Note (optional)"
                      value={expense.note}
                      onChange={(e) => handleExpenseChange(index, 'note', e.target.value)}
                      className="expense-note"
                    />
                    <button
                      type="button"
                      onClick={() => removeExpense(index)}
                      className="remove-expense-btn"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              

              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={newJourney.notes}
                  onChange={handleInputChange}
                  rows="3"
                />
                {renderFieldError('notes')}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Journey'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Installment Modal */}
      {showInstallmentModal && selectedJourney && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Installment Payment</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            
            {error && (
              <div className="modal-error-message">{error}</div>
            )}
            
            <form onSubmit={handleAddInstallment} className="installment-form">
              <div className="journey-info">
                <p><strong>Journey:</strong> {selectedJourney.departureCity} → {selectedJourney.destinationCity}</p>
                <p><strong>Customer:</strong> {selectedJourney.customer}</p>
                <p><strong>Total Amount:</strong> {formatCurrency(selectedJourney.pay.totalAmount)}</p>
                <p><strong>Paid So Far:</strong> {formatCurrency(selectedJourney.totalPaid || 0)}</p>
                <p><strong>Remaining:</strong> {formatCurrency(selectedJourney.pay.totalAmount - (selectedJourney.totalPaid || 0))}</p>
              </div>

              <div className="form-group">
                <label htmlFor="amount">Amount *</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={newInstallment.amount}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  max={selectedJourney.pay.totalAmount - (selectedJourney.totalPaid || 0)}
                  required
                />
                {renderFieldError('amount')}
              </div>

              <div className="form-group">
                <label htmlFor="note">Note</label>
                <input
                  type="text"
                  id="note"
                  name="note"
                  value={newInstallment.note}
                  onChange={handleInputChange}
                  placeholder="Payment note (optional)"
                />
                {renderFieldError('note')}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Journey Modal */}
      {showEditModal && selectedJourney && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Journey</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>

            {error && (
              <div className="modal-error-message">{error}</div>
            )}

            <form onSubmit={handleUpdateJourney} className="journey-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-driver">Driver *</label>
                  <select
                    id="edit-driver"
                    name="driver"
                    value={selectedJourney.driver?._id || selectedJourney.driver}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Driver</option>
                    {drivers.map(driver => (
                      <option key={driver._id} value={driver._id}>
                        {driver.fullName} - {driver.phone}
                      </option>
                    ))}
                  </select>
                  {renderFieldError('driver')}
                </div>

                <div className="form-group">
                  <label htmlFor="edit-truck">Truck *</label>
                  <select
                    id="edit-truck"
                    name="truck"
                    value={selectedJourney.truck?._id || selectedJourney.truck}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Truck</option>
                    {trucks.map(truck => (
                      <option key={truck._id} value={truck._id}>
                        {truck.plateNumber} - {truck.make} {truck.model}
                      </option>
                    ))}
                  </select>
                  {renderFieldError('truck')}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-departureCity">Departure City *</label>
                  <input
                    type="text"
                    id="edit-departureCity"
                    name="departureCity"
                    value={selectedJourney.departureCity || ''}
                    onChange={handleInputChange}
                    required
                  />
                  {renderFieldError('departureCity')}
                </div>

                <div className="form-group">
                  <label htmlFor="edit-destinationCity">Destination City *</label>
                  <input
                    type="text"
                    id="edit-destinationCity"
                    name="destinationCity"
                    value={selectedJourney.destinationCity || ''}
                    onChange={handleInputChange}
                    required
                  />
                  {renderFieldError('destinationCity')}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-cargo">Cargo *</label>
                  <input
                    type="text"
                    id="edit-cargo"
                    name="cargo"
                    value={selectedJourney.cargo || ''}
                    onChange={handleInputChange}
                    required
                  />
                  {renderFieldError('cargo')}
                </div>

                <div className="form-group">
                  <label htmlFor="edit-customer">Customer *</label>
                  <input
                    type="text"
                    id="edit-customer"
                    name="customer"
                    value={selectedJourney.customer || ''}
                    onChange={handleInputChange}
                    required
                  />
                  {renderFieldError('customer')}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-totalAmount">Total Amount *</label>
                  <input
                    type="number"
                    id="edit-totalAmount"
                    name="pay.totalAmount"
                    value={selectedJourney.pay?.totalAmount ?? ''}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                  />
                  {renderFieldError('pay.totalAmount')}
                </div>

                <div className="form-group">
                  <label htmlFor="edit-paidOption">Payment Option *</label>
                  <select
                    id="edit-paidOption"
                    name="pay.paidOption"
                    value={selectedJourney.pay?.paidOption || 'full'}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="full">Full Payment</option>
                    <option value="installment">Installment</option>
                  </select>
                  {renderFieldError('pay.paidOption')}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-status">Status</label>
                  <select
                    id="edit-status"
                    name="status"
                    value={selectedJourney.status || 'started'}
                    onChange={handleInputChange}
                  >
                    <option value="started">Started</option>
                    <option value="completed">Completed</option>
                  </select>
                  {renderFieldError('status')}
                </div>
              </div>

              {selectedJourney.pay?.paidOption === 'installment' && (
                <div className="expenses-section">
                  <div className="section-header">
                    <h3>Installments</h3>
                    <button
                      type="button"
                      onClick={addInstallmentRow}
                      className="add-expense-btn"
                      disabled={(parseFloat(selectedJourney.pay?.totalAmount || 0) - computeInstallmentsTotal(selectedJourney.pay?.installments || [])) <= 0}
                    >
                      + Add Installment
                    </button>
                  </div>

                  {(selectedJourney.pay?.installments || []).length === 0 && (
                    <p style={{ margin: '0 0 12px 0', color: '#6b7280', fontSize: '0.875rem' }}>No installments added yet.</p>
                  )}

                  {(selectedJourney.pay?.installments || []).map((inst, index) => (
                    <div key={index} className="expense-row">
                      <input
                        type="number"
                        placeholder="Amount"
                        value={inst.amount}
                        onChange={(e) => handleInstallmentChange(index, 'amount', e.target.value)}
                        step="0.01"
                        min="0"
                        className="expense-amount"
                      />
                      <input
                        type="text"
                        placeholder="Note (optional)"
                        value={inst.note}
                        onChange={(e) => handleInstallmentChange(index, 'note', e.target.value)}
                        className="expense-note"
                      />
                      <button
                        type="button"
                        onClick={() => removeInstallmentRow(index)}
                        className="remove-expense-btn"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  <div className="journey-info">
                    <p><strong>Total Amount:</strong> {formatCurrency(parseFloat(selectedJourney.pay?.totalAmount || 0))}</p>
                    <p><strong>Total Installments:</strong> {formatCurrency(computeInstallmentsTotal(selectedJourney.pay?.installments || []))}</p>
                    <p><strong>Remaining:</strong> {formatCurrency(Math.max(0, (parseFloat(selectedJourney.pay?.totalAmount || 0) - computeInstallmentsTotal(selectedJourney.pay?.installments || []))))}</p>
                  </div>
                </div>
              )}

              {/* Expenses */}
              <div className="expenses-section">
                <div className="section-header">
                  <h3>Expenses</h3>
                  <button type="button" onClick={addExpense} className="add-expense-btn">
                    + Add Expense
                  </button>
                </div>

                {(selectedJourney.expenses || []).map((expense, index) => (
                  <div key={index} className="expense-row">
                    <input
                      type="text"
                      placeholder="Expense title"
                      value={expense.title}
                      onChange={(e) => handleExpenseChange(index, 'title', e.target.value)}
                      className="expense-title"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={expense.amount}
                      onChange={(e) => handleExpenseChange(index, 'amount', e.target.value)}
                      step="0.01"
                      min="0"
                      className="expense-amount"
                    />
                    <input
                      type="text"
                      placeholder="Note (optional)"
                      value={expense.note}
                      onChange={(e) => handleExpenseChange(index, 'note', e.target.value)}
                      className="expense-note"
                    />
                    <button
                      type="button"
                      onClick={() => removeExpense(index)}
                      className="remove-expense-btn"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label htmlFor="edit-notes">Notes</label>
                <textarea
                  id="edit-notes"
                  name="notes"
                  value={selectedJourney.notes || ''}
                  onChange={handleInputChange}
                  rows="3"
                />
                {renderFieldError('notes')}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Journey Details Modal */}
      {showDetailsModal && selectedJourney && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Journey Details</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>

            <div className="driver-details-modal" style={{ padding: '0 32px 24px 32px' }}>
              <div className="detail-row"><span className="detail-label">Route</span><span className="detail-value">{selectedJourney.departureCity} → {selectedJourney.destinationCity}</span></div>
              <div className="detail-row"><span className="detail-label">Date</span><span className="detail-value">{formatDate(selectedJourney.date)}</span></div>
              <div className="detail-row"><span className="detail-label">Driver</span><span className="detail-value">{selectedJourney.driver?.fullName || 'N/A'}</span></div>
              <div className="detail-row"><span className="detail-label">Truck</span><span className="detail-value">{selectedJourney.truck?.plateNumber || 'N/A'}</span></div>
              <div className="detail-row"><span className="detail-label">Customer</span><span className="detail-value">{selectedJourney.customer}</span></div>
              <div className="detail-row"><span className="detail-label">Cargo</span><span className="detail-value">{selectedJourney.cargo}</span></div>
              <div className="detail-row"><span className="detail-label">Payment</span><span className="detail-value">{selectedJourney.pay?.paidOption} — {formatCurrency(selectedJourney.pay?.totalAmount || 0)}</span></div>
              <div className="detail-row"><span className="detail-label">Total Expenses</span><span className="detail-value">{formatCurrency(selectedJourney.totalExpenses || 0)}</span></div>
              <div className="detail-row"><span className="detail-label">Total Paid</span><span className="detail-value">{formatCurrency(selectedJourney.totalPaid || 0)}</span></div>
              <div className="detail-row"><span className="detail-label">Balance</span><span className="detail-value">{formatCurrency(selectedJourney.calculatedBalance ?? selectedJourney.balance ?? 0)}</span></div>

              {(selectedJourney.expenses || []).length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <h3 style={{ margin: '0 0 8px 0' }}>Expenses</h3>
                  {(selectedJourney.expenses || []).map((exp, i) => (
                    <div key={i} className="detail-row">
                      <span className="detail-label">{exp.title}</span>
                      <span className="detail-value">{formatCurrency(exp.amount)}{exp.note ? ` — ${exp.note}` : ''}</span>
                    </div>
                  ))}
                </div>
              )}

              {(selectedJourney.pay?.installments || []).length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <h3 style={{ margin: '0 0 8px 0' }}>Installments</h3>
                  {(selectedJourney.pay?.installments || []).map((inst, i) => (
                    <div key={i} className="detail-row">
                      <span className="detail-label">{formatDate(inst.date)}</span>
                      <span className="detail-value">{formatCurrency(inst.amount)}{inst.note ? ` — ${inst.note}` : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={handleCloseModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && journeyToDelete && (
        <div className="modal-overlay" onClick={handleDeleteModalClose}>
          <div className="modal-content delete-confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirmation-content">
              <div className="delete-warning-icon">⚠️</div>
              <h2>Delete Journey</h2>
              <div className="delete-journey-info">
                <p>Are you sure you want to delete this journey?</p>
                <div className="journey-info">
                  <strong>{journeyToDelete.departureCity} → {journeyToDelete.destinationCity}</strong>
                  <span>{journeyToDelete.customer}</span>
                </div>
              </div>
              <p className="delete-warning-text">
                This action cannot be undone.
              </p>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={handleDeleteModalClose}>
                  Cancel
                </button>
                <button 
                  className="btn-delete" 
                  onClick={handleDeleteJourneyConfirm}
                  disabled={deletingJourneys[journeyToDelete._id]}
                >
                  {deletingJourneys[journeyToDelete._id] ? 'Deleting...' : 'Delete Journey'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Journeys;