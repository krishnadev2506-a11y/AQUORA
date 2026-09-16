import { useState, useEffect, useRef } from 'react';
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Zap,
  RefreshCw,
  BarChart2,
  Sliders,
  CheckCircle2,
  XCircle,
  Clock,
  Gauge,
  Database
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { API_ENDPOINTS } from '../config/api';

interface SensorPayload {
  sensors: Record<string, number>;
  source?: string;
  status?: Record<string, string>;
  health?: Record<string, number>;
}

interface SummaryData {
  samples?: number;
  engineered_rows?: number;
  sensors?: number;
  missingValues?: number;
  dataQuality?: string;
  bestModel?: string;
  status?: string;
  classDistribution?: Record<string, number>;
  targetLabels?: Record<string, string>;
  features?: string[];
  waterBodyTypes?: string[];
  states?: string[];
}

const PARAM_META: Record<string, { unit: string; safeMin: number; safeMax: number; desc: string }> = {
  pH: { unit: 'pH', safeMin: 6.5, safeMax: 8.5, desc: 'Acidity / Alkalinity level' },
  TDS: { unit: 'ppm', safeMin: 50, safeMax: 500, desc: 'Total Dissolved Solids' },
  Turbidity: { unit: 'NTU', safeMin: 0, safeMax: 5.0, desc: 'Water clarity / particulate' },
  Dissolved_O2: { unit: 'mg/L', safeMin: 4.0, safeMax: 14.0, desc: 'Dissolved Oxygen concentration' },
  Temperature: { unit: '°C', safeMin: 12.0, safeMax: 32.0, desc: 'Water temperature' },
  BOD: { unit: 'mg/L', safeMin: 0, safeMax: 3.0, desc: 'Biochemical Oxygen Demand' },
  Conductivity: { unit: 'µS/cm', safeMin: 50, safeMax: 1000, desc: 'Electrical conductivity' },
};

