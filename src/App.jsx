import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Users from './pages/Users';
import Trucks from './pages/Trucks';
import Drivers from './pages/Drivers';
import Customers from './pages/Customers';
import Journeys from './pages/Journeys';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false, requireAdminOnly = false }) => {
  const { user, loading, isAdminOrOfficer, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdminOnly && !isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireAdmin && !isAdminOrOfficer()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main App Routes
const AppRoutes = () => {
  const { user, isAdminOrOfficer } = useAuth();

  const getDashboardPath = () => {
    if (isAdminOrOfficer()) {
      return '/admin/dashboard';
    }
    return '/dashboard';
  };

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to={getDashboardPath()} replace /> : <Login />} 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/users" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <Users />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/trucks" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <Trucks />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/drivers" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <Drivers />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/customers" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <Customers />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/journeys" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <Journeys />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/reports" 
        element={
          <ProtectedRoute requireAdminOnly={true}>
            <Reports />
          </ProtectedRoute>
        } 
      />
      
      {/* User routes - accessible to all authenticated users */}
      <Route 
        path="/trucks" 
        element={
          <ProtectedRoute>
            <Trucks />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/drivers" 
        element={
          <ProtectedRoute>
            <Drivers />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/customers" 
        element={
          <ProtectedRoute>
            <Customers />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/journeys" 
        element={
          <ProtectedRoute>
            <Journeys />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/reports" 
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/settings" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <Settings />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/profile" 
        element={
          <ProtectedRoute requireAdmin={true}>
            <Profile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
