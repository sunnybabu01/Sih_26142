import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Satellite, Lock, Mail, User as UserIcon, Shield, ArrowRight, AlertCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'researcher' | 'user' | 'admin'>('researcher');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await register(name, email, password, role);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[#0F1A3A]/90 border border-[#00F0FF]/30 shadow-2xl space-y-6">
        
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-xl bg-[#14234C] text-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.25)]">
            <Satellite className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create GeoVision Account</h1>
          <p className="text-xs text-slate-400">
            Join researchers utilizing deep learning for satellite mapping.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="space-y-1">
            <label className="text-slate-300 font-medium">Full Name</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Maya Lin"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#060913] border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-[#00F0FF]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 font-medium">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="m.lin@earth-observation.org"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#060913] border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-[#00F0FF]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 font-medium">Password (Min. 6 characters)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#060913] border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-[#00F0FF]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 font-medium">Operational Role</label>
            <div className="relative">
              <Shield className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#060913] border border-slate-700 text-white focus:outline-none focus:border-[#00F0FF] cursor-pointer"
              >
                <option value="researcher">GIS Researcher / Analyst</option>
                <option value="user">Standard User / Viewer</option>
                <option value="admin">Platform Administrator</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-[#00F0FF] hover:bg-[#38bdf8] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] flex items-center justify-center space-x-1.5"
          >
            <span>{isSubmitting ? 'Registering...' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </form>

        <div className="text-center text-xs text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-[#00F0FF] hover:underline font-semibold">
            Sign In
          </Link>
        </div>

      </div>
    </div>
  );
};
