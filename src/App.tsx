import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';

// Lazy load components for performance
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const SalesmanDashboard = React.lazy(() => import('./pages/salesman/Dashboard'));
const CustomerDashboard = React.lazy(() => import('./pages/customer/Dashboard'));
const SuperAdminDashboard = React.lazy(() => import('./pages/super-admin/Dashboard'));

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, erpUser, loading, isAuthReady } = useAuth();

  if (loading || !isAuthReady) {
    return <div className="flex items-center justify-center h-screen font-mono text-zinc-500 animate-pulse">LUBRI-ERP PRO // INITIALIZING SYSTEM...</div>;
  }

  // Demo Mode: Default to super_admin or current ERP user role
  const role = erpUser?.role || 'super_admin';

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" />;
  }

  return <React.Suspense fallback={<div>Loading Panel...</div>}>{children}</React.Suspense>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<React.Suspense fallback={null}><LandingPage /></React.Suspense>} />
          <Route path="/login" element={<React.Suspense fallback={null}><LoginPage /></React.Suspense>} />
          
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/salesman/*" element={
            <ProtectedRoute allowedRoles={['salesman', 'super_admin']}>
              <SalesmanDashboard />
            </ProtectedRoute>
          } />

          <Route path="/portal/*" element={
            <ProtectedRoute allowedRoles={['customer', 'super_admin']}>
              <CustomerDashboard />
            </ProtectedRoute>
          } />

          <Route path="/super/*" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
