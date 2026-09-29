import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  requiredRole?: 'user' | 'researcher' | 'admin';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060913] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#00F0FF]/20 border-t-[#00F0FF] rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-[#00F0FF] tracking-wider uppercase">Authenticating Geospatial Session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'admin' && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#060913] flex items-center justify-center p-4">
        <div className="max-w-md p-6 rounded-xl bg-[#0F1A3A] border border-rose-500/40 text-center space-y-4">
          <h2 className="text-lg font-bold text-rose-400">Access Restricted</h2>
          <p className="text-sm text-slate-300">
            This module requires Administrator clearance. Your current role is <span className="font-mono text-cyan-400 font-semibold">{user.role}</span>.
          </p>
          <Navigate to="/dashboard" replace />
        </div>
      </div>
    );
  }

  return <Outlet />;
};
