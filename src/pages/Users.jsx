import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createApiUrl, createAuthHeaders } from '../utils/apiConfig';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import './Users.css';

const Users = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [updatingRoles, setUpdatingRoles] = useState({});
  const [deletingUsers, setDeletingUsers] = useState({});
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 10
  });
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: ''
  });

  // Fetch users from API with pagination and filtering
  const fetchUsers = async (page = 1, limit = 10, role = '', status = '', search = '') => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      if (role) params.append('role', role);
      if (status) params.append('status', status);
      if (search) params.append('search', search);

      const response = await fetch(createApiUrl(`api/users?${params}`), {
        headers: createAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.data || []);
      setPagination(data.pagination || {
        current: 1,
        pages: 1,
        total: 0,
        limit: 10
      });
    } catch (err) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers(pagination.current, pagination.limit, filters.role, filters.status, filters.search);
    }
  }, [token, pagination.current, filters]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setFilters(prev => ({ ...prev, search: value }));
  };

  // Get user initials for avatar
  const getUserInitials = (username) => {
    if (!username) return 'U';
    return username.substring(0, 2).toUpperCase();
  };

  // Get display name from username
  const getDisplayName = (username) => {
    if (!username) return 'Unknown User';
    return username.charAt(0).toUpperCase() + username.slice(1);
  };

  // Format last login date
  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return 'Never';
    
    const date = new Date(lastLogin);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    
    return date.toLocaleDateString();
  };

  // Handle add user button click
  const handleAddUserClick = () => {
    setShowAddModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Basic client-side validation
    if (!newUser.username || !newUser.password) {
      setError('Username and password are required');
      setSubmitting(false);
      return;
    }

    if (newUser.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setSubmitting(false);
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      setError('Passwords do not match');
      setSubmitting(false);
      return;
    }

    try {
      // Prepare user data for API (exclude confirmPassword)
      const userData = {
        username: newUser.username,
        password: newUser.password
      };

      const response = await fetch(createApiUrl('api/users'), {
        method: 'POST',
        headers: createAuthHeaders(token),
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle Joi validation errors
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors.map(err => err.message).join('\n');
          throw new Error(errorMessages);
        }
        
        // Handle other API errors
        throw new Error(errorData.message || 'Failed to create user');
      }

      // Reset form and close modal
      setNewUser({ username: '', password: '', confirmPassword: '' });
      setShowAddModal(false);
      
      // Refresh users list
      await fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowAddModal(false);
    setNewUser({ username: '', password: '', confirmPassword: '' });
    setError(null);
  };

  // Handle role change
  const handleRoleChange = async (userId, newRole) => {
    // Prevent admin from changing their own role
    if (userId === user?.id) {
      setError('You cannot change your own role');
      return;
    }

    setUpdatingRoles(prev => ({ ...prev, [userId]: true }));
    setError(null);

    try {
      const response = await fetch(createApiUrl(`api/users/${userId}`), {
        method: 'PUT',
        headers: createAuthHeaders(token),
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user role');
      }

      // Refresh users list
      await fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingRoles(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Handle delete user click (show confirmation modal)
  const handleDeleteUserClick = (userId, username) => {
    // Prevent admin from deleting themselves
    if (userId === user?.id) {
      setError('You cannot delete your own account');
      return;
    }

    setUserToDelete({ id: userId, username: username });
    setShowDeleteModal(true);
  };

  // Handle delete user confirmation
  const handleDeleteUserConfirm = async () => {
    if (!userToDelete) return;

    setDeletingUsers(prev => ({ ...prev, [userToDelete.id]: true }));
    setError(null);

    try {
      const response = await fetch(createApiUrl(`api/users/${userToDelete.id}`), {
        method: 'DELETE',
        headers: createAuthHeaders(token)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }

      // Refresh users list
      await fetchUsers();
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingUsers(prev => ({ ...prev, [userToDelete.id]: false }));
    }
  };

  // Handle delete modal close
  const handleDeleteModalClose = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  // Handle view user details
  const handleViewUserDetails = async (userId) => {
    try {
      const response = await fetch(createApiUrl(`api/users/${userId}`), {
        headers: createAuthHeaders(token)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }

      const data = await response.json();
      setSelectedUser(data.data);
      setShowUserDetails(true);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle close user details modal
  const handleCloseUserDetails = () => {
    setShowUserDetails(false);
    setSelectedUser(null);
  };

  // Handle menu toggle for mobile
  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  if (loading) {
    return (
      <div className="users-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="users-page">
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <MobileHeader onMenuToggle={handleMenuToggle} isMenuOpen={isMenuOpen} />
      
      <main className="users-main">
        <div className="users-content">
          {/* Header Section */}
          <div className="users-header">
            <div className="users-title-section">
              <h1 className="users-title">Users</h1>
              <p className="users-subtitle">Manage system users and permissions</p>
            </div>
            
            <div className="users-actions">
              <div className="search-container">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="search-input"
                />
              </div>
              
              {/* Filter Dropdowns */}
              <div className="filters-container">
                <select
                  value={filters.role}
                  onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                  className="filter-select"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="officer">Officer</option>
                  <option value="user">User</option>
                </select>
                
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="filter-select"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <button className="add-user-btn-new" onClick={handleAddUserClick}>
                <svg className="add-icon-new" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="add-user-text-new">
                  <div className="add-text-new">Add User</div>
                  {/* <div className="user-text-new">User</div> */}
                </div>
              </button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="error-message">
              <p>Error loading users: {error}</p>
              <button onClick={fetchUsers} className="retry-btn">Retry</button>
            </div>
          )}

          {/* Users Grid */}
          <div className="users-grid">
            {users.length === 0 ? (
              <div className="no-users">
                <p>No users found</p>
              </div>
            ) : (
              users.map((userData) => (
                <div key={userData._id} className={`user-card ${userData._id === user?.id ? 'current-user' : ''}`}>
                  <div className="user-avatar">
                    {getUserInitials(userData.username)}
                  </div>
                  
                  <div className="user-info">
                    <h3 className="user-name">{getDisplayName(userData.username)}</h3>
                    <p className="user-username">@{userData.username}</p>
                  </div>
                  
                  <div className="user-meta">
                    <div className="user-role">
                      <select
                        value={userData.role}
                        onChange={(e) => handleRoleChange(userData._id, e.target.value)}
                        disabled={updatingRoles[userData._id] || userData._id === user?.id}
                        className={`role-select ${userData.role}`}
                        title={userData._id === user?.id ? "You cannot change your own role" : "Change user role"}
                      >
                        <option value="user">User</option>
                        <option value="officer">Officer</option>
                        <option value="admin">Admin</option>
                      </select>
                      {updatingRoles[userData._id] && (
                        <span className="role-updating">Updating...</span>
                      )}
                    </div>
                    
                    <div className="user-status">
                      <span className={`status-tag ${userData.isActive ? 'active' : 'inactive'}`}>
                        {userData.isActive ? 'active' : 'inactive'}
                      </span>
                    </div>
                    
                    <div className="user-last-login">
                      <span className="last-login-label">Last login:</span>
                      <span className="last-login-value">
                        {formatLastLogin(userData.lastLogin)}
                      </span>
                    </div>
                    
                    <div className="user-actions">
                      <button
                        onClick={() => handleViewUserDetails(userData._id)}
                        className="view-details-btn"
                        title="View user details"
                      >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => handleDeleteUserClick(userData._id, userData.username)}
                        disabled={deletingUsers[userData._id] || userData._id === user?.id}
                        className="delete-user-btn"
                        title={userData._id === user?.id ? "You cannot delete your own account" : "Delete user"}
                      >
                        {deletingUsers[userData._id] ? (
                          <span>Deleting...</span>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                disabled={pagination.current === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              
              <div className="pagination-info">
                Page {pagination.current} of {pagination.pages} ({pagination.total} total)
              </div>
              
              <button
                onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                disabled={pagination.current === pagination.pages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New User</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={newUser.username}
                  onChange={handleInputChange}
                  required
                  pattern="[a-zA-Z0-9_]+"
                  title="Username can only contain letters, numbers, and underscores"
                  placeholder="Enter username"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={newUser.password}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter password"
                  minLength="6"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="password-confirm-wrapper">
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={newUser.confirmPassword}
                    onChange={handleInputChange}
                    required
                    placeholder="Confirm password"
                    minLength="6"
                    className={newUser.confirmPassword && newUser.password !== newUser.confirmPassword ? 'password-mismatch' : ''}
                  />
                  {newUser.confirmPassword && (
                    <div className="password-match-indicator">
                      {newUser.password === newUser.confirmPassword ? (
                        <span className="match-success">✓</span>
                      ) : (
                        <span className="match-error">✗</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {error && (
                <div className="form-error">
                  {error}
                </div>
              )}
              
              <div className="modal-actions">
                <button type="button" onClick={handleCloseModal} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="modal-overlay" onClick={handleCloseUserDetails}>
          <div className="modal-content user-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Details</h2>
              <button className="modal-close" onClick={handleCloseUserDetails}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            <div className="user-details-content">
              <div className="user-details-avatar">
                <div className="user-avatar-large">
                  {getUserInitials(selectedUser.username)}
                </div>
                <h3>{getDisplayName(selectedUser.username)}</h3>
                <p className="user-username-detail">@{selectedUser.username}</p>
              </div>
              
              <div className="user-details-info">
                <div className="detail-row">
                  <span className="detail-label">User ID:</span>
                  <span className="detail-value">{selectedUser._id}</span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{selectedUser.phone || 'Not provided'}</span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Role:</span>
                  <span className={`detail-value role-badge ${selectedUser.role}`}>
                    {selectedUser.role}
                  </span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`detail-value status-badge ${selectedUser.isActive ? 'active' : 'inactive'}`}>
                    {selectedUser.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Username:</span>
                  <span className="detail-value">@{selectedUser.username}</span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Default Admin:</span>
                  <span className="detail-value">{selectedUser.isDefaultAdmin ? 'Yes' : 'No'}</span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Created:</span>
                  <span className="detail-value">
                    {new Date(selectedUser.createdAt).toLocaleDateString()} at {new Date(selectedUser.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Last Updated:</span>
                  <span className="detail-value">
                    {new Date(selectedUser.updatedAt).toLocaleDateString()} at {new Date(selectedUser.updatedAt).toLocaleTimeString()}
                  </span>
                </div>
                
                {selectedUser.lastLogin && (
                  <div className="detail-row">
                    <span className="detail-label">Last Login:</span>
                    <span className="detail-value">
                      {new Date(selectedUser.lastLogin).toLocaleDateString()} at {new Date(selectedUser.lastLogin).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-actions">
              <button type="button" onClick={handleCloseUserDetails} className="btn-cancel">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="modal-overlay" onClick={handleDeleteModalClose}>
          <div className="modal-content delete-confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete User</h2>
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
              
              <h3>Are you sure you want to delete this user?</h3>
              <p className="delete-user-info">
                <strong>Username:</strong> @{userToDelete.username}
              </p>
              <p className="delete-warning-text">
                This action cannot be undone. The user will be permanently removed from the system.
              </p>
            </div>
            
            <div className="modal-actions">
              <button 
                type="button" 
                onClick={handleDeleteModalClose} 
                className="btn-cancel"
                disabled={deletingUsers[userToDelete.id]}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleDeleteUserConfirm} 
                className="btn-delete"
                disabled={deletingUsers[userToDelete.id]}
              >
                {deletingUsers[userToDelete.id] ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;