/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { Toaster } from './components/ui/sonner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EvaluationForm from './pages/EvaluationForm';
import AdminPanel from './pages/AdminPanel';
import FacultyReports from './pages/FacultyReports';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center font-mono italic">Initializing System...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/evaluate/:sectionId" element={<EvaluationForm />} />
                <Route path="/admin/*" element={<AdminPanel />} />
                <Route path="/reports" element={<FacultyReports />} />
              </Routes>
            </PrivateRoute>
          }
        />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

