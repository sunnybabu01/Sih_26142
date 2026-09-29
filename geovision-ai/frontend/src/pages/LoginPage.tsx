import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Satellite, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, setDemoUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = (role: 'researcher' | 'admin') => {
    setDemoUser(role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[#0F1A3A]/90 border border-[#00F0FF]/30 shadow-2xl space-y-6">
        
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-xl bg-[#14234C] text-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.25)]">
            <Satellite className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sign In to GeoVision AI</h1>
          <p className="text-xs text-slate-400">
            Access satellite super-resolution mapping tools and telemetry.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Demo Fast Login Switchers */}
        <div className="p-3 rounded-xl bg-[#060913] border border-slate-800 space-y-2">
          <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>Instant Demo Evaluation Logins:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemo('researcher')}
              className="py-1.5 px-2 rounded-lg bg-[#14234C] hover:bg-[#00F0FF] text-[#00F0FF] hover:text-black font-semibold transition-all border border-[#00F0FF]/30"
            >
              GIS Researcher
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              className="py-1.5 px-2 rounded-lg bg-amber-950/40 hover:bg-amber-400 text-amber-300 hover:text-black font-semibold transition-all border border-amber-500/40"
            >
              Administrator
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="space-y-1">
            <label className="text-slate-300 font-medium">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="researcher@geovision.ai"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#060913] border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-[#00F0FF]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 font-medium">Password</label>
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-[#00F0FF] hover:bg-[#38bdf8] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] flex items-center justify-center space-x-1.5"
          >
            <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </form>

        <div className="text-center text-xs text-slate-400">
          Need an account?{' '}
          <Link to="/register" className="text-[#00F0FF] hover:underline font-semibold">
            Register here
          </Link>
        </div>

      </div>
    </div>
  );
};
