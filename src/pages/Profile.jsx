import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateProfile(formData);
      
      if (result.success) {
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
      } else {
        setError(result.message || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred while updating your profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      email: user?.email || '',
      phone: user?.phone || ''
    });
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const getDisplayName = (email) => {
    if (!email) return 'User';
    const namePart = email.split('@')[0];
    return namePart.split('.').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');
  };

  const getUserInitials = (email) => {
    if (!email) return 'U';
    const namePart = email.split('@')[0];
    const parts = namePart.split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return namePart.substring(0, 2).toUpperCase();
  };

  return (
    <div className="profile-page">
      <MobileHeader onMenuToggle={toggleSidebar} isMenuOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      
      <main className="profile-main">
        <div className="profile-header">
          <h1>Profile</h1>
          <p>Manage your account information</p>
        </div>
        
        <div className="profile-content">
          <div className="profile-card">
            <div className="profile-avatar-section">
              <div className="profile-avatar">
                {getUserInitials(user?.email)}
              </div>
              <div className="profile-info">
                <h2>{getDisplayName(user?.email)}</h2>
                <p className="profile-email">{user?.email}</p>
                <span className={`profile-role ${user?.role}`}>
                  {user?.role}
                </span>
              </div>
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

            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="+1234567890"
                />
              </div>

              <div className="form-actions">
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="btn-edit"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="edit-actions">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="btn-cancel"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-save"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            </form>

            <div className="profile-details">
              <h3>Account Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">User ID:</span>
                  <span className="detail-value">{user?._id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Role:</span>
                  <span className={`detail-value role-badge ${user?.role}`}>
                    {user?.role}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status:</span>
                  <span className={`detail-value status-badge ${user?.isActive ? 'active' : 'inactive'}`}>
                    {user?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email Verified:</span>
                  <span className={`detail-value status-badge ${user?.emailVerified ? 'verified' : 'unverified'}`}>
                    {user?.emailVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Member Since:</span>
                  <span className="detail-value">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                {user?.lastLogin && (
                  <div className="detail-item">
                    <span className="detail-label">Last Login:</span>
                    <span className="detail-value">
                      {new Date(user.lastLogin).toLocaleDateString()} at {new Date(user.lastLogin).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;