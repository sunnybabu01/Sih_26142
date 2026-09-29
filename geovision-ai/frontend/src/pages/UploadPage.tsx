import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  UploadCloud, 
  FileUp, 
  Satellite, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Layers, 
  Globe, 
  Sliders, 
  ArrowRight,
  Info
} from 'lucide-react';

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sourceResolution, setSourceResolution] = useState<number>(10.0);
  const [scaleFactor, setScaleFactor] = useState<number>(4);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadedImageMeta, setUploadedImageMeta] = useState<any | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setErrorMsg(null);
    const validExtensions = ['.tif', '.tiff', '.png', '.jpg', '.jpeg'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(ext)) {
      setErrorMsg(`Unsupported file type '${ext}'. Please upload GeoTIFF (.tif, .tiff), PNG, or JPEG.`);
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 100MB upload limit.');
      return;
    }

    setSelectedFile(file);

    // Generate local preview if image format
    if (['.png', '.jpg', '.jpeg'].includes(ext)) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      // GeoTIFF
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('sourceResolution', String(sourceResolution));

    try {
      const res = await api.post('/images/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success && res.data.image) {
        setUploadedImageMeta(res.data.image);
        // Navigate directly to processing page with preselected image
        navigate(`/processing?imageId=${res.data.image._id}&scaleFactor=${scaleFactor}`);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to upload and parse satellite raster.');
    } finally {
      setIsUploading(false);
    }
  };

  // Instant Demo Scene Seeder for instant evaluation
  const handleSeedDemoScene = async () => {
    setIsUploading(true);
    setErrorMsg(null);

    try {
      const res = await api.post('/demo/seed');
      if (res.data.success && res.data.image) {
        navigate(`/processing?imageId=${res.data.image._id}&scaleFactor=${scaleFactor}`);
      }
    } catch (err: any) {
      setErrorMsg('Failed to generate demo Sentinel-2 scene.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="space-y-1">
        <div className="text-xs font-mono uppercase tracking-wider text-[#00F0FF] flex items-center space-x-1.5">
          <Satellite className="w-3.5 h-3.5" />
          <span>Sentinel-2 Raster Ingestion Engine</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Upload Satellite Imagery</h1>
        <p className="text-xs text-slate-300">
          Upload Sentinel-2 GeoTIFF or standard multispectral tiles to initiate deep learning super-resolution mapping.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative p-10 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-4 ${
          dragActive
            ? 'border-[#00F0FF] bg-[#00F0FF]/10 shadow-[0_0_30px_rgba(0,240,255,0.2)]'
            : selectedFile
            ? 'border-emerald-500/60 bg-[#0F1A3A]/80'
            : 'border-slate-700/80 bg-[#0A1128]/60 hover:border-[#00F0FF]/50 hover:bg-[#0F1A3A]/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".tif,.tiff,.png,.jpg,.jpeg"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-16 h-16 rounded-full bg-[#14234C] text-[#00F0FF] flex items-center justify-center mx-auto shadow-lg">
          <UploadCloud className="w-8 h-8" />
        </div>

        {selectedFile ? (
          <div className="space-y-1">
            <div className="text-base font-bold text-emerald-400 flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>{selectedFile.name}</span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready for Metadata Extraction
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-base font-semibold text-white">
              Drag &amp; drop satellite raster here, or click to browse
            </div>
            <p className="text-xs text-slate-400">
              Supported Formats: GeoTIFF (.tif, .tiff), PNG, JPEG &bull; Max Size: 100 MB
            </p>
          </div>
        )}

        <div className="text-[11px] font-mono text-[#00F0FF]/70">
          Geospatial metadata (CRS, Affine transform, pixel resolution) will be automatically extracted.
        </div>
      </div>

      {/* Or Load Demo Scene Quick Action */}
      <div className="p-4 rounded-xl bg-[#0F1A3A]/60 border border-[#00F0FF]/25 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-[#14234C] text-[#00F0FF]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Don&apos;t have a Sentinel-2 GeoTIFF on hand?</div>
            <div className="text-xs text-slate-400">
              Load an authentic Sentinel-2 agricultural river basin scene (10m, EPSG:32643 UTM) instantly.
            </div>
          </div>
        </div>

        <button
          onClick={handleSeedDemoScene}
          disabled={isUploading}
          className="px-4 py-2 rounded-lg bg-[#14234C] hover:bg-[#00F0FF] text-[#00F0FF] hover:text-black border border-[#00F0FF]/40 font-semibold text-xs transition-all whitespace-nowrap"
        >
          {isUploading ? 'Preparing Scene...' : 'Load Sample Sentinel-2 Scene'}
        </button>
      </div>

      {/* Configuration Panel */}
      <div className="p-6 rounded-2xl bg-[#0F1A3A]/80 border border-[#00F0FF]/20 space-y-5">
        <div className="text-sm font-bold text-white flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-[#00F0FF]" />
          <span>Resolution &amp; Model Target Parameters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          {/* Source Spatial Resolution */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold flex items-center space-x-1">
              <span>Source Spatial Resolution:</span>
              <span className="text-[#00F0FF] font-mono">({sourceResolution}m)</span>
            </label>
            <input
              type="number"
              step="0.1"
              value={sourceResolution}
              onChange={(e) => setSourceResolution(parseFloat(e.target.value) || 10.0)}
              className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-700 text-white font-mono focus:border-[#00F0FF] focus:outline-none"
            />
            <p className="text-[11px] text-slate-500">
              Default is 10.0 meters for Sentinel-2 MSI visible and near-infrared bands (B2, B3, B4, B8).
            </p>
          </div>

          {/* Super Resolution Enhancement Factor */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold">
              Super-Resolution Scale Factor:
            </label>
            <select
              value={scaleFactor}
              onChange={(e) => setScaleFactor(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 rounded-lg bg-[#060913] border border-slate-700 text-white font-mono focus:border-[#00F0FF] focus:outline-none cursor-pointer"
            >
              <option value={4}>4x SRM &mdash; Target: {(sourceResolution / 4).toFixed(2)}m (Sub-4m Target)</option>
              <option value={2}>2x SRM &mdash; Target: {(sourceResolution / 2).toFixed(2)}m (Regional Mapping)</option>
            </select>
            <p className="text-[11px] text-slate-500">
              4x enhancement delivers nominal 2.5m pixel spacing from 10m Sentinel-2 inputs.
            </p>
          </div>

        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className={`flex items-center space-x-2 px-8 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all ${
              selectedFile && !isUploading
                ? 'bg-[#00F0FF] hover:bg-[#38bdf8] text-black shadow-[0_0_20px_rgba(0,240,255,0.3)]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>{isUploading ? 'Extracting Metadata...' : 'Proceed to SRM Processing'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
