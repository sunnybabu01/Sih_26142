import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { ProcessingPage } from './pages/ProcessingPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { ResultsPage } from './pages/ResultsPage';
import { HistoryPage } from './pages/HistoryPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Auth Pages with standalone Navbar */}
          <Route
            path="/"
            element={
              <div className="min-h-screen bg-[#060913] flex flex-col">
                <Navbar />
                <LandingPage />
              </div>
            }
          />
          <Route
            path="/login"
            element={
              <div className="min-h-screen bg-[#060913] flex flex-col">
                <Navbar />
                <LoginPage />
              </div>
            }
          />
          <Route
            path="/register"
            element={
              <div className="min-h-screen bg-[#060913] flex flex-col">
                <Navbar />
                <RegisterPage />
              </div>
            }
          />

          {/* Protected Application Routes inside DashboardLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/processing" element={<ProcessingPage />} />
              <Route path="/compare" element={<ComparisonPage />} />
              <Route path="/results/:jobId" element={<ResultsPage />} />
              <Route path="/history" element={<HistoryPage />} />

              {/* Admin Protected Route */}
              <Route element={<ProtectedRoute requiredRole="admin" />}>
                <Route path="/admin" element={<AdminDashboardPage />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
