import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Globe, Compass, Layers } from 'lucide-react';

// Fix leaflet default icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface GeospatialMapViewerProps {
  bounds?: {
    wgs84?: {
      min_lat: number;
      min_lon: number;
      max_lat: number;
      max_lon: number;
    };
  };
  crs?: string;
  sourceResolution?: number;
  targetResolution?: number;
  filename?: string;
}

// Helper to auto-fit map view to bounds
const FitBoundsHelper: React.FC<{ bounds: L.LatLngBoundsExpression }> = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [bounds, map]);
  return null;
};

export const GeospatialMapViewer: React.FC<GeospatialMapViewerProps> = ({
  bounds,
  crs = 'EPSG:32643 (UTM Zone 43N / WGS84)',
  sourceResolution = 10.0,
  targetResolution = 2.5,
  filename = 'Sentinel-2 Scene',
}) => {
  const [mapType, setMapType] = useState<'satellite' | 'streets'>('satellite');

  // Default to Sentinel-2 agricultural test area in India / Rajasthan if bounds not present
  const lat1 = bounds?.wgs84?.min_lat ?? 27.955;
  const lon1 = bounds?.wgs84?.min_lon ?? 74.985;
  const lat2 = bounds?.wgs84?.max_lat ?? 28.005;
  const lon2 = bounds?.wgs84?.max_lon ?? 75.035;

  const polygonCoords: [number, number][] = [
    [lat1, lon1],
    [lat2, lon1],
    [lat2, lon2],
    [lat1, lon2],
  ];

  const center: [number, number] = [(lat1 + lat2) / 2, (lon1 + lon2) / 2];
  const leafletBounds: L.LatLngBoundsExpression = [
    [lat1, lon1],
    [lat2, lon2],
  ];

  return (
    <div className="flex flex-col space-y-3 w-full">
      {/* Top Map HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#0F1A3A]/90 border border-[#00F0FF]/20 text-xs">
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-[#00F0FF]" />
          <span className="font-semibold text-white">Geospatial Co-Registration Viewer</span>
          <span className="px-2 py-0.5 rounded bg-[#14234C] text-[#00F0FF] font-mono text-[11px]">
            {crs}
          </span>
        </div>

        {/* Base Layer Switcher */}
        <div className="flex items-center space-x-2">
          <span className="text-slate-400 text-xs flex items-center space-x-1">
            <Layers className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>Basemap:</span>
          </span>
          <button
            onClick={() => setMapType('satellite')}
            className={`px-2.5 py-1 rounded text-xs transition-all ${
              mapType === 'satellite' ? 'bg-[#00F0FF] text-black font-semibold' : 'bg-[#060913] text-slate-300'
            }`}
          >
            Satellite Hybrid
          </button>
          <button
            onClick={() => setMapType('streets')}
            className={`px-2.5 py-1 rounded text-xs transition-all ${
              mapType === 'streets' ? 'bg-[#00F0FF] text-black font-semibold' : 'bg-[#060913] text-slate-300'
            }`}
          >
            Carto Dark
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="w-full h-[420px] rounded-xl overflow-hidden border border-[#00F0FF]/30 shadow-2xl relative z-10">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          {mapType === 'satellite' ? (
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>, Earthstar Geographics'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          )}

          {/* GeoTIFF Bounding Box Overlay */}
          <Polygon
            positions={polygonCoords}
            pathOptions={{
              color: '#00F0FF',
              weight: 2,
              fillColor: '#00F0FF',
              fillOpacity: 0.15,
              dashArray: '4, 4',
            }}
          >
            <Popup>
              <div className="text-xs space-y-1">
                <div className="font-bold text-[#0A1128]">{filename}</div>
                <div>Source Resolution: <span className="font-mono">{sourceResolution}m</span></div>
                <div>Enhanced Resolution: <span className="font-mono text-cyan-600 font-bold">{targetResolution}m</span></div>
                <div>CRS: <span className="font-mono">{crs}</span></div>
              </div>
            </Popup>
          </Polygon>

          {/* Center Pin Marker */}
          <Marker position={center}>
            <Popup>
              <div className="text-xs">
                <strong>Footprint Center</strong>
                <div>Lat: {center[0].toFixed(5)}, Lon: {center[1].toFixed(5)}</div>
              </div>
            </Popup>
          </Marker>

          <FitBoundsHelper bounds={leafletBounds} />
        </MapContainer>

        {/* Bottom Coordinates Readout */}
        <div className="absolute bottom-2 left-3 z-[1000] px-3 py-1.5 rounded-lg bg-[#060913]/90 backdrop-blur border border-slate-700 text-[11px] font-mono text-slate-300">
          Bounds: [{lat1.toFixed(4)}, {lon1.toFixed(4)}] to [{lat2.toFixed(4)}, {lon2.toFixed(4)}]
        </div>
      </div>
    </div>
  );
};
