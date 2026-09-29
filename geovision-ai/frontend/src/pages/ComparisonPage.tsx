import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { ImageComparisonSlider } from '../components/ImageComparisonSlider';
import { GeospatialMapViewer } from '../components/GeospatialMapViewer';
import { 
  SplitSquareVertical, 
  Map, 
  Download, 
  Layers, 
  Activity, 
  Clock, 
  FileText,
  Sliders,
  Sparkles
} from 'lucide-react';

export const ComparisonPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const requestedJobId = searchParams.get('jobId');

  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(requestedJobId || '');
  const [jobData, setJobData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'slider' | 'map'>('slider');

  // Load completed jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await api.get('/processing/jobs');
        if (res.data.success && res.data.jobs) {
          const completed = res.data.jobs.filter((j: any) => j.status === 'completed');
          setJobs(completed);
          if (!selectedJobId && completed.length > 0) {
            setSelectedJobId(completed[0]._id || completed[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load jobs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [selectedJobId]);

  // Load selected job details
  useEffect(() => {
    if (!selectedJobId) return;

    const fetchResult = async () => {
      try {
        const res = await api.get(`/results/${selectedJobId}`);
        if (res.data.success) {
          setJobData(res.data);
        }
      } catch (err) {
        console.error('Failed to load result:', err);
      }
    };
    fetchResult();
  }, [selectedJobId]);

  const handleDownloadEnhanced = () => {
    if (!selectedJobId) return;
    window.open(`/api/results/${selectedJobId}/download?type=geotiff`, '_blank');
  };

  const handleDownloadOriginal = () => {
    if (!jobData?.job?.sourceImage?.storedFilename) return;
    window.open(`/api/images/preview/${jobData.job.sourceImage.storedFilename}`, '_blank');
  };

  // Fallback demo imagery URLs if no job completed yet
  const originalPreview = jobData?.job?.sourceImage?.storedFilename
    ? `/api/images/preview/${jobData.job.sourceImage.storedFilename}`
    : 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=800&auto=format&fit=crop&q=60';

  const enhancedPreview = jobData?.job?.previewPath
    ? `/api/results/preview/${jobData.job.previewPath.split(/[\\/]/).pop()}`
    : originalPreview;

  const sourceMeta = jobData?.job?.sourceImage;

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-mono uppercase tracking-wider text-[#00F0FF] flex items-center space-x-1.5">
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Interactive Spatial Resolution Comparator</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Visual &amp; Geographic Comparison</h1>
          <p className="text-xs text-slate-300">
            Compare 10m Sentinel-2 medium-resolution inputs against super-resolved GeoTIFF products.
          </p>
        </div>

        {/* Job Selector Dropdown */}
        {jobs.length > 0 && (
          <div className="flex items-center space-x-2 bg-[#0F1A3A] p-2 rounded-xl border border-[#00F0FF]/25">
            <span className="text-xs font-mono text-slate-400">Select Job:</span>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="bg-[#060913] text-white text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-[#00F0FF]"
            >
              {jobs.map((j) => (
                <option key={j._id || j.id} value={j._id || j.id}>
                  {j.imageId?.originalFilename || 'Scene'} ({j.scaleFactor}x SRM &bull; {j.targetPixelSpacingEstimate}m)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabs: Slider vs Leaflet Map */}
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('slider')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'slider'
              ? 'bg-[#14234C] text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <SplitSquareVertical className="w-4 h-4" />
          <span>Interactive Split Slider</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'map'
              ? 'bg-[#14234C] text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Map className="w-4 h-4" />
          <span>Leaflet Geospatial Map</span>
        </button>

        {selectedJobId && (
          <Link
            to={`/results/${selectedJobId}`}
            className="ml-auto flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
          >
            <FileText className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>Quality Audit Report</span>
          </Link>
        )}
      </div>

      {/* Main View Area */}
      {activeTab === 'slider' ? (
        <ImageComparisonSlider
          originalUrl={originalPreview}
          enhancedUrl={enhancedPreview}
          originalLabel="Sentinel-2 Input (10.0m)"
          enhancedLabel={`SRM-Net Enhanced (${jobData?.job?.scaleFactor || 4}x &bull; ${jobData?.job?.targetPixelSpacingEstimate || 2.5}m)`}
          originalDimensions={{
            width: sourceMeta?.width || 512,
            height: sourceMeta?.height || 512,
          }}
          enhancedDimensions={{
            width: jobData?.job?.outputWidth || 2048,
            height: jobData?.job?.outputHeight || 2048,
          }}
          originalResolution={sourceMeta?.sourceResolution || 10.0}
          enhancedResolution={jobData?.job?.targetPixelSpacingEstimate || 2.5}
          onDownloadOriginal={handleDownloadOriginal}
          onDownloadEnhanced={handleDownloadEnhanced}
        />
      ) : (
        <GeospatialMapViewer
          bounds={sourceMeta?.bounds}
          crs={sourceMeta?.crs || 'EPSG:32643 (UTM Zone 43N / WGS84)'}
          sourceResolution={sourceMeta?.sourceResolution || 10.0}
          targetResolution={jobData?.job?.targetPixelSpacingEstimate || 2.5}
          filename={sourceMeta?.originalFilename || 'Sentinel-2 Scene'}
        />
      )}

      {/* Geospatial Metadata Summary Footer */}
      <div className="p-4 rounded-xl bg-[#0F1A3A]/70 border border-[#00F0FF]/20 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
        <div>
          <span className="text-slate-500 block">CRS PROJECTION</span>
          <span className="text-white font-semibold truncate block">
            {sourceMeta?.crs || 'EPSG:32643 (UTM Zone 43N)'}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">GEOTRANSFORM AFFINE</span>
          <span className="text-[#00F0FF] font-semibold">Scaled dx/dy = 2.5m</span>
        </div>
        <div>
          <span className="text-slate-500 block">PROCESSING TIME</span>
          <span className="text-emerald-400 font-semibold">{jobData?.job?.durationSeconds || 1.8}s</span>
        </div>
        <div>
          <span className="text-slate-500 block">EXPORT FORMAT</span>
          <span className="text-amber-400 font-semibold">GeoTIFF 32-bit Float</span>
        </div>
      </div>

    </div>
  );
};
