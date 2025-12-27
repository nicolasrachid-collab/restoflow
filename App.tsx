import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './components/Layout';
import { PublicLayout } from './components/PublicLayout';
import { RestoProvider } from './context/RestoContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ui/ToastContainer';

// Admin Pages
import { Dashboard } from './pages/admin/Dashboard';
import { QueueManager } from './pages/admin/QueueManager';
import { MenuManager } from './pages/admin/MenuManager';
import { MarketInsights } from './pages/admin/MarketInsights';
import { Reservations } from './pages/admin/Reservations';
import { PublicLinks } from './pages/admin/PublicLinks';
import { Categories } from './pages/admin/Categories';
import { OperatingHours } from './pages/admin/OperatingHours';
import { RestaurantSettings } from './pages/admin/RestaurantSettings';
import { Users } from './pages/admin/Users';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Public Pages
import { PublicMenu } from './pages/public/PublicMenu';
import { PublicQueue } from './pages/public/PublicQueue';
import { PublicReservation } from './pages/public/PublicReservation';

// Wrapper para rotas protegidas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <div className="h-screen flex items-center justify-center">Carregando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Public Tenant Routes */}
        <Route path="/r/:slug/menu" element={<PublicLayout><PublicMenu /></PublicLayout>} />
        <Route path="/r/:slug/fila" element={<PublicLayout><PublicQueue /></PublicLayout>} />
        <Route path="/r/:slug/reservas" element={<PublicLayout><PublicReservation /></PublicLayout>} />
        
        {/* Admin Routes (Protected) */}
        <Route path="/admin" element={<ProtectedRoute><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/queue" element={<ProtectedRoute><AdminLayout><QueueManager /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/reservations" element={<ProtectedRoute><AdminLayout><Reservations /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/menu" element={<ProtectedRoute><AdminLayout><MenuManager /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute><AdminLayout><Categories /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/operating-hours" element={<ProtectedRoute><AdminLayout><OperatingHours /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/insights" element={<ProtectedRoute><AdminLayout><MarketInsights /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/links" element={<ProtectedRoute><AdminLayout><PublicLinks /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute><AdminLayout><RestaurantSettings /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><AdminLayout><Users /></AdminLayout></ProtectedRoute>} />

        {/* Default Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* Catch-all removido para permitir rotas públicas funcionarem corretamente */}
    </Routes>
  );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <RestoProvider>
          <BrowserRouter>
            <AppRoutes />
            <ToastContainer />
          </BrowserRouter>
        </RestoProvider>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;