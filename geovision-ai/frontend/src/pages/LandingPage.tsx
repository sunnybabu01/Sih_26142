import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Satellite, 
  Sparkles, 
  MapPin, 
  Layers, 
  ShieldCheck, 
  SlidersHorizontal, 
  ArrowRight, 
  CheckCircle, 
  Zap, 
  Database,
  Globe2,
  Cpu,
  BarChart3,
  ExternalLink
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user, setDemoUser } = useAuth();
  const navigate = useNavigate();

  const handleExploreDemo = () => {
    if (!user) {
      setDemoUser('researcher');
    }
    navigate('/compare');
  };

  const handleUploadClick = () => {
    if (!user) {
      setDemoUser('researcher');
    }
    navigate('/upload');
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-200">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 border-b border-[#00F0FF]/15">
        {/* Futuristic glowing grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#14234C]/40 via-[#060913] to-[#060913] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00f0ff08_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#0F1A3A] border border-[#00F0FF]/30 text-xs font-mono text-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.2)]">
            <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
            <span>AI-Driven Satellite Super Resolution Mapping (SRM)</span>
          </div>

          {/* Heading */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Transform Satellite Imagery into{' '}
              <span className="bg-gradient-to-r from-[#00F0FF] via-sky-300 to-blue-500 bg-clip-text text-transparent">
                Higher-Detail Geospatial Insights
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-light leading-relaxed">
              Enhance Sentinel-2 medium-resolution (10m) satellite data into sub-4m (2.5m nominal) geospatial rasters using deep residual attention networks while strictly preserving CRS coordinates, affine geotransforms, and spectral fidelity.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={handleUploadClick}
              className="flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-[#00F0FF] hover:bg-[#38bdf8] text-[#060913] font-bold text-sm tracking-wide shadow-[0_0_25px_rgba(0,240,255,0.35)] transition-all hover:scale-105"
            >
              <span>Upload Satellite Image</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleExploreDemo}
              className="flex items-center space-x-2 px-8 py-3.5 rounded-xl bg-[#0F1A3A] hover:bg-[#14234C] text-[#00F0FF] border border-[#00F0FF]/40 font-semibold text-sm transition-all hover:border-[#00F0FF]"
            >
              <Satellite className="w-4 h-4" />
              <span>Explore Interactive Demo</span>
            </button>
          </div>

          {/* Quick Metrics Banner */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-xl bg-[#0A1128]/80 border border-slate-800">
              <div className="text-2xl font-bold text-white font-mono">10m &rarr; 2.5m</div>
              <div className="text-xs text-slate-400 mt-1">4x SRM Resolution Target</div>
            </div>
            <div className="p-4 rounded-xl bg-[#0A1128]/80 border border-slate-800">
              <div className="text-2xl font-bold text-[#00F0FF] font-mono">100% EPSG</div>
              <div className="text-xs text-slate-400 mt-1">Geospatial CRS Preserved</div>
            </div>
            <div className="p-4 rounded-xl bg-[#0A1128]/80 border border-slate-800">
              <div className="text-2xl font-bold text-emerald-400 font-mono">SRM-Net</div>
              <div className="text-xs text-slate-400 mt-1">Residual Dense Attention</div>
            </div>
            <div className="p-4 rounded-xl bg-[#0A1128]/80 border border-slate-800">
              <div className="text-2xl font-bold text-amber-400 font-mono">Transparent</div>
              <div className="text-xs text-slate-400 mt-1">Scientific Uncertainty Audit</div>
            </div>
          </div>

        </div>
      </section>

      {/* What is Super-Resolution Mapping */}
      <section className="py-20 border-b border-[#00F0FF]/15 bg-[#080E1E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-[#00F0FF]">
                <Cpu className="w-4 h-4" />
                <span>Geospatial AI Fundamentals</span>
              </div>
              <h2 className="text-3xl font-bold text-white leading-snug">
                Deep Learning Based Super-Resolution Mapping (SRM)
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Conventional spatial interpolation (e.g. bilinear, bicubic) increases pixel density without recovering high-frequency spatial gradients or boundary details. 
              </p>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                <strong>GeoVision AI’s SRM-Net</strong> leverages a Deep Residual Dense Network with Squeeze-and-Excitation Channel Attention. By learning localized terrain representations and optical sensor point spread functions (PSF), it infers fine parcel edges, roads, and land-cover transitions while maintaining exact geographic registration and spectral consistency.
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex items-start space-x-3 text-sm text-slate-300">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Sub-Pixel Convolution:</strong> Employs efficient PixelShuffle upsamplers for 2x and 4x magnification without checkerboard artifacts.</span>
                </div>
                <div className="flex items-start space-x-3 text-sm text-slate-300">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Overlap Tile Blending:</strong> Processes gigabyte satellite scenes using cosine window blending to eliminate tile edge seams.</span>
                </div>
                <div className="flex items-start space-x-3 text-sm text-slate-300">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Geospatial Rigor:</strong> Automatically recomputes the Affine transform matrix <code className="bg-[#0A1128] text-[#00F0FF] px-1 py-0.5 rounded">[dx/s, 0, x0, 0, dy/s, y0]</code> for immediate QGIS and ArcGIS loading.</span>
                </div>
              </div>
            </div>

            {/* Visual Architecture Box */}
            <div className="relative p-6 rounded-2xl bg-[#0F1A3A]/80 border border-[#00F0FF]/30 shadow-2xl">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                <span>SRM Processing Pipeline Architecture</span>
                <span className="text-emerald-400">Validated</span>
              </div>
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-[#060913] border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300">1. Sentinel-2 L2A Input (10m)</span>
                  <span className="text-amber-400">EPSG:32643 / Affine</span>
                </div>
                <div className="text-center text-[#00F0FF]">&darr; Tile Extraction with Overlap</div>
                <div className="p-3 rounded-lg bg-[#060913] border border-[#00F0FF]/40 flex items-center justify-between shadow-[0_0_15px_rgba(0,240,255,0.15)]">
                  <span className="text-white font-semibold">2. SRM-Net (Residual Dense + CA)</span>
                  <span className="text-[#00F0FF]">PyTorch &bull; 4x Upsample</span>
                </div>
                <div className="text-center text-[#00F0FF]">&darr; Hann Window Blending &amp; Scaling</div>
                <div className="p-3 rounded-lg bg-[#060913] border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300">3. Enhanced GeoTIFF Output (2.5m)</span>
                  <span className="text-emerald-400">Scaled Affine Grid</span>
                </div>
                <div className="text-center text-[#00F0FF]">&darr; Transparent Accuracy Audit</div>
                <div className="p-3 rounded-lg bg-[#060913] border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300">4. Scientific Validation Report</span>
                  <span className="text-slate-400">PSNR &bull; SSIM &bull; Advisory</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <div className="text-xs font-mono uppercase tracking-widest text-[#00F0FF]">Engine Capabilities</div>
          <h2 className="text-3xl font-bold text-white">Built for Remote Sensing Scientists and GIS Engineers</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-2xl bg-[#0F1A3A]/70 border border-[#00F0FF]/20 hover:border-[#00F0FF]/50 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#14234C] text-[#00F0FF] flex items-center justify-center">
              <Globe2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Full Geospatial Preservation</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Maintains Coordinate Reference Systems (CRS) and recalculates ground pixel spacing without projection drift or geographic distortion.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0F1A3A]/70 border border-[#00F0FF]/20 hover:border-[#00F0FF]/50 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#14234C] text-emerald-400 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Interactive Swipe Comparison</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Real-time before-and-after split slider, side-by-side synchronized view, and Leaflet satellite map overlays with coordinate boundary tracking.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0F1A3A]/70 border border-[#00F0FF]/20 hover:border-[#00F0FF]/50 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#14234C] text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Honest Scientific Reporting</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              No fabricated benchmark scores. If reference imagery is absent, clearly reports &quot;Reference-based validation unavailable&quot; with detailed uncertainty notes.
            </p>
          </div>

        </div>
      </section>

      {/* Research Applications */}
      <section className="py-20 border-t border-[#00F0FF]/15 bg-[#0A1128]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <div className="text-xs font-mono uppercase tracking-widest text-[#00F0FF]">Impact &amp; Use Cases</div>
            <h2 className="text-3xl font-bold text-white">Critical Earth Observation Applications</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl bg-[#0F1A3A] border border-slate-800 space-y-2">
              <div className="text-emerald-400 font-bold text-sm">Precision Agriculture</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Delineate fine crop parcel boundaries, irrigation canals, and smallholder field anomalies undetectable in raw 10m bands.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-[#0F1A3A] border border-slate-800 space-y-2">
              <div className="text-sky-400 font-bold text-sm">Urban Infrastructure</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Map informal settlements, road expansions, and rooftop footprints with enhanced edge fidelity for smart city planning.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-[#0F1A3A] border border-slate-800 space-y-2">
              <div className="text-amber-400 font-bold text-sm">Disaster Response</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Detect localized flood inundation shorelines, landslide scars, and wildfire burn perimeter boundaries with higher spatial acuity.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-[#0F1A3A] border border-slate-800 space-y-2">
              <div className="text-indigo-400 font-bold text-sm">Hydrological Monitoring</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Track river bank erosion, wetland shrinkage, and small water bodies that otherwise suffer from mixed-pixel confusion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800 bg-[#060913] text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Satellite className="w-4 h-4 text-[#00F0FF]" />
            <span className="font-semibold text-white">GeoVision AI</span>
            <span>&mdash; Satellite Super Resolution Mapping Platform</span>
          </div>
          <div>
            Built with React, PyTorch, Node.js, and Leaflet.
          </div>
        </div>
      </footer>

    </div>
  );
};
