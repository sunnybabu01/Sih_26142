import React, { useState, useRef, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Layers, 
  Download, 
  SlidersHorizontal,
  Columns,
  Eye,
  Info
} from 'lucide-react';

interface ImageComparisonSliderProps {
  originalUrl: string;
  enhancedUrl: string;
  originalLabel?: string;
  enhancedLabel?: string;
  originalDimensions?: { width: number; height: number };
  enhancedDimensions?: { width: number; height: number };
  originalResolution?: number; // e.g. 10.0m
  enhancedResolution?: number; // e.g. 2.5m
  onDownloadOriginal?: () => void;
  onDownloadEnhanced?: () => void;
}

export const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({
  originalUrl,
  enhancedUrl,
  originalLabel = 'Sentinel-2 (10m Resolution)',
  enhancedLabel = 'GeoVision SRM-Net Enhanced (2.5m Estimate)',
  originalDimensions = { width: 512, height: 512 },
  enhancedDimensions = { width: 2048, height: 2048 },
  originalResolution = 10.0,
  enhancedResolution = 2.5,
  onDownloadOriginal,
  onDownloadEnhanced,
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'normal' | 'contrast' | 'sharpen'>('normal');

  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPos(percent);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement> | TouchEvent) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPos(percent);
  };

  useEffect(() => {
    const onUp = () => setIsDragging(false);
    const onMove = (e: MouseEvent) => {
      if (isDragging) handleMouseMove(e);
    };
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
    };
  }, [isDragging]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const filterStyle = {
    normal: '',
    contrast: 'contrast(135%) saturate(120%)',
    sharpen: 'contrast(120%) brightness(105%)',
  }[activeFilter];

  return (
    <div className="flex flex-col space-y-3 w-full">
      
      {/* Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#0F1A3A]/90 border border-[#00F0FF]/20 text-xs">
        
        {/* View Mode & Filter Controls */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-[#060913] p-1 rounded-lg border border-slate-700/60">
            <button
              onClick={() => setViewMode('slider')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-all ${
                viewMode === 'slider' ? 'bg-[#00F0FF] text-black font-semibold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Split Slider</span>
            </button>
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md transition-all ${
                viewMode === 'side-by-side' ? 'bg-[#00F0FF] text-black font-semibold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>
          </div>

          <div className="flex items-center space-x-1 bg-[#060913] px-2 py-1 rounded-lg border border-slate-700/60">
            <Layers className="w-3.5 h-3.5 text-[#00F0FF]" />
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as any)}
              className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
            >
              <option value="normal" className="bg-[#0A1128]">True Color (Standard)</option>
              <option value="contrast" className="bg-[#0A1128]">High Dynamic Contrast</option>
              <option value="sharpen" className="bg-[#0A1128]">Edge Emphasis</option>
            </select>
          </div>
        </div>

        {/* Zoom Controls & Fullscreen */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-[#060913] p-1 rounded-lg border border-slate-700/60 space-x-1">
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 3))}
              title="Zoom In"
              className="p-1 rounded text-slate-400 hover:text-[#00F0FF] hover:bg-[#0F1A3A]"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="font-mono text-[11px] text-slate-300 px-1">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.5))}
              title="Zoom Out"
              className="p-1 rounded text-slate-400 hover:text-[#00F0FF] hover:bg-[#0F1A3A]"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              title="Reset Zoom"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#0F1A3A]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
            className="p-1.5 rounded-lg bg-[#060913] border border-slate-700/60 text-slate-300 hover:text-[#00F0FF] transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Download Buttons */}
        <div className="flex items-center space-x-2">
          {onDownloadOriginal && (
            <button
              onClick={onDownloadOriginal}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Original</span>
            </button>
          )}
          {onDownloadEnhanced && (
            <button
              onClick={onDownloadEnhanced}
              className="flex items-center space-x-1 px-3 py-1 rounded bg-[#00F0FF] hover:bg-[#38bdf8] text-black text-xs font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Enhanced GeoTIFF</span>
            </button>
          )}
        </div>

      </div>

      {/* Main Comparison Canvas */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        className="relative w-full h-[520px] bg-[#060913] rounded-xl overflow-hidden border border-[#00F0FF]/30 select-none shadow-2xl"
      >
        {viewMode === 'slider' ? (
          /* Split Slider View */
          <div className="relative w-full h-full overflow-hidden">
            
            {/* Enhanced Image (Underneath) */}
            <div 
              className="absolute inset-0 flex items-center justify-center transition-transform duration-75"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <img
                src={enhancedUrl}
                alt="Enhanced Satellite"
                className="w-full h-full object-contain pointer-events-none"
                style={{ filter: filterStyle }}
              />
            </div>

            {/* Original Image (Clipped overlay on top) */}
            <div
              className="absolute inset-y-0 left-0 overflow-hidden pointer-events-none border-r-2 border-[#00F0FF] shadow-[2px_0_15px_rgba(0,240,255,0.5)]"
              style={{ width: `${sliderPos}%` }}
            >
              <div 
                className="absolute inset-0 flex items-center justify-center transition-transform duration-75"
                style={{ 
                  width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
                  transform: `scale(${zoomLevel})` 
                }}
              >
                <img
                  src={originalUrl}
                  alt="Original Satellite"
                  className="w-full h-full object-contain pointer-events-none"
                  style={{ filter: filterStyle }}
                />
              </div>
            </div>

            {/* Draggable Divider Handle */}
            <div
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
              style={{ left: `${sliderPos}%` }}
              className="absolute top-0 bottom-0 -ml-4 w-8 flex items-center justify-center cursor-ew-resize z-20"
            >
              <div className="w-8 h-8 rounded-full bg-[#060913] border-2 border-[#00F0FF] shadow-[0_0_15px_#00F0FF] flex items-center justify-center text-[#00F0FF]">
                <SlidersHorizontal className="w-4 h-4 rotate-90" />
              </div>
            </div>

            {/* Floating Top Labels */}
            <div className="absolute top-3 left-3 z-30 px-3 py-1.5 rounded-lg bg-[#060913]/80 backdrop-blur border border-slate-700 text-xs font-mono text-slate-300 pointer-events-none">
              <span className="text-amber-400 font-bold mr-1">BEFORE:</span> {originalLabel}
            </div>
            <div className="absolute top-3 right-3 z-30 px-3 py-1.5 rounded-lg bg-[#060913]/80 backdrop-blur border border-[#00F0FF]/40 text-xs font-mono text-[#00F0FF] pointer-events-none">
              <span className="text-[#00F0FF] font-bold mr-1">AFTER:</span> {enhancedLabel}
            </div>

          </div>
        ) : (
          /* Side-by-Side View */
          <div className="grid grid-cols-1 md:grid-cols-2 h-full w-full divide-y md:divide-y-0 md:divide-x divide-[#00F0FF]/20">
            <div className="relative h-full flex flex-col items-center justify-center bg-[#080E1E] p-2 overflow-hidden">
              <div className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded bg-[#060913]/90 text-[11px] font-mono text-amber-400 border border-amber-500/30">
                {originalLabel}
              </div>
              <div style={{ transform: `scale(${zoomLevel})` }} className="w-full h-full flex items-center justify-center">
                <img src={originalUrl} alt="Original" className="max-w-full max-h-full object-contain" style={{ filter: filterStyle }} />
              </div>
            </div>
            <div className="relative h-full flex flex-col items-center justify-center bg-[#080E1E] p-2 overflow-hidden">
              <div className="absolute top-2 left-2 z-10 px-2.5 py-1 rounded bg-[#060913]/90 text-[11px] font-mono text-[#00F0FF] border border-[#00F0FF]/40">
                {enhancedLabel}
              </div>
              <div style={{ transform: `scale(${zoomLevel})` }} className="w-full h-full flex items-center justify-center">
                <img src={enhancedUrl} alt="Enhanced" className="max-w-full max-h-full object-contain" style={{ filter: filterStyle }} />
              </div>
            </div>
          </div>
        )}

        {/* HUD Dimension Bar at bottom */}
        <div className="absolute bottom-2 left-3 right-3 z-30 flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#060913]/85 backdrop-blur border border-slate-700/60 text-[11px] font-mono text-slate-400">
          <div>
            Original: <span className="text-white font-semibold">{originalDimensions.width}x{originalDimensions.height} px</span> ({originalResolution}m)
          </div>
          <div className="text-[#00F0FF]">
            Enhanced: <span className="text-white font-semibold">{enhancedDimensions.width}x{enhancedDimensions.height} px</span> ({enhancedResolution}m nominal)
          </div>
        </div>

      </div>

      {/* Scientific Uncertainty Notice */}
      <div className="flex items-start space-x-2 p-3 rounded-lg bg-[#0F1A3A]/60 border border-amber-500/30 text-amber-200/90 text-xs">
        <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
        <p>
          <span className="font-semibold text-amber-300">Scientific Validation Advisory:</span> Enhanced fine details (such as sharp boundaries, linear infrastructures, and parcel textures) are mathematically inferred by the SRM-Net deep learning model and do not represent direct sensor ground observations.
        </p>
      </div>

    </div>
  );
};
