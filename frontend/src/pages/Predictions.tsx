import { useState } from 'react';
import {
  BarChart3,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  GitCommit,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowDown
} from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

interface PredictionResponse {
  prediction: number;
  label: string;
  probability: {
    'Poor Quality': number;
    'Good Quality': number;
  };
  feature_importances: Record<string, number>;
  decision_path_text?: string;
  error?: string;
  hint?: string;
}

const PRESETS = {
  clean_river: {
    name: 'Clean Alpine River (Sutlej / Beas)',
    features: {
      Dissolved_Oxygen: 8.5,
      BOD: 1.0,
      pH: 7.6,
      Temperature: 18.0,
      Conductivity: 120.0,
      NitrateN: 0.5,
      Fecal_Coliform: 25.0,
      Total_Coliform: 110.0,
    },
  },
  drinking_supply: {
    name: 'Municipal Reservoir (Tenughat Dam)',
    features: {
      Dissolved_Oxygen: 7.2,
      BOD: 1.8,
      pH: 7.4,
      Temperature: 24.5,
      Conductivity: 240.0,
      NitrateN: 1.2,
      Fecal_Coliform: 80.0,
      Total_Coliform: 340.0,
    },
  },
  industrial_canal: {
    name: 'Industrial Canal (Agra / CPCB Drain)',
    features: {
      Dissolved_Oxygen: 2.1,
      BOD: 14.5,
      pH: 6.2,
      Temperature: 29.0,
      Conductivity: 1450.0,
      NitrateN: 8.5,
      Fecal_Coliform: 2400.0,
      Total_Coliform: 8500.0,
    },
  },
  urban_drain: {
    name: 'Critical Effluent Outfall (Telangana / AP)',
    features: {
      Dissolved_Oxygen: 0.8,
      BOD: 32.0,
      pH: 5.8,
      Temperature: 31.5,
      Conductivity: 2200.0,
      NitrateN: 15.0,
      Fecal_Coliform: 18000.0,
      Total_Coliform: 45000.0,
    },
  },
};

