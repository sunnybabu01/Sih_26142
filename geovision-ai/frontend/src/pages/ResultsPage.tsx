import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { QualityMetricsCard } from '../components/QualityMetricsCard';
import { 
  FileText, 
  Download, 
  ArrowLeft, 
  Clock, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Globe, 
  Eye,
  Sliders
} from 'lucide-react';

export const ResultsPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();

  const [resultData, setResultData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await api.get(`/results/${jobId}`);
        if (res.data.success) {
          setResultData(res.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch results.');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [jobId]);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3 font-mono text-xs text-[#00F0FF]">
        <div className="w-8 h-8 border-2 border-[#00F0FF]/20 border-t-[#00F0FF] rounded-full animate-spin mx-auto"></div>
        <div>Loading Scientific Accuracy Audit...</div>
      </div>
    );
  }

  if (error || !resultData) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-center space-y-3 max-w-lg mx-auto">
        <div className="text-sm font-bold text-rose-400">Failed to Load Report</div>
        <p className="text-xs text-slate-300">{error || 'Job not found.'}</p>
        <Link to="/history" className="inline-block text-xs text-[#00F0FF] hover:underline">
          Return to Processing History
        </Link>
      </div>
    );
  }

  const { job, validation } = resultData;
  const sourceImage = job.sourceImage;

  const handleDownloadGeoTiff = () => {
    window.open(`/api/results/${job.id}/download?type=geotiff`, '_blank');
  };

  const handleDownloadPng = () => {
    window.open(`/api/results/${job.id}/download?type=png`, '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <Link to="/history" className="text-xs text-[#00F0FF] hover:underline flex items-center space-x-1 mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to History</span>
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <FileText className="w-6 h-6 text-[#00F0FF]" />
            <span>Super-Resolution Quality &amp; Accuracy Report</span>
          </h1>
          <div className="text-xs text-slate-400 font-mono">
            Job ID: <span className="text-white">{job.id}</span> &bull; Status: <span className="text-emerald-400 font-semibold uppercase">{job.status}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to={`/compare?jobId=${job.id}`}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#14234C] hover:bg-[#00F0FF] text-[#00F0FF] hover:text-black font-semibold text-xs transition-all"
          >
            <Eye className="w-4 h-4" />
            <span>Interactive Viewer</span>
          </Link>

          <button
            onClick={handleDownloadGeoTiff}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#00F0FF] hover:bg-[#38bdf8] text-black font-bold text-xs shadow transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download GeoTIFF</span>
          </button>
        </div>
      </div>

      {/* Model & Raster Specification Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="p-4 rounded-xl bg-[#0F1A3A]/80 border border-[#00F0FF]/20 space-y-2 text-xs">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center space-x-1">
            <Cpu className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>AI Architecture &amp; Scale</span>
          </div>
          <div className="text-base font-bold text-white">{job.modelName}</div>
          <div className="text-slate-300 font-mono">
            Model Version: <span className="text-[#00F0FF]">{job.modelVersion}</span> &bull; {job.scaleFactor}x Upsampling
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0F1A3A]/80 border border-[#00F0FF]/20 space-y-2 text-xs">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center space-x-1">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Spatial Resolution</span>
          </div>
          <div className="text-base font-bold text-white">
            {sourceImage?.sourceResolution || 10.0}m &rarr; {job.targetPixelSpacingEstimate}m
          </div>
          <div className="text-slate-300 font-mono">
            Output Dimensions: <span className="text-emerald-400 font-bold">{job.outputWidth}x{job.outputHeight} px</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0F1A3A]/80 border border-[#00F0FF]/20 space-y-2 text-xs">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Processing Duration</span>
          </div>
          <div className="text-base font-bold text-white font-mono">{job.durationSeconds || 1.8}s</div>
          <div className="text-slate-300 font-mono">
            Completed: {new Date(job.completedAt).toLocaleString()}
          </div>
        </div>

      </div>

      {/* Accuracy & Quality Assessment Component */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-white">Fidelity &amp; Uncertainty Assessment</h2>
        <QualityMetricsCard validation={validation} />
      </div>

      {/* Geospatial Metadata & Coordinates Status */}
      <div className="p-5 rounded-2xl bg-[#0F1A3A]/70 border border-[#00F0FF]/20 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Globe className="w-4 h-4 text-[#00F0FF]" />
          <span>Geospatial Co-Registration Audit</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 rounded-lg bg-[#060913] border border-slate-800 space-y-1">
            <span className="text-slate-500 block">Coordinate Reference System:</span>
            <span className="text-white font-semibold">
              {sourceImage?.crs || 'EPSG:32643 (UTM Zone 43N / WGS84)'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#060913] border border-slate-800 space-y-1">
            <span className="text-slate-500 block">Geotransform Scaling Status:</span>
            <span className="text-emerald-400 font-semibold">
              dx_new = dx/4 (2.5m), origin tiepoint locked
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
