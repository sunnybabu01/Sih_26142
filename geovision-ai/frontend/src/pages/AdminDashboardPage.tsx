import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  ShieldCheck, 
  Users, 
  HardDrive, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  Database,
  Clock,
  Terminal,
  Settings
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [dashRes, usersRes, modelsRes] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/admin/users'),
          api.get('/admin/models'),
        ]);

        if (dashRes.data.success) setStats(dashRes.data.stats);
        if (usersRes.data.success) setUsers(usersRes.data.users);
        if (modelsRes.data.success && modelsRes.data.data?.models) {
          setModels(modelsRes.data.data.models);
        }
      } catch (err) {
        console.error('Failed to load admin telemetry:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
        <div className="space-y-1">
          <div className="text-xs font-mono uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Administrator Operations Command</span>
          </div>
          <h1 className="text-2xl font-bold text-white">System Infrastructure &amp; User Oversight</h1>
          <p className="text-xs text-slate-300">
            Monitor deep learning inference compute, storage consumption, user roles, and supported SRM architectures.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300 font-mono text-xs flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          <span>ADMIN PRIVILEGES ACTIVE</span>
        </div>
      </div>

      {/* High-Level Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-5 rounded-xl bg-[#0F1A3A]/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>REGISTERED USERS</span>
              <Users className="w-4 h-4 text-[#00F0FF]" />
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">{stats.totalUsers}</div>
            <div className="text-[11px] text-slate-400">Researchers &amp; GIS operators</div>
          </div>

          <div className="p-5 rounded-xl bg-[#0F1A3A]/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>SUCCESS RATE</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 font-mono">
              {stats.successRatePercent}%
            </div>
            <div className="text-[11px] text-slate-400">{stats.completedJobs} of {stats.totalJobs} completed</div>
          </div>

          <div className="p-5 rounded-xl bg-[#0F1A3A]/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>STORAGE CONSUMPTION</span>
              <HardDrive className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-amber-400 font-mono">{stats.storageUsedMb} <span className="text-xs">MB</span></div>
            <div className="text-[11px] text-slate-400">GeoTIFF uploads &amp; outputs</div>
          </div>

          <div className="p-5 rounded-xl bg-[#0F1A3A]/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>AI INFERENCE STATUS</span>
              <Cpu className="w-4 h-4 text-[#00F0FF]" />
            </div>
            <div className="text-lg font-bold text-white font-mono flex items-center space-x-2 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{stats.aiService.status}</span>
            </div>
            <div className="text-[11px] text-[#00F0FF] font-mono">Compute Device: {stats.aiService.device}</div>
          </div>

        </div>
      )}

      {/* System Hardware & Memory Telemetry */}
      {stats?.system && (
        <div className="p-5 rounded-2xl bg-[#0F1A3A]/70 border border-[#00F0FF]/20 space-y-3">
          <div className="text-sm font-bold text-white flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-[#00F0FF]" />
            <span>Host Server Runtimes &amp; Hardware Telemetry</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-[#060913] border border-slate-800">
              <span className="text-slate-500 block">Host Platform:</span>
              <span className="text-white font-semibold">{stats.system.platform}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#060913] border border-slate-800">
              <span className="text-slate-500 block">CPU Cores Available:</span>
              <span className="text-[#00F0FF] font-semibold">{stats.system.cpuCount} Cores</span>
            </div>
            <div className="p-3 rounded-lg bg-[#060913] border border-slate-800">
              <span className="text-slate-500 block">Host Memory:</span>
              <span className="text-emerald-400 font-semibold">{stats.system.freeMemoryGb} GB Free / {stats.system.totalMemoryGb} GB</span>
            </div>
            <div className="p-3 rounded-lg bg-[#060913] border border-slate-800">
              <span className="text-slate-500 block">Server Uptime:</span>
              <span className="text-amber-400 font-semibold">{stats.system.uptimeHours} Hours</span>
            </div>
          </div>
        </div>
      )}

      {/* Model Configurations Management */}
      <div className="p-5 rounded-2xl bg-[#0F1A3A]/70 border border-[#00F0FF]/20 space-y-4">
        <div className="text-sm font-bold text-white flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-[#00F0FF]" />
          <span>Active Super-Resolution Model Registry</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {models.map((m) => (
            <div key={m.id} className="p-4 rounded-xl bg-[#060913] border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">{m.name}</span>
                <span className="px-2 py-0.5 rounded bg-[#00F0FF]/15 text-[#00F0FF] font-mono text-[10px]">
                  v{m.version}
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">{m.description}</p>
              <div className="flex justify-between border-t border-slate-800/80 pt-2 font-mono text-[11px]">
                <span className="text-slate-500">Parameters: {m.parameters}</span>
                <span className="text-emerald-400">Scale: {m.scale_factor}x ({m.target_resolution_from_10m})</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Management Table */}
      <div className="p-5 rounded-2xl bg-[#0F1A3A]/70 border border-[#00F0FF]/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-white flex items-center space-x-2">
            <Users className="w-4 h-4 text-[#00F0FF]" />
            <span>Registered Platform Operators</span>
          </div>
          <span className="text-xs font-mono text-slate-400">{users.length} Users</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#060913] text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Name</th>
                <th className="py-3 px-3">Email Address</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {users.map((u) => (
                <tr key={u._id || u.id} className="hover:bg-[#14234C]/40 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-200">{u.name}</td>
                  <td className="py-3 px-3 font-mono text-slate-400">{u.email}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold ${
                      u.role === 'admin'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        : 'bg-[#14234C] text-[#00F0FF] border border-[#00F0FF]/30'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