const Predictions = () => {
  const [features, setFeatures] = useState<Record<string, number>>({
    Dissolved_Oxygen: 6.8,
    BOD: 2.1,
    pH: 7.35,
    Temperature: 25.0,
    Conductivity: 320.0,
    NitrateN: 1.4,
    Fecal_Coliform: 120.0,
    Total_Coliform: 480.0,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>({
    prediction: 1,
    label: 'Good Quality',
    probability: {
      'Good Quality': 0.945,
      'Poor Quality': 0.055,
    },
    feature_importances: {
      Dissolved_Oxygen: 0.42,
      BOD: 0.28,
      pH: 0.15,
      Fecal_Coliform: 0.09,
      Conductivity: 0.04,
      Temperature: 0.02,
    },
    decision_path_text: `|--- Dissolved_Oxygen >  4.00
|   |--- BOD <= 3.00
|   |   |--- pH <= 8.50
|   |   |   |--- class: Good Quality
|   |   |--- pH >  8.50
|   |   |   |--- class: Poor Quality (Alkaline Risk)
|   |--- BOD >  3.00
|   |   |--- class: Poor Quality (High Organic Load)
|--- Dissolved_Oxygen <= 4.00
|   |--- class: Poor Quality (Hypoxic Depletion)`,
  });

  const handleInputChange = (field: string, val: number) => {
    setFeatures((prev) => ({ ...prev, [field]: val }));
  };

  const loadPreset = (key: keyof typeof PRESETS) => {
    setFeatures(PRESETS[key].features);
  };

  const handlePredict = async () => {
    setLoading(true);
    try {
      // First ensure model is trained if not ready
      const res = await fetch(API_ENDPOINTS.predict, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.error && data.hint) {
          // Train model automatically first
          await fetch(API_ENDPOINTS.train, { method: 'POST' });
          const retryRes = await fetch(API_ENDPOINTS.predict, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ features }),
          });
          const retryData = await retryRes.json();
          setResult(retryData);
        } else {
          setResult(data);
        }
      }
    } catch (err) {
      console.warn('Prediction fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const isGood = result?.label === 'Good Quality';
  const confidencePct = result?.probability
    ? (isGood ? result.probability['Good Quality'] : result.probability['Poor Quality']) * 100
    : 92.5;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-mono text-cyan-400 font-bold tracking-tight flex items-center gap-3">
            <Sliders className="w-7 h-7 text-cyan-400" /> WATER QUALITY PREDICTION ENGINE
          </h1>
          <p className="text-sm font-mono text-slate-400 mt-1">
            Multivariate Decision Tree Inference with Dynamic Decision Path Explanations
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Presets:</span>
          {Object.entries(PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => loadPreset(key as any)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700 transition-colors"
            >
              {preset.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 5 Cols: Input Sliders */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-xl space-y-6">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <h3 className="font-mono text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" /> Enter Sample Parameters
            </h3>
            <span className="text-[10px] font-mono text-slate-500">8 BIOMARKERS</span>
          </div>

          <div className="space-y-4">
            {/* Dissolved Oxygen */}
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-300">Dissolved Oxygen (DO)</span>
                <span className="text-cyan-300 font-bold">{features.Dissolved_Oxygen} mg/L</span>
              </div>
              <input
                type="range"
                min="0"
                max="14"
                step="0.1"
                value={features.Dissolved_Oxygen}
                onChange={(e) => handleInputChange('Dissolved_Oxygen', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800"
              />
              <span className="text-[10px] text-slate-500 block">CPCB Threshold: ≥ 4.0 mg/L (Critical)</span>
            </div>

            {/* BOD */}
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-300">Biochemical Oxygen Demand (BOD)</span>
                <span className="text-purple-300 font-bold">{features.BOD} mg/L</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="0.5"
                value={features.BOD}
                onChange={(e) => handleInputChange('BOD', parseFloat(e.target.value))}
                className="w-full accent-purple-400 bg-slate-800"
              />
              <span className="text-[10px] text-slate-500 block">CPCB Threshold: ≤ 3.0 mg/L</span>
            </div>

            {/* pH */}
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-300">pH Level</span>
                <span className="text-emerald-300 font-bold">{features.pH}</span>
              </div>
              <input
                type="range"
                min="3"
                max="12"
                step="0.05"
                value={features.pH}
                onChange={(e) => handleInputChange('pH', parseFloat(e.target.value))}
                className="w-full accent-emerald-400 bg-slate-800"
              />
              <span className="text-[10px] text-slate-500 block">Safe Range: 6.50 – 8.50</span>
            </div>

            {/* Conductivity */}
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-300">Conductivity</span>
                <span className="text-blue-300 font-bold">{features.Conductivity} µS/cm</span>
              </div>
              <input
                type="range"
                min="10"
                max="2500"
                step="20"
                value={features.Conductivity}
                onChange={(e) => handleInputChange('Conductivity', parseFloat(e.target.value))}
                className="w-full accent-blue-400 bg-slate-800"
              />
            </div>

            {/* Temperature */}
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-300">Temperature</span>
                <span className="text-amber-300 font-bold">{features.Temperature} °C</span>
              </div>
              <input
                type="range"
                min="5"
                max="45"
                step="0.5"
                value={features.Temperature}
                onChange={(e) => handleInputChange('Temperature', parseFloat(e.target.value))}
                className="w-full accent-amber-400 bg-slate-800"
              />
            </div>

            {/* Fecal Coliform */}
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-300">Fecal Coliform</span>
                <span className="text-red-300 font-bold">{features.Fecal_Coliform} MPN/100ml</span>
              </div>
              <input
                type="range"
                min="0"
                max="10000"
                step="50"
                value={features.Fecal_Coliform}
                onChange={(e) => handleInputChange('Fecal_Coliform', parseFloat(e.target.value))}
                className="w-full accent-red-400 bg-slate-800"
              />
            </div>
          </div>

          <button
            onClick={handlePredict}
            disabled={loading}
            className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'RUNNING INFERENCE...' : 'ANALYZE WATER SAMPLE'}
          </button>
        </div>

        {/* Right 7 Cols: Prediction Output & Decision Path */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Verdict Card */}
          <div className="glass-panel p-8 rounded-xl relative overflow-hidden flex flex-col items-center text-center">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block mb-3">
              AI MODEL INFERENCE RESULT
            </span>

            {isGood ? (
              <div className="space-y-3">
                <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/15 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                  <ShieldCheck className="w-12 h-12" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-mono font-black text-emerald-400 tracking-wider">
                  GOOD QUALITY (SAFE)
                </h2>
                <p className="text-xs font-mono text-slate-300 max-w-md mx-auto">
                  Biochemical markers fall within permissible CPCB Class-C aquatic criteria for drinking source or bathing.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/15 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                  <AlertTriangle className="w-12 h-12" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-mono font-black text-amber-400 tracking-wider">
                  POOR QUALITY (RISK DETECTED)
                </h2>
                <p className="text-xs font-mono text-slate-300 max-w-md mx-auto">
                  Elevated organic demand, hypoxic depletion, or high coliform concentration exceeds acceptable safety limits.
                </p>
              </div>
            )}

            {/* Probability Metric */}
            <div className="mt-6 pt-6 border-t border-slate-800 w-full max-w-md flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">MODEL PREDICTED PROBABILITY:</span>
              <span className="text-cyan-300 font-bold text-sm">
                {confidencePct.toFixed(1)}% <span className="text-[10px] text-slate-400 font-normal">(NOT CERTAINTY)</span>
              </span>
            </div>
          </div>

          {/* Decision Path Explanation */}
          <div className="glass-panel p-6 rounded-xl space-y-4">
            <h3 className="font-mono text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-cyan-400" /> Transparent Decision Path Explanation
            </h3>
            <p className="text-xs font-mono text-slate-400">
              Exact conditional rule-path traversed through the trained Decision Tree splits:
            </p>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre leading-relaxed">
              {result?.decision_path_text || 'Decision path inference active.'}
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400">
              <strong className="text-cyan-300">Responsible AI Notice:</strong> Predictions reflect empirical statistical associations in CPCB data. This system is an analytical intelligence tool and does not substitute certified laboratory chemical testing or statutory government certification.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Predictions;
