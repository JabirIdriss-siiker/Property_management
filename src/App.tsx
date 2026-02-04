import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './hooks/useAppState';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Apartments } from './pages/Apartments';
import { Bags } from './pages/Bags';
import { Missions } from './pages/Missions';
import { Stock } from './pages/Stock';
import { AgentView } from './pages/AgentView';
import { Login } from './pages/Login';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

export function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<HomeRedirect />} />
              <Route path="apartments" element={<ProtectedRoute requireAdmin><Apartments /></ProtectedRoute>} />
              <Route path="bags" element={<ProtectedRoute requireAdmin><Bags /></ProtectedRoute>} />
              <Route path="missions" element={<ProtectedRoute requireAdmin><Missions /></ProtectedRoute>} />
              <Route path="stock" element={<ProtectedRoute requireAdmin><Stock /></ProtectedRoute>} />
              <Route path="agent" element={<AgentView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}

function HomeRedirect() {
  const { isAdmin } = useAuth();
  return isAdmin ? <Dashboard /> : <Navigate to="/agent" replace />;
}