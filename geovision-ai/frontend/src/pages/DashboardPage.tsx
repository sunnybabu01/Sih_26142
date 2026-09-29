import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  UploadCloud, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Cpu, 
  ArrowUpRight, 
  Activity,
  Calendar,
  Eye,
  FileText
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [images, setImages] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [imgRes, jobRes] = await Promise.all([
          api.get('/images'),
          api.get('/processing/jobs'),
        ]);
        if (imgRes.data.success) setImages(imgRes.data.images || []);
        if (jobRes.data.success) setJobs(jobRes.data.jobs || []);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const completedJobs = jobs.filter((j) => j.status === 'completed');
  const failedJobs = jobs.filter((j) => j.status === 'failed');
  const pendingJobs = jobs.filter((j) => ['pending', 'processing'].includes(j.status));

  // Chart data
  const statusChartData = [
    { name: 'Completed', count: completedJobs.length, color: '#10B981' },
    { name: 'Processing', count: pendingJobs.length, color: '#00F0FF' },
    { name: 'Failed', count: failedJobs.length, color: '#F43F5E' },
  ];

  const scaleDistribution = [
    { name: '4x (10m -> 2.5m)', value: jobs.filter((j) => j.scaleFactor === 4).length || 1, color: '#00F0FF' },
    { name: '2x (10m -> 5.0m)', value: jobs.filter((j) => j.scaleFactor === 2).length || 0, color: '#3B82F6' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0F1A3A] via-[#14234C] to-[#0A1128] border border-[#00F0FF]/25 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-mono text-[#00F0FF] uppercase tracking-wider flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5" />
            <span>Mission Control Active &bull; {user?.role.toUpperCase()} CLEARANCE</span>
          </div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user?.name || 'Researcher'}
          </h1>
          <p className="text-xs text-slate-300">
            Sentinel-2 SRM Deep Learning Engine ready. Upload medium-resolution rasters to begin.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/upload"
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#00F0FF] hover:bg-[#38bdf8] text-black font-bold text-xs shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload New Imagery</span>
          </Link>
        </div>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-xl bg-[#0F1A3A]/80 border border-[#00F0FF]/20 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>TOTAL UPLOADS</span>
            <Layers className="w-4 h-4 text-[#00F0FF]" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2 font-mono">{images.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">GeoTIFF &amp; Satellite scenes</div>
        </div>

        <div className="p-5 rounded-xl bg-[#0F1A3A]/80 border border-[#00F0FF]/20 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>COMPLETED JOBS</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2 font-mono">{completedJobs.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Successfully super-resolved</div>
        </div>

        <div className="p-5 rounded-xl bg-[#0F1A3A]/80 border border-[#00F0FF]/20 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>ACTIVE QUEUE</span>
            <Clock className="w-4 h-4 text-[#00F0FF]" />
          </div>
          <div className="text-3xl font-extrabold text-[#00F0FF] mt-2 font-mono">{pendingJobs.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Inference in progress</div>
        </div>

        <div className="p-5 rounded-xl bg-[#0F1A3A]/80 border border-[#00F0FF]/20 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>ACTIVE MODEL</span>
            <Cpu className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2 font-mono">SRM-Net 4x</div>
          <div className="text-[11px] text-[#00F0FF] mt-1 font-mono">10m &rarr; 2.5m (v1.4)</div>
        </div>

      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Status Distribution Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#0F1A3A]/70 border border-[#00F0FF]/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Super-Resolution Job Analytics</h3>
            <span className="text-xs font-mono text-slate-400">Total: {jobs.length} jobs</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#060913', borderColor: '#00F0FF', borderRadius: '8px' }}
                />
                <Bar dataKey="count" name="Jobs" fill="#00F0FF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scale Factor Breakdown Pie Chart */}
        <div className="p-5 rounded-xl bg-[#0F1A3A]/70 border border-[#00F0FF]/20 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Enhancement Factor Split</h3>
            <p className="text-xs text-slate-400">Distribution across 4x and 2x scales</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={scaleDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  innerRadius={40}
                  paddingAngle={5}
                >
                  {scaleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#060913', borderColor: '#00F0FF', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-xs font-mono border-t border-slate-800 pt-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00F0FF]"></span>
                <span>4x (2.5m Target)</span>
              </span>
              <span className="text-white font-bold">{jobs.filter((j) => j.scaleFactor === 4).length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center space-x-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></span>
                <span>2x (5.0m Target)</span>
              </span>
              <span className="text-white font-bold">{jobs.filter((j) => j.scaleFactor === 2).length}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Recently Processed Satellite Images */}
      <div className="p-5 rounded-xl bg-[#0F1A3A]/70 border border-[#00F0FF]/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white">Recent Super-Resolution Processing Jobs</h3>
            <p className="text-xs text-slate-400">View enhanced geospatial outputs and accuracy reports</p>
          </div>
          <Link to="/history" className="text-xs text-[#00F0FF] hover:underline flex items-center space-x-1">
            <span>View All History</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="py-10 text-center space-y-3 border border-dashed border-slate-800 rounded-xl">
            <Clock className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm text-slate-400">No processing jobs recorded yet.</div>
            <Link
              to="/upload"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#00F0FF] text-black font-semibold text-xs"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload First Satellite Scene</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#060913] text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Filename</th>
                  <th className="py-3 px-4">Model &amp; Scale</th>
                  <th className="py-3 px-4">Target Spacing</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {jobs.slice(0, 5).map((job) => (
                  <tr key={job._id || job.id} className="hover:bg-[#14234C]/40 transition-colors">
                    <td className="py-3.5 px-4 font-sans font-medium text-slate-200">
                      {job.imageId?.originalFilename || 'Sentinel-2 Scene'}
                    </td>
                    <td className="py-3.5 px-4 text-[#00F0FF]">
                      {job.scaleFactor}x SRM ({job.modelName || 'SRM-Net'})
                    </td>
                    <td className="py-3.5 px-4 text-emerald-400">
                      {job.targetPixelSpacingEstimate}m
                    </td>
                    <td className="py-3.5 px-4">
                      {job.status === 'completed' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 text-[10px]">
                          Completed
                        </span>
                      )}
                      {job.status === 'processing' && (
                        <span className="px-2 py-0.5 rounded-full bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 text-[10px] animate-pulse">
                          Processing ({job.progress}%)
                        </span>
                      )}
                      {job.status === 'failed' && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-400 border border-rose-500/40 text-[10px]">
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {job.durationSeconds ? `${job.durationSeconds}s` : '--'}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2 font-sans">
                      <Link
                        to={`/compare?jobId=${job._id || job.id}`}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-[#14234C] text-[#00F0FF] hover:bg-[#00F0FF] hover:text-black transition-all text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Compare</span>
                      </Link>
                      <Link
                        to={`/results/${job._id || job.id}`}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 transition-all text-xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Report</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
