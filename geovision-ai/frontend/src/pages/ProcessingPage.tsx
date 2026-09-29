import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Sparkles, 
  Cpu, 
  Sliders, 
  Play, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Layers, 
  Globe, 
  FileCode, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export const ProcessingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryImageId = searchParams.get('imageId');
  const queryScale = parseInt(searchParams.get('scaleFactor') || '4', 10);

  const [images, setImages] = useState<any[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string>(queryImageId || '');
  const [scaleFactor, setScaleFactor] = useState<number>(queryScale || 4);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string>('idle');
  const [jobProgress, setJobProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingImages, setLoadingImages] = useState(true);

  // Fetch user images for selection
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await api.get('/images');
        if (res.data.success && res.data.images) {
          setImages(res.data.images);
          if (!selectedImageId && res.data.images.length > 0) {
            setSelectedImageId(res.data.images[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch images:', err);
      } finally {
        setLoadingImages(false);
      }
    };
    fetchImages();
  }, [selectedImageId]);

  // Status Polling when job is active
  useEffect(() => {
    if (!activeJobId || ['completed', 'failed', 'cancelled'].includes(jobStatus)) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/processing/jobs/${activeJobId}/status`);
        if (res.data.success) {
          setJobStatus(res.data.status);
          setJobProgress(res.data.progress);
          if (res.data.status === 'completed') {
            clearInterval(interval);
          } else if (res.data.status === 'failed') {
            setErrorMessage(res.data.errorMessage || 'Processing job failed.');
            clearInterval(interval);
          }
        }
      } catch (err: any) {
        console.error('Status check error:', err);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [activeJobId, jobStatus]);

  const selectedImage = images.find((i) => i._id === selectedImageId);
  const sourceResolution = selectedImage?.sourceResolution || 10.0;
  const targetResolution = (sourceResolution / scaleFactor).toFixed(2);

  const handleStartProcessing = async () => {
    if (!selectedImageId) return;

    setErrorMessage(null);
    setJobStatus('processing');
    setJobProgress(10);

    try {
      const res = await api.post('/processing/start', {
        imageId: selectedImageId,
        scaleFactor: scaleFactor,
      });

      if (res.data.success && res.data.jobId) {
        setActiveJobId(res.data.jobId);
      }
    } catch (err: any) {
      setJobStatus('failed');
      setErrorMessage(err.response?.data?.message || 'Failed to initiate processing job.');
    }
  };

  const workflowSteps = [
    { num: 1, name: 'Validate Raster Integrity', desc: 'Check dimensions, file headers, and CRS' },
    { num: 2, name: 'Extract Geospatial Metadata', desc: 'Read Affine transform matrix and projection' },
    { num: 3, name: 'Reflectance Normalization', desc: 'Scale Sentinel-2 BOA reflectance to [0, 1]' },
    { num: 4, name: 'Spectral Channel Preparation', desc: 'Align multispectral bands (B4, B3, B2)' },
    { num: 5, name: 'PyTorch SRM-Net Inference', desc: 'Run Deep Residual Dense Attention model' },
    { num: 6, name: 'Hann Window Tile Blending', desc: 'Reconstruct seamless enhanced raster' },
    { num: 7, name: 'Geospatial Affine Scaling', desc: 'Update pixel scale dx/scale, dy/scale' },
    { num: 8, name: 'Dimension & Quality Check', desc: 'Verify output bounding box and integrity' },
    { num: 9, name: 'Export GeoTIFF & Audit Report', desc: 'Save enhanced 32-bit GeoTIFF and preview' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Title */}
      <div className="space-y-1">
        <div className="text-xs font-mono uppercase tracking-wider text-[#00F0FF] flex items-center space-x-1.5">
          <Cpu className="w-3.5 h-3.5" />
          <span>Deep Learning Super-Resolution Engine</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Super Resolution Processing Configuration</h1>
        <p className="text-xs text-slate-300">
          Configure model parameters, review input geospatial metadata, and trigger PyTorch SRM-Net inference.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Image & Model Config */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Select Imagery Card */}
          <div className="p-5 rounded-2xl bg-[#0F1A3A]/80 border border-[#00F0FF]/20 space-y-4">
            <div className="text-sm font-bold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#00F0FF]" />
              <span>Select Input Satellite Raster</span>
            </div>

            {loadingImages ? (
              <div className="text-xs text-slate-400 font-mono">Loading available imagery...</div>
            ) : images.length === 0 ? (
              <div className="p-4 rounded-lg bg-[#060913] border border-slate-800 text-center space-y-2">
                <div className="text-xs text-slate-400">No satellite imagery found.</div>
                <button
                  onClick={() => navigate('/upload')}
                  className="px-3 py-1.5 rounded-lg bg-[#00F0FF] text-black font-semibold text-xs"
                >
                  Upload First Scene
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <select
                  value={selectedImageId}
                  onChange={(e) => setSelectedImageId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-700 text-white text-xs font-mono focus:border-[#00F0FF] focus:outline-none"
                >
                  {images.map((img) => (
                    <option key={img._id} value={img._id}>
                      {img.originalFilename} &mdash; {img.width}x{img.height} px ({img.crs || 'Non-georef'})
                    </option>
                  ))}
                </select>

                {selectedImage && (
                  <div className="p-3.5 rounded-xl bg-[#060913] border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-500 block">Dimensions:</span>
                      <span className="text-white font-semibold">{selectedImage.width}x{selectedImage.height} px</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Bands:</span>
                      <span className="text-white font-semibold">{selectedImage.bands} Spectral Bands</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Source Spacing:</span>
                      <span className="text-[#00F0FF] font-semibold">{selectedImage.sourceResolution}m</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Projection:</span>
                      <span className="text-emerald-400 font-semibold truncate block" title={selectedImage.crs}>
                        {selectedImage.crs?.includes('32643') ? 'UTM Zone 43N' : selectedImage.crs || 'Cartesian'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Model Selection & Scale Factor */}
          <div className="p-5 rounded-2xl bg-[#0F1A3A]/80 border border-[#00F0FF]/20 space-y-4">
            <div className="text-sm font-bold text-white flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-[#00F0FF]" />
              <span>Model &amp; Enhancement Parameters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div
                onClick={() => setScaleFactor(4)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  scaleFactor === 4
                    ? 'bg-[#14234C] border-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.2)]'
                    : 'bg-[#060913] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">SRM-Net 4x Model</span>
                  <span className="px-2 py-0.5 rounded bg-[#00F0FF]/20 text-[#00F0FF] font-mono text-[10px] font-bold">
                    RECOMMENDED
                  </span>
                </div>
                <div className="text-xl font-bold text-[#00F0FF] font-mono mt-2">
                  10m &rarr; {targetResolution}m
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Sub-4m super-resolution targeting fine parcel and infrastructure delineation.
                </p>
              </div>

              <div
                onClick={() => setScaleFactor(2)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  scaleFactor === 2
                    ? 'bg-[#14234C] border-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.2)]'
                    : 'bg-[#060913] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">SRM-Net 2x Model</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                    REGIONAL
                  </span>
                </div>
                <div className="text-xl font-bold text-sky-400 font-mono mt-2">
                  10m &rarr; {(sourceResolution / 2).toFixed(2)}m
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Conservative 2x enhancement prioritizing spectral band fidelity.
                </p>
              </div>

            </div>

            {/* Inference Hardware HUD */}
            <div className="p-3 rounded-xl bg-[#060913] border border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Inference Hardware Acceleration:</span>
              <span className="text-emerald-400 font-semibold">Active &bull; High-Speed Batched Inference (Multi-threaded)</span>
            </div>

            {/* Start Button */}
            <div className="pt-2">
              <button
                onClick={handleStartProcessing}
                disabled={!selectedImageId || jobStatus === 'processing'}
                className={`w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                  selectedImageId && jobStatus !== 'processing'
                    ? 'bg-[#00F0FF] hover:bg-[#38bdf8] text-black shadow-[0_0_25px_rgba(0,240,255,0.35)]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {jobStatus === 'processing' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    <span>Processing Inference ({jobProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Deep Learning SRM Processing</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Job Completion Action Banner */}
          {jobStatus === 'completed' && activeJobId && (
            <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-emerald-300">Super-Resolution Inference Complete!</div>
                  <div className="text-xs text-slate-300 font-mono">
                    Output GeoTIFF generated with scaled Affine coordinates.
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  onClick={() => navigate(`/compare?jobId=${activeJobId}`)}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg bg-[#00F0FF] text-black font-bold text-xs shadow"
                >
                  <span>Compare Before/After</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => navigate(`/results/${activeJobId}`)}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-slate-800 text-slate-200 font-semibold text-xs hover:bg-slate-700"
                >
                  Quality Report
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: 9-Step Processing Pipeline Tracker */}
        <div className="p-5 rounded-2xl bg-[#0F1A3A]/70 border border-[#00F0FF]/20 space-y-4">
          <div className="text-sm font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#00F0FF]" />
            <span>9-Step SRM Pipeline</span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Execution Progress</span>
              <span className="text-[#00F0FF] font-bold">{jobProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#060913] overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-[#3B82F6] to-[#00F0FF] transition-all duration-500"
                style={{ width: `${jobProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Workflow Steps List */}
          <div className="space-y-2.5 pt-2">
            {workflowSteps.map((step) => {
              const stepProgressThreshold = step.num * 11;
              const isDone = jobProgress >= stepProgressThreshold || jobStatus === 'completed';
              const isCurrent = jobStatus === 'processing' && jobProgress < stepProgressThreshold && jobProgress >= (step.num - 1) * 11;

              return (
                <div
                  key={step.num}
                  className={`p-2.5 rounded-lg border text-xs transition-all ${
                    isDone
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                      : isCurrent
                      ? 'bg-[#14234C] border-[#00F0FF] text-white shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                      : 'bg-[#060913]/60 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center space-x-2 font-mono">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isDone ? 'bg-emerald-500 text-black' : isCurrent ? 'bg-[#00F0FF] text-black animate-pulse' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {step.num}
                    </span>
                    <span className="font-semibold">{step.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 pl-6 mt-0.5">{step.desc}</div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
};
