import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Sparkles, 
  SplitSquareVertical, 
  Clock, 
  ShieldCheck, 
  FileText,
  Compass
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/upload', label: 'Upload Satellite Image', icon: UploadCloud },
    { to: '/processing', label: 'SRM Processing', icon: Sparkles },
    { to: '/compare', label: 'Interactive Comparison', icon: SplitSquareVertical },
    { to: '/history', label: 'Processing History', icon: Clock },
  ];

  if (user?.role === 'admin') {
    navItems.push({ to: '/admin', label: 'Admin Dashboard', icon: ShieldCheck });
  }

  return (
    <aside className="w-64 bg-[#0A1128]/70 border-r border-[#00F0FF]/15 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex">
      <div className="space-y-6">
        
        {/* Navigation Category */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-mono uppercase tracking-widest text-[#00F0FF]/60 flex items-center space-x-1.5">
            <Compass className="w-3.5 h-3.5" />
            <span>Navigation</span>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#14234C] text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_15px_rgba(0,240,255,0.15)] font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#0F1A3A]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sentinel-2 Technical Specs Info Box */}
        <div className="p-3.5 rounded-xl bg-[#0F1A3A]/80 border border-[#00F0FF]/20 text-xs space-y-2">
          <div className="text-[11px] font-mono uppercase text-[#00F0FF] tracking-wider font-semibold">
            Input Sensor: Sentinel-2
          </div>
          <div className="text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Native Resolution:</span>
              <span className="font-mono text-white">10.0 meters</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target Pixel Spacing:</span>
              <span className="font-mono text-[#00F0FF] font-semibold">&lt; 4.0 meters (2.5m)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Model Architecture:</span>
              <span className="font-mono text-white">SRM-Net (RCAN/RRDB)</span>
            </div>
          </div>
        </div>

      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
        <div>GeoVision AI v1.0.0</div>
        <div className="text-[10px] text-slate-600">Deep Learning SRM Engine</div>
      </div>
    </aside>
  );
};
