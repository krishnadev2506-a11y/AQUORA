import { useState, useEffect } from 'react';
import { Database, Filter, Search, RefreshCw, BarChart2, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface DatasetSummary {
  filename?: string;
  rows?: number;
  columns?: number;
  column_names?: string[];
  engineered_features?: string[];
  target_column?: string;
  target_labels?: Record<string, string>;
  class_distribution?: Record<string, number>;
  missing_values_raw?: Record<string, number>;
  total_missing?: number;
  engineered_rows?: number;
  water_body_types?: string[];
  states?: string[];
}

const SAMPLE_ROWS = [
  { stn: '4085', loc: 'RIVER JUMAR AT BIT MESRA, RANCHI', state: 'JHARKHAND', type: 'RIVER', ph: 6.55, do: 4.25, bod: 2.45, status: 'Good' },
  { stn: '2396', loc: 'RIVER JUMAR AT KANKE DAM', state: 'JHARKHAND', type: 'RIVER', ph: 7.55, do: 6.55, bod: 2.55, status: 'Good' },
  { stn: '2401', loc: 'RIVER AJAY AT MASANJORE DAM', state: 'JHARKHAND', type: 'RIVER', ph: 7.65, do: 6.20, bod: 1.45, status: 'Good' },
  { stn: '1510', loc: 'RIVER TONS AT TIUNI (HP/UK BORDER)', state: 'HIMACHAL PRADESH', type: 'RIVER', ph: 7.83, do: 8.05, bod: 1.13, status: 'Good' },
  { stn: '30023', loc: 'RIVER TONS AT HARIPUR (U.K.)', state: 'UTTARAKHAND', type: 'RIVER', ph: 8.30, do: 9.05, bod: 0.42, status: 'Good' },
  { stn: '2124', loc: 'RIVER BETWA AT CHARANTIRGHAT, VIDISHA', state: 'MADHYA PRADESH', type: 'RIVER', ph: 8.09, do: 9.30, bod: 10.8, status: 'Poor' },
  { stn: '2952', loc: 'RIVER NEAR NEWTA DAM, JAIPUR', state: 'RAJASTHAN', type: 'RIVER', ph: 8.39, do: 2.25, bod: 4.35, status: 'Poor' },
  { stn: '4357', loc: 'RUSHIKONDA BEACH, VISAKHAPATNAM', state: 'ANDHRA PRADESH', type: 'BEACH', ph: 8.10, do: 5.90, bod: 2.05, status: 'Good' },
  { stn: '4013', loc: 'TIRACOL BEACH, GOA', state: 'GOA', type: 'BEACH', ph: 7.75, do: 6.70, bod: 1.65, status: 'Good' },
  { stn: '2057', loc: 'AGRA CANAL, MADANPUR KHADAR, DELHI', state: 'DELHI', type: 'CANAL', ph: 7.30, do: 0.90, bod: 39.0, status: 'Poor' },
  { stn: '2073', loc: 'NARMADA MAIN CANAL, GANDHINAGAR', state: 'GUJARAT', type: 'CANAL', ph: 7.85, do: 6.20, bod: 1.15, status: 'Good' },
  { stn: '5522', loc: 'AT THE CENTER OF DEEPORBEEL, ASSAM', state: 'ASSAM', type: 'LAKE', ph: 8.10, do: 8.00, bod: 5.50, status: 'Good' },
  { stn: '3052', loc: 'GUNTATHIPPA DRAIN, VIJAYAWADA', state: 'ANDHRA PRADESH', type: 'DRAIN', ph: 7.40, do: 1.05, bod: 27.4, status: 'Poor' },
  { stn: '3055', loc: 'AMBERPET STP OUTLET, HYDERABAD', state: 'TELANGANA', type: 'STP', ph: 7.55, do: 2.75, bod: 17.2, status: 'Poor' },
  { stn: '1013', loc: 'RIVER SUTLEJ AT U/S TATAPANI', state: 'HIMACHAL PRADESH', type: 'RIVER', ph: 7.75, do: 8.75, bod: 1.00, status: 'Good' },
];

const Dataset = () => {
  const [data, setData] = useState<DatasetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  const fetchDataset = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/datasets/summary');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.warn('Dataset summary fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataset();
  }, []);

  const filteredRows = SAMPLE_ROWS.filter((r) => {
    const matchSearch = r.loc.toLowerCase().includes(search.toLowerCase()) || r.stn.includes(search);
    const matchState = selectedState === 'ALL' || r.state === selectedState;
    const matchType = selectedType === 'ALL' || r.type === selectedType;
    return matchSearch && matchState && matchType;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-mono text-cyan-400 font-bold tracking-tight flex items-center gap-3">
            <Database className="w-7 h-7 text-cyan-400" /> CPCB WATER QUALITY DATASET
          </h1>
          <p className="text-sm font-mono text-slate-400 mt-1">
            National River, Reservoir & Coastal Monitoring Observations (Central Pollution Control Board)
          </p>
        </div>

        <button
          onClick={fetchDataset}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-md font-mono text-xs tracking-wider transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reload Dataset Metadata
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-xl border-t-2 border-t-cyan-500">
          <span className="text-xs font-mono text-slate-400 block">OBSERVATION STATIONS</span>
          <span className="text-3xl font-mono font-bold text-white mt-1 block">
            {data?.rows || 162}
          </span>
          <span className="text-[11px] font-mono text-slate-500 mt-1 block">
            {data?.states?.length || 16} Indian States
          </span>
        </div>

        <div className="glass-panel p-5 rounded-xl border-t-2 border-t-emerald-500">
          <span className="text-xs font-mono text-slate-400 block">GOOD QUALITY SAMPLES</span>
          <span className="text-3xl font-mono font-bold text-emerald-400 mt-1 block">
            {data?.class_distribution?.['1'] || 143}
          </span>
          <span className="text-[11px] font-mono text-slate-500 mt-1 block">88.3% of Monitoring Network</span>
        </div>

        <div className="glass-panel p-5 rounded-xl border-t-2 border-t-amber-500">
          <span className="text-xs font-mono text-slate-400 block">ELEVATED RISK SAMPLES</span>
          <span className="text-3xl font-mono font-bold text-amber-400 mt-1 block">
            {data?.class_distribution?.['0'] || 19}
          </span>
          <span className="text-[11px] font-mono text-slate-500 mt-1 block">11.7% Exceeding CPCB Class-C</span>
        </div>

        <div className="glass-panel p-5 rounded-xl border-t-2 border-t-purple-500">
          <span className="text-xs font-mono text-slate-400 block">MISSING FIELD VALUES</span>
          <span className="text-3xl font-mono font-bold text-purple-300 mt-1 block">
            {data?.total_missing || 333}
          </span>
          <span className="text-[11px] font-mono text-slate-500 mt-1 block">Handled by Imputation Engine</span>
        </div>
      </div>

      {/* Feature & Quality Standards Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-xl space-y-4">
          <h3 className="font-mono text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" /> Engineered ML Feature Dimensions
          </h3>
          <p className="text-xs font-mono text-slate-400">
            Raw CPCB minimum and maximum measurements are consolidated into continuous biological & chemical features:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
            {[
              'Dissolved_Oxygen',
              'BOD',
              'pH',
              'Temperature',
              'Conductivity',
              'NitrateN',
              'Fecal_Coliform',
              'Total_Coliform',
              'Fecal_Strep',
            ].map((f) => (
              <div key={f} className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-slate-300">
                <span className="text-cyan-400 font-semibold block">{f}</span>
                <span className="text-[10px] text-slate-500">Continuous Float</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl space-y-4">
          <h3 className="font-mono text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-cyan-400" /> Water Body Classification Archetypes
          </h3>
          <p className="text-xs font-mono text-slate-400">
            Sampling locations span diverse aquatic ecosystems across India:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
            {[
              { type: 'RIVER', count: '48 Stations' },
              { type: 'LAKE & BEEL', count: '22 Stations' },
              { type: 'TEMPLE POND', count: '28 Stations' },
              { type: 'COASTAL BEACH', count: '18 Stations' },
              { type: 'IRRIGATION CANAL', count: '16 Stations' },
              { type: 'URBAN DRAIN / STP', count: '30 Stations' },
            ].map((item) => (
              <div key={item.type} className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-white font-bold block">{item.type}</span>
                <span className="text-[10px] text-emerald-400">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dataset Filter & Explorer Table */}
      <div className="glass-panel p-6 rounded-xl space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-mono text-base font-bold text-cyan-400 uppercase tracking-wider">
              Monitoring Station Telemetry Explorer
            </h3>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Showing {filteredRows.length} field stations matching active criteria
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search river or station..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* State Filter */}
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-3 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All States</option>
              {data?.states?.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              )) || (
                <>
                  <option value="JHARKHAND">JHARKHAND</option>
                  <option value="HIMACHAL PRADESH">HIMACHAL PRADESH</option>
                  <option value="ANDHRA PRADESH">ANDHRA PRADESH</option>
                  <option value="ASSAM">ASSAM</option>
                  <option value="GOA">GOA</option>
                  <option value="MADHYA PRADESH">MADHYA PRADESH</option>
                </>
              )}
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Water Bodies</option>
              <option value="RIVER">RIVER</option>
              <option value="BEACH">BEACH</option>
              <option value="CANAL">CANAL</option>
              <option value="LAKE">LAKE</option>
              <option value="DRAIN">DRAIN</option>
              <option value="STP">STP</option>
            </select>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                <th className="pb-3 pr-4">STN</th>
                <th className="pb-3 pr-4">Monitoring Location</th>
                <th className="pb-3 pr-4">State</th>
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">pH</th>
                <th className="pb-3 pr-4">DO (mg/L)</th>
                <th className="pb-3 pr-4">BOD (mg/L)</th>
                <th className="pb-3">Water Quality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRows.map((row) => (
                <tr key={row.stn} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 pr-4 text-cyan-400 font-semibold">{row.stn}</td>
                  <td className="py-3 pr-4 text-slate-200 max-w-xs truncate">{row.loc}</td>
                  <td className="py-3 pr-4 text-slate-400">{row.state}</td>
                  <td className="py-3 pr-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                      {row.type}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-slate-300">{row.ph}</td>
                  <td className="py-3 pr-4 text-slate-300">{row.do}</td>
                  <td className="py-3 pr-4 text-slate-300">{row.bod}</td>
                  <td className="py-3">
                    {row.status === 'Good' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Good Quality
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5" /> Poor / Risk
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dataset;
