import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Clock, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/processing/jobs');
      if (res.data.success && res.data.jobs) {
        setJobs(res.data.jobs);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCancelJob = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this processing job?')) return;
    try {
      await api.post(`/processing/jobs/${id}/cancel`);
      fetchJobs();
    } catch (err) {
      alert('Could not cancel job.');
    }
  };

  // Filter & Search
  const filteredJobs = jobs.filter((job) => {
    const filename = job.imageId?.originalFilename?.toLowerCase() || '';
    const jobId = String(job._id || job.id).toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = filename.includes(query) || jobId.includes(query);

    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && job.status === statusFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage) || 1;
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-mono uppercase tracking-wider text-[#00F0FF] flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Job Log &amp; Audit Trail</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Processing History</h1>
          <p className="text-xs text-slate-300">
            Review previous satellite enhancement runs, access generated GeoTIFF downloads, and inspect accuracy.
          </p>
        </div>

        <button
          onClick={fetchJobs}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0F1A3A] hover:bg-[#14234C] text-slate-300 hover:text-[#00F0FF] text-xs font-mono border border-slate-700 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Jobs</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#0F1A3A]/80 border border-[#00F0FF]/20 flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
        
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by filename or Job ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#060913] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-[#00F0FF]"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-lg bg-[#060913] border border-slate-700 text-slate-200 focus:outline-none focus:border-[#00F0FF] cursor-pointer"
          >
            <option value="all">All Statuses ({jobs.length})</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

      </div>

      {/* Jobs Table */}
      <div className="p-5 rounded-2xl bg-[#0F1A3A]/70 border border-[#00F0FF]/20 space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-[#00F0FF]">
            Loading processing history...
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="py-12 text-center space-y-2 border border-dashed border-slate-800 rounded-xl">
            <Clock className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm text-slate-400">No processing jobs match your filter.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#060913] text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Job ID</th>
                  <th className="py-3 px-3">Satellite File</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Model &amp; Scale</th>
                  <th className="py-3 px-3">Target Spacing</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Duration</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {paginatedJobs.map((job) => {
                  const jobIdStr = String(job._id || job.id);
                  const isCompleted = job.status === 'completed';

                  return (
                    <tr key={jobIdStr} className="hover:bg-[#14234C]/40 transition-colors">
                      <td className="py-3 px-3 text-[#00F0FF] font-semibold">
                        {jobIdStr.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-3 px-3 font-sans font-medium text-slate-200">
                        {job.imageId?.originalFilename || 'Sentinel-2 Scene'}
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-sans">
                        {new Date(job.createdAt || job.startedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-white">
                        {job.scaleFactor}x ({job.modelName || 'SRM-Net'})
                      </td>
                      <td className="py-3 px-3 text-emerald-400">
                        {job.targetPixelSpacingEstimate}m
                      </td>
                      <td className="py-3 px-3">
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
                          <span className="px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-400 border border-rose-500/40 text-[10px]" title={job.errorMessage}>
                            Failed
                          </span>
                        )}
                        {job.status === 'cancelled' && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                            Cancelled
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {job.durationSeconds ? `${job.durationSeconds}s` : '--'}
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5 font-sans">
                        {isCompleted && (
                          <>
                            <Link
                              to={`/compare?jobId=${jobIdStr}`}
                              title="Compare Before & After"
                              className="inline-flex p-1.5 rounded bg-[#14234C] text-[#00F0FF] hover:bg-[#00F0FF] hover:text-black transition-all"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>

                            <Link
                              to={`/results/${jobIdStr}`}
                              title="Validation Audit Report"
                              className="inline-flex p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </Link>

                            <a
                              href={`/api/results/${jobIdStr}/download?type=geotiff`}
                              title="Download Enhanced GeoTIFF"
                              className="inline-flex p-1.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-900 transition-all"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </>
                        )}

                        {job.status === 'processing' && (
                          <button
                            onClick={() => handleCancelJob(jobIdStr)}
                            className="text-xs text-rose-400 hover:underline px-2 py-1"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs font-mono text-slate-400">
            <div>
              Page {currentPage} of {totalPages} &bull; {filteredJobs.length} total jobs
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded bg-[#060913] border border-slate-800 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded bg-[#060913] border border-slate-800 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
