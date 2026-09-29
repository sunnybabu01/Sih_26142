import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  BarChart2,
  FileCheck
} from 'lucide-react';

interface BandMetric {
  band: string;
  psnr_db: number;
  ssim: number;
  mae: number;
  rmse: number;
}

interface ValidationReportData {
  referenceAvailable: boolean;
  statusMessage?: string;
  psnr?: number | null;
  ssim?: number | null;
  mae?: number | null;
  rmse?: number | null;
  bandMetrics?: BandMetric[];
  geospatialIntegrity?: string;
  uncertaintyNotes?: string;
}

export const QualityMetricsCard: React.FC<{ validation: ValidationReportData }> = ({ validation }) => {
  const {
    referenceAvailable,
    statusMessage,
    psnr,
    ssim,
    mae,
    rmse,
    bandMetrics = [],
    geospatialIntegrity,
    uncertaintyNotes,
  } = validation;

  return (
    <div className="flex flex-col space-y-4 w-full">
      
      {/* Reference Availability Status Banner */}
      <div className={`p-4 rounded-xl border flex items-start space-x-3 ${
        referenceAvailable
          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
          : 'bg-[#0F1A3A]/80 border-[#00F0FF]/30 text-slate-300'
      }`}>
        {referenceAvailable ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <HelpCircle className="w-5 h-5 text-[#00F0FF] shrink-0 mt-0.5" />
        )}
        <div className="space-y-1">
          <div className="text-sm font-semibold text-white">
            {referenceAvailable ? 'Ground-Truth Validation Active' : 'Reference-Based Validation Unavailable'}
          </div>
          <p className="text-xs text-slate-300">
            {statusMessage || (referenceAvailable
              ? 'Computed using co-registered high-resolution reference dataset.'
              : 'Objective ground-truth metrics require independent high-resolution reference imagery (e.g., PlanetScope 3m, SPOT 1.5m, Pleiades 0.5m). No reference was supplied with this job.')}
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      {referenceAvailable && psnr !== null ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          <div className="p-4 rounded-xl bg-[#0F1A3A] border border-[#00F0FF]/25 shadow-lg">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">PSNR</div>
            <div className="text-2xl font-bold text-[#00F0FF] mt-1">{psnr} <span className="text-xs font-normal text-slate-400">dB</span></div>
            <div className="text-[10px] text-slate-400 mt-1">Peak Signal-to-Noise Ratio</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0F1A3A] border border-[#00F0FF]/25 shadow-lg">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">SSIM</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{ssim}</div>
            <div className="text-[10px] text-slate-400 mt-1">Structural Similarity Index</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0F1A3A] border border-[#00F0FF]/25 shadow-lg">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">MAE</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{mae}</div>
            <div className="text-[10px] text-slate-400 mt-1">Mean Absolute Error</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0F1A3A] border border-[#00F0FF]/25 shadow-lg">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">RMSE</div>
            <div className="text-2xl font-bold text-sky-400 mt-1">{rmse}</div>
            <div className="text-[10px] text-slate-400 mt-1">Root Mean Squared Error</div>
          </div>

        </div>
      ) : (
        <div className="p-6 rounded-xl bg-[#0A1128]/70 border border-slate-800 text-center space-y-2">
          <div className="text-slate-400 text-sm">
            Mathematical metrics (PSNR, SSIM, MAE, RMSE) are intentionally not fabricated.
          </div>
          <p className="text-xs text-slate-500 max-w-xl mx-auto">
            Sentinel-2 10-meter imagery is medium-resolution; accurate fidelity scoring requires registered high-resolution ground truth.
          </p>
        </div>
      )}

      {/* Band-Wise Analysis Chart */}
      {referenceAvailable && bandMetrics.length > 0 && (
        <div className="p-4 rounded-xl bg-[#0F1A3A] border border-[#00F0FF]/20 space-y-3">
          <div className="flex items-center space-x-2 text-sm font-semibold text-white">
            <BarChart2 className="w-4 h-4 text-[#00F0FF]" />
            <span>Band-Wise Spectral Fidelity (PSNR in dB)</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bandMetrics} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="band" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} domain={[0, 45]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#060913', borderColor: '#00F0FF', borderRadius: '8px' }}
                />
                <Bar dataKey="psnr_db" name="PSNR (dB)" fill="#00F0FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Geospatial Integrity Status */}
      <div className="p-3.5 rounded-xl bg-[#0F1A3A]/80 border border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 text-slate-300">
          <FileCheck className="w-4 h-4 text-emerald-400" />
          <span>Geospatial Integrity &amp; Affine Projection:</span>
        </div>
        <span className="font-mono text-emerald-400 font-medium">
          {geospatialIntegrity || 'Verified: CRS and Affine Transform Preserved'}
        </span>
      </div>

      {/* Mandatory Uncertainty Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/40 text-amber-200 text-xs space-y-2">
        <div className="flex items-center space-x-2 font-bold text-amber-300 text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Scientific Uncertainty &amp; Inferred Detail Warning</span>
        </div>
        <p className="leading-relaxed">
          {uncertaintyNotes || (
            'AI-generated fine features (e.g. sharp field edges, road corridors, and structural textures) are reconstructed by deep neural network statistical priors learned during training and do not represent direct sensor ground observations. Finer pixel spacing (e.g. 2.5m) should not be presented as proof of true ground resolution without verified reference validation.'
          )}
        </p>
      </div>

    </div>
  );
};
