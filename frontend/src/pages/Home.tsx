import { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import {
  Droplet,
  Activity,
  Cpu,
  ShieldCheck,
  ChevronRight,
  Database,
  Search,
  CheckCircle,
  MapPin,
  Flame,
  ArrowRight
} from 'lucide-react';
import WaterCore from '../components3d/WaterCore';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

const Home = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);

  const startAnalysisSequence = () => {
    setIsScanning(true);
    setScanStep(1);

    setTimeout(() => setScanStep(2), 700);
    setTimeout(() => setScanStep(3), 1400);
    setTimeout(() => setScanStep(4), 2100);
    setTimeout(() => {
      navigate('/dashboard');
    }, 2800);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#020617] text-slate-100 overflow-hidden">
      {/* Scanning Modal Animation */}
      {isScanning && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-8 rounded-2xl border border-cyan-500/50 shadow-[0_0_50px_rgba(6,182,212,0.35)] text-center space-y-6 animate-scaleUp">
            <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center animate-spin">
              <Droplet className="w-8 h-8 text-cyan-400" />
            </div>

            <h3 className="text-xl font-mono font-bold text-cyan-300 tracking-wider">
              {scanStep === 1 && 'INITIALIZING WATER SCAN...'}
              {scanStep === 2 && 'ANALYZING SENSOR TELEMETRY...'}
              {scanStep === 3 && 'RUNNING DECISION TREE INFERENCE...'}
              {scanStep === 4 && 'DIAGNOSTIC COMPLETE!'}
            </h3>

            <div className="space-y-2 text-left font-mono text-xs text-slate-300">
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span>pH & Dissolved O₂</span>
                <span className={scanStep >= 2 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {scanStep >= 2 ? '✓ CAPTURED' : 'PENDING'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span>Biochemical Oxygen Demand (BOD)</span>
                <span className={scanStep >= 2 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {scanStep >= 2 ? '✓ CALIBRATED' : 'PENDING'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span>Conductivity & Turbidity Matrix</span>
                <span className={scanStep >= 3 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {scanStep >= 3 ? '✓ EVALUATED' : 'PENDING'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span>Predictive Risk Assessment</span>
                <span className={scanStep >= 4 ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {scanStep >= 4 ? '✓ READY' : 'CALCULATING'}
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-700"
                style={{ width: `${(scanStep / 4) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative h-[92vh] w-full flex items-center justify-center">
        {/* 3D Canvas Background */}
        <div className="absolute inset-0 z-0">
          <ErrorBoundary
            fallbackTitle="3D VIEW UNAVAILABLE"
            children={
              <Suspense
                fallback={
                  <div className="w-full h-full flex items-center justify-center text-cyan-500 font-mono text-xs">
                    Loading 3D Water Intelligence Core...
                  </div>
                }
              >
                <Canvas camera={{ position: [0, 0, 7.5], fov: 45 }}>
                  <WaterCore />
                  <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.6} />
                </Canvas>
              </Suspense>
            }
          />
        </div>

        {/* Hero Overlay Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-6 pointer-events-none">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-mono tracking-widest uppercase">
            <Droplet className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            Autonomous Water Intelligence & ML Telemetry
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-teal-300 drop-shadow-2xl">
            AQUORA
          </h1>

          <p className="text-xl sm:text-2xl font-mono text-slate-300 font-light tracking-wide max-w-2xl mx-auto leading-relaxed">
            Understand your water. <br />
            <span className="text-cyan-400 font-medium">Before it becomes an ecological risk.</span>
          </p>

          <p className="text-sm font-mono text-slate-400 max-w-xl mx-auto">
            Live telemetry monitoring, missing-data imputation algorithms, and Decision Tree quality prediction for 160+ CPCB Indian river & reservoir stations.
          </p>

          <div className="pt-4 flex flex-wrap gap-4 justify-center pointer-events-auto">
            <button
              onClick={startAnalysisSequence}
              className="px-8 py-4 bg-cyan-500 text-slate-950 rounded-lg hover:bg-cyan-400 font-mono font-bold tracking-wider uppercase text-sm shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2 group"
            >
              <span>[ ANALYZE WATER ]</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => navigate('/dataset')}
              className="px-8 py-4 bg-slate-900/80 border border-slate-700 hover:border-cyan-500/50 text-slate-200 rounded-lg font-mono tracking-wider uppercase text-sm transition-all"
            >
              [ EXPLORE DATASET ]
            </button>
          </div>
        </div>

        {/* Floating Parameter Indicators */}
        <div className="hidden lg:flex absolute bottom-8 left-12 right-12 justify-between z-10 pointer-events-none text-xs font-mono text-slate-400">
          <div className="flex items-center gap-6 glass-panel px-4 py-2 rounded-lg">
            <span>pH: <strong className="text-cyan-400">7.24</strong></span>
            <span>DO: <strong className="text-emerald-400">6.80 mg/L</strong></span>
            <span>BOD: <strong className="text-purple-400">1.85 mg/L</strong></span>
            <span>Turbidity: <strong className="text-amber-400">2.15 NTU</strong></span>
          </div>
          <div className="glass-panel px-4 py-2 rounded-lg text-slate-300">
            CPCB MONITORING NETWORK: <span className="text-emerald-400">ONLINE</span>
          </div>
        </div>
      </section>

      {/* Section 01: The Water */}
      <section className="py-20 px-6 max-w-6xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase block">
            SECTION 01 // THE ESSENCE
          </span>
          <h2 className="text-3xl sm:text-4xl font-mono font-bold text-white">
            "Every drop contains data."
          </h2>
          <p className="text-sm font-mono text-slate-400">
            Water quality is not a static binary. It is a continuous multivariate biochemical signature shaped by organic carbon, industrial effluent, dissolved oxygen, and bacterial kinetics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-xl border border-slate-800 glass-panel-hover space-y-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Droplet className="w-5 h-5" />
            </div>
            <h3 className="font-mono text-base font-bold text-white uppercase">Physical Matrix</h3>
            <p className="text-xs font-mono text-slate-400 leading-relaxed">
              Turbidity, Temperature, Conductivity, and Total Dissolved Solids indicate particulate suspension and mineral dissolution.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-xl border border-slate-800 glass-panel-hover space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-mono text-base font-bold text-white uppercase">Chemical Balance</h3>
            <p className="text-xs font-mono text-slate-400 leading-relaxed">
              Dissolved Oxygen (DO) and Biochemical Oxygen Demand (BOD) dictate whether aquatic ecosystems thrive or suffer asphyxiation.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-xl border border-slate-800 glass-panel-hover space-y-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-mono text-base font-bold text-white uppercase">Biological Risk</h3>
            <p className="text-xs font-mono text-slate-400 leading-relaxed">
              Fecal and Total Coliform counts correlate with pathogen contamination, sanitation hazards, and non-potability.
            </p>
          </div>
        </div>
      </section>

      {/* Section 02: The Signal & Intelligence */}
      <section className="py-20 px-6 bg-slate-950/60 border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase block">
              SECTION 02 // INTELLIGENCE PIPELINE
            </span>
            <h2 className="text-3xl sm:text-4xl font-mono font-bold text-white">
              Decision Tree Architecture With Missing-Data Resilience
            </h2>
            <p className="text-sm font-mono text-slate-400 leading-relaxed">
              Real-world environmental telemetry suffers from sensor outages and telemetry packet loss. AQUORA benchmarks Median Imputation, KNN Imputation, and Row Deletion across 10%, 20%, and 30% synthetic missingness regimes.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center gap-3 text-slate-300">
                <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>Stratified 80/20 train-test splitting with zero data leakage</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>GridSearchCV hyperparameter tuning (`max_depth`, `min_samples_split`)</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>Dynamic recommendation engine prioritizing Unsafe/Risk recall</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/models')}
                className="px-6 py-3 bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 rounded-lg hover:bg-cyan-500/25 font-mono text-xs uppercase tracking-wider transition-all"
              >
                Inspect AI Model Lab →
              </button>
            </div>
          </div>

          <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-6">
            <h3 className="font-mono text-sm font-bold text-cyan-400 uppercase tracking-wider">
              Telemetry Flow Architecture
            </h3>

            <div className="space-y-4 font-mono text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300">1. Virtual & Physical Probes (pH, DO, BOD)</span>
                <span className="text-cyan-400">WebSocket / MQTT</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300">2. Missing Data Imputation Filter</span>
                <span className="text-emerald-400">Median / KNN</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300">3. Decision Tree Engine</span>
                <span className="text-blue-400">Class-C Inference</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-300">4. Decision Path & Risk Output</span>
                <span className="text-purple-400">Good / Poor Quality</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 03: Indian Water Network Preview */}
      <section className="py-20 px-6 max-w-6xl mx-auto border-t border-slate-800/80">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase block">
            SECTION 03 // INDIAN MONITORING MAP
          </span>
          <h2 className="text-3xl font-mono font-bold text-white">
            16 Indian States Active in National Dataset
          </h2>
          <p className="text-sm font-mono text-slate-400">
            Field stations spanning the Sutlej, Betwa, Damodar, Giri, Godavari, and coastal Bay of Bengal marine points.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 font-mono text-center text-xs">
          {[
            'JHARKHAND',
            'HIMACHAL',
            'UTTARAKHAND',
            'MADHYA PRADESH',
            'RAJASTHAN',
            'ANDHRA PRADESH',
            'GOA',
            'DELHI',
            'GUJARAT',
            'ASSAM',
            'HARYANA',
            'MAHARASHTRA',
            'ODISHA',
            'TAMIL NADU',
            'TELANGANA',
            'UTTAR PRADESH',
          ].map((state) => (
            <div key={state} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <MapPin className="w-3.5 h-3.5 mx-auto mb-1 text-cyan-400" />
              <span className="text-[11px] text-slate-300 font-semibold block truncate">{state}</span>
              <span className="text-[9px] text-slate-500">Telemetry Active</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-16 px-6 border-t border-slate-800 bg-slate-950/80 text-center space-y-6">
        <h2 className="text-2xl sm:text-3xl font-mono font-bold text-white">
          Ready to Analyze Water Quality Data?
        </h2>
        <p className="text-sm font-mono text-slate-400 max-w-md mx-auto">
          Start with the live Command Center or run individual predictive inferences.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-cyan-500 text-slate-950 rounded-lg hover:bg-cyan-400 font-mono font-bold text-xs uppercase tracking-wider transition-all"
          >
            Launch Command Center
          </button>
          <button
            onClick={() => navigate('/predictions')}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-mono text-xs uppercase tracking-wider transition-all"
          >
            Test Predictor
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home;