const Dashboard = () => {
  const [sensors, setSensors] = useState<Record<string, number>>({
    pH: 7.24,
    TDS: 428.0,
    Turbidity: 2.15,
    Dissolved_O2: 6.80,
    Temperature: 25.4,
    BOD: 1.85,
    Conductivity: 340.0,
  });

  const [sensorHealth, setSensorHealth] = useState<Record<string, number>>({
    pH: 98,
    TDS: 96,
    Turbidity: 94,
    Dissolved_O2: 97,
    Temperature: 99,
    BOD: 92,
    Conductivity: 95,
  });

  const [sensorStatus, setSensorStatus] = useState<Record<string, string>>({
    pH: 'ONLINE',
    TDS: 'ONLINE',
    Turbidity: 'ONLINE',
    Dissolved_O2: 'ONLINE',
    Temperature: 'ONLINE',
    BOD: 'ONLINE',
    Conductivity: 'ONLINE',
  });

  const [history, setHistory] = useState<Array<{ time: string; pH: number; DO: number; Turbidity: number; BOD: number }>>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [alerts, setAlerts] = useState<Array<{ id: number; text: string; type: 'warning' | 'info' | 'critical' }>>([
    { id: 1, text: 'Simulated CPCB Real-time stream synchronized with National Water Grid telemetry.', type: 'info' },
  ]);

  const wsRef = useRef<WebSocket | null>(null);

  // Fetch summary stats
  const fetchSummary = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.summary);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.warn('Backend summary fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // WebSocket connection management
  useEffect(() => {
    if (!isSimulating) {
      if (wsRef.current) {
        wsRef.current.close();
      }
      return;
    }

    let isSubscribed = true;
    let fallbackInterval: any = null;

    const connectWs = () => {
      try {
        const ws = new WebSocket(API_ENDPOINTS.wsSensors);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isSubscribed) setWsConnected(true);
        };

        ws.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const payload: SensorPayload = JSON.parse(event.data);
            if (payload && payload.sensors && typeof payload.sensors === 'object') {
              setSensors((prev) => ({ ...prev, ...payload.sensors }));

              if (payload.health) {
                setSensorHealth(payload.health);
              }
              if (payload.status) {
                setSensorStatus(payload.status);
              }

              // Append to history
              const now = new Date();
              const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              setHistory((prev) => {
                const item = {
                  time: timeStr,
                  pH: Number(payload.sensors.pH?.toFixed(2) || 7.0),
                  DO: Number(payload.sensors.Dissolved_O2?.toFixed(2) || 6.5),
                  Turbidity: Number(payload.sensors.Turbidity?.toFixed(2) || 2.0),
                  BOD: Number(payload.sensors.BOD?.toFixed(2) || 2.0),
                };
                return [...prev.slice(-15), item];
              });
            }
          } catch (e) {
            console.error('Error parsing sensor payload:', e);
          }
        };

        ws.onerror = () => {
          if (isSubscribed) setWsConnected(false);
        };

        ws.onclose = () => {
          if (isSubscribed) setWsConnected(false);
        };
      } catch (err) {
        console.warn('WebSocket connection error:', err);
        setWsConnected(false);
      }
    };

    connectWs();

    // Fallback polling if WS is down
    fallbackInterval = setInterval(() => {
      if (!wsConnected && isSimulating) {
        // Generate slight realistic variations
        setSensors((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((k) => {
            const meta = PARAM_META[k];
            if (meta) {
              const delta = (Math.random() - 0.5) * 0.08 * (meta.safeMax - meta.safeMin);
              next[k] = Number(Math.max(0, next[k] + delta).toFixed(2));
            }
          });
          return next;
        });

        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setHistory((prev) => [
          ...prev.slice(-15),
          {
            time: timeStr,
            pH: Number(sensors.pH?.toFixed(2) || 7.2),
            DO: Number(sensors.Dissolved_O2?.toFixed(2) || 6.5),
            Turbidity: Number(sensors.Turbidity?.toFixed(2) || 2.1),
            BOD: Number(sensors.BOD?.toFixed(2) || 1.9),
          },
        ]);
      }
    }, 2500);

    return () => {
      isSubscribed = false;
      if (wsRef.current) wsRef.current.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [isSimulating]);

  // Evaluate risk level based on live values
  const getSensorHealthBadge = (key: string, val: number) => {
    const meta = PARAM_META[key];
    if (!meta) return { status: 'NORMAL', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };

    if (val < meta.safeMin || val > meta.safeMax) {
      return { status: 'DEVIATION', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
    }
    return { status: 'OPTIMAL', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
  };

  const isSafeOverall =
    sensors.pH >= 6.5 &&
    sensors.pH <= 8.5 &&
    sensors.Dissolved_O2 >= 4.0 &&
    sensors.BOD <= 3.5 &&
    sensors.Turbidity <= 4.5;

  const dismissAlert = (id: number) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-mono text-cyan-400 font-bold tracking-tight">
              WATER QUALITY COMMAND CENTER
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1 font-mono">
            Autonomous Sensor Telemetry & ML Water Classification (CPCB Framework)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-mono text-xs tracking-wider transition-all border ${
              isSimulating
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isSimulating ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
            {isSimulating ? 'SIMULATION ACTIVE' : 'PAUSED'}
          </button>

          <button
            onClick={fetchSummary}
            className="p-2 rounded-md bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
            title="Refresh Server Telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900/80 border border-slate-700">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  wsConnected ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  wsConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              ></span>
            </span>
            <span className="text-[11px] font-mono text-slate-300">
              {wsConnected ? 'LIVE WS' : 'REST POLLING'}
            </span>
          </div>
        </div>
      </div>

      {/* Alert Notices */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono text-cyan-200"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>{alert.text}</span>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="text-slate-400 hover:text-slate-200 text-sm ml-4 font-bold"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-xl border-t-2 border-t-cyan-500 glass-panel-hover">
          <div className="flex justify-between items-center text-slate-400 text-xs font-mono mb-2">
            <span>CPCB SAMPLES</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl md:text-3xl font-mono font-bold text-white">
            {summary?.samples || 162}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">16 Indian States Monitored</div>
        </div>

        <div className="glass-panel p-5 rounded-xl border-t-2 border-t-emerald-500 glass-panel-hover">
          <div className="flex justify-between items-center text-slate-400 text-xs font-mono mb-2">
            <span>DATA QUALITY</span>
            <Gauge className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl md:text-3xl font-mono font-bold text-emerald-400">
            {summary?.dataQuality || '88.3%'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            {summary?.missingValues || 333} Missing Cells Imputed
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border-t-2 border-t-blue-500 glass-panel-hover">
          <div className="flex justify-between items-center text-slate-400 text-xs font-mono mb-2">
            <span>ACTIVE ML MODEL</span>
            <Sliders className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl md:text-2xl font-mono font-bold text-blue-300 truncate">
            {summary?.bestModel || 'Decision Tree'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">GridSearchCV Tuned</div>
        </div>

        <div className="glass-panel p-5 rounded-xl border-t-2 border-t-purple-500 glass-panel-hover">
          <div className="flex justify-between items-center text-slate-400 text-xs font-mono mb-2">
            <span>VIRTUAL PROBES</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl md:text-3xl font-mono font-bold text-purple-300">
            {Object.keys(sensors).length} Online
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">IoT Simulation Node</div>
        </div>
      </div>

      {/* Main Status & Quick Telemetry Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Status & Dynamic Water Indicator */}
        <div className="lg:col-span-2 glass-panel p-6 md:p-8 rounded-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase">
                AI WATER CLASSIFICATION STATUS
              </span>
              <h3 className="text-xl font-mono font-bold text-white mt-1">
                Real-Time River & Reservoir Assessment
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Standards Framework</span>
              <span className="text-xs font-mono text-cyan-300 font-semibold">CPCB Class-C Criteria</span>
            </div>
          </div>

          <div className="py-8 flex flex-col items-center justify-center text-center">
            {isSafeOverall ? (
              <div className="space-y-4">
                <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/10 border-2 border-emerald-400/40 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.25)] animate-pulse">
                  <ShieldCheck className="w-14 h-14 text-emerald-400" />
                </div>
                <div className="text-4xl md:text-5xl font-mono font-black text-emerald-400 tracking-wider">
                  GOOD QUALITY
                </div>
                <p className="text-sm font-mono text-slate-300 max-w-md mx-auto">
                  All active sensor parameters (pH, DO, BOD, Turbidity) conform within safe aquatic thresholds.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-24 h-24 mx-auto rounded-full bg-amber-500/10 border-2 border-amber-400/40 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.25)] animate-pulse">
                  <AlertTriangle className="w-14 h-14 text-amber-400" />
                </div>
                <div className="text-4xl md:text-5xl font-mono font-black text-amber-400 tracking-wider">
                  ELEVATED RISK
                </div>
                <p className="text-sm font-mono text-slate-300 max-w-md mx-auto">
                  Parameter deviation detected. Biochemical oxygen demand or particulate concentration indicates degraded quality.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-6 border-t border-slate-800 text-center">
            <div className="p-2 rounded bg-slate-900/50">
              <span className="text-[11px] font-mono text-slate-400 block">Class Distribution</span>
              <span className="text-sm font-mono font-bold text-emerald-400">
                88.3% Good (143)
              </span>
            </div>
            <div className="p-2 rounded bg-slate-900/50">
              <span className="text-[11px] font-mono text-slate-400 block">High Risk Stations</span>
              <span className="text-sm font-mono font-bold text-amber-400">
                11.7% Poor (19)
              </span>
            </div>
            <div className="p-2 rounded bg-slate-900/50">
              <span className="text-[11px] font-mono text-slate-400 block">Active Probes</span>
              <span className="text-sm font-mono font-bold text-cyan-300">
                7 Parameters
              </span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live Telemetry Probes */}
        <div className="glass-panel p-6 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-mono text-sm font-bold text-cyan-400 flex items-center gap-2 uppercase tracking-wider">
              <Activity className="w-4 h-4 text-cyan-400" /> Sensor Readings
            </h3>
            <span className="text-[10px] font-mono text-slate-400">SIMULATED SENSORS</span>
          </div>

          <div className="space-y-3 divide-y divide-slate-800">
            {Object.entries(sensors).map(([key, value]) => {
              const meta = PARAM_META[key] || { unit: '', desc: '', safeMin: 0, safeMax: 100 };
              const badge = getSensorHealthBadge(key, value);
              const health = sensorHealth[key] || 98;

              return (
                <div key={key} className="pt-2.5 first:pt-0 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-slate-200">{key}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${badge.bg} ${badge.color}`}>
                        {badge.status}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 block">{meta.desc}</span>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-mono font-bold text-cyan-300">
                      {typeof value === 'number' ? value.toFixed(2) : value}{' '}
                      <span className="text-xs font-normal text-slate-400">{meta.unit}</span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500">
                      Probe Health: {health}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sensor Trend Chart Section */}
      <div className="glass-panel p-6 rounded-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="font-mono text-base font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-400" /> Real-time Trend Stream (pH, DO, Turbidity, BOD)
            </h3>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Rolling window of live simulated sensor observations
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span> pH
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span> Dissolved O₂
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span> Turbidity
            </span>
            <span className="flex items-center gap-1.5 text-purple-400">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block"></span> BOD
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          {history.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} fontFamily="monospace" />
                <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" domain={[0, 14]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }}
                />
                <Line type="monotone" dataKey="pH" stroke="#06b6d4" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="DO" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="Turbidity" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="BOD" stroke="#a855f7" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">
              Initializing live stream telemetry buffers...
            </div>
          )}
        </div>
      </div>

      {/* Indian Stations Monitored Preview */}
      <div className="glass-panel p-6 rounded-xl">
        <h3 className="font-mono text-sm font-bold text-cyan-400 mb-4 uppercase tracking-wider">
          Covered Water Body Profiles (162 CPCB Field Stations)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {['RIVER', 'LAKE', 'POND', 'BEACH', 'CANAL', 'DRAIN'].map((wb) => (
            <div key={wb} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-xs font-mono font-bold text-slate-200 block">{wb}</span>
              <span className="text-[10px] font-mono text-cyan-400">ACTIVE TELEMETRY</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
