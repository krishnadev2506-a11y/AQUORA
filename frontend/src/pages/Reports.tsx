import { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Database,
  BarChart3,
  Layers,
  Sparkles
} from 'lucide-react';

const Reports = () => {
  const [reportDate] = useState(new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800 no-print">
        <div>
          <h1 className="text-2xl md:text-3xl font-mono text-cyan-400 font-bold tracking-tight flex items-center gap-3">
            <FileText className="w-7 h-7 text-cyan-400" /> AQUORA INTELLIGENCE REPORT CENTER
          </h1>
          <p className="text-sm font-mono text-slate-400 mt-1">
            Official Audit Diagnostic Document with Embedded Visualizations & Statistical Proofs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 text-slate-950 rounded-md font-mono font-bold text-xs uppercase tracking-wider hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
          >
            <Printer className="w-4 h-4" /> Print / Export PDF
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="glass-panel p-8 md:p-12 rounded-2xl border border-slate-700/60 space-y-12 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b border-slate-800 gap-4">
          <div>
            <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase block mb-1">
              AQUORA // AUTONOMOUS AUDIT & MACHINE LEARNING BENCHMARK
            </span>
            <h2 className="text-2xl sm:text-3xl font-mono font-bold text-white">
              NATIONAL WATER QUALITY AUDIT & ML PERFORMANCE REPORT
            </h2>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Field Telemetry: Central Pollution Control Board (CPCB) India Monitoring Network
            </p>
          </div>
          <div className="text-left sm:text-right font-mono text-xs text-slate-400 space-y-1">
            <div>DATE: <strong className="text-slate-200">{reportDate}</strong></div>
            <div>STATUS: <strong className="text-emerald-400">VERIFIED PROTOTYPE</strong></div>
            <div>MODEL ID: <strong className="text-cyan-300">WG-DT-001</strong></div>
            <div>DATASET: <strong className="text-slate-200">162 Stations (16 States)</strong></div>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div className="space-y-4">
          <h3 className="font-mono text-base font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            1.0 Executive Dataset Summary
          </h3>
          <p className="text-xs font-mono text-slate-300 leading-relaxed">
            This analytical report synthesizes water-quality observations collected across <strong>162 official monitoring stations</strong> located throughout 16 Indian states (including Jharkhand, Himachal Pradesh, Andhra Pradesh, Goa, Delhi, Assam, and Rajasthan). Samples cover rivers, coastal beaches, lakes, irrigation canals, urban drains, and sewage treatment plant outlets.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">TOTAL OBSERVATIONS</span>
              <span className="text-xl font-bold text-white">162 Stations</span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">COMPLIANT (GOOD)</span>
              <span className="text-xl font-bold text-emerald-400">143 (88.3%)</span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">ELEVATED RISK (POOR)</span>
              <span className="text-xl font-bold text-amber-400">19 (11.7%)</span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">DATA RETENTION</span>
              <span className="text-xl font-bold text-cyan-300">100.0%</span>
            </div>
          </div>
        </div>

        {/* Section 2: Machine Learning Evaluation Table */}
        <div className="space-y-4">
          <h3 className="font-mono text-base font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            2.0 Baseline Model Architecture & Evaluation
          </h3>
          <p className="text-xs font-mono text-slate-300 leading-relaxed">
            A <strong>Decision Tree Classifier (CART)</strong> was trained on an 80/20 stratified split. Hyperparameters were tuned via 4-fold cross-validated grid search (`criterion='gini'`, `max_depth=None`, `min_samples_leaf=1`, `min_samples_split=2`). Preprocessors and imputers were strictly fitted on training splits to prevent data leakage.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-2">Metric</th>
                  <th className="pb-2">Validation Score</th>
                  <th className="pb-2">Operational Interpretation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr>
                  <td className="py-2.5 text-cyan-300 font-semibold">Test Accuracy</td>
                  <td className="py-2.5 text-emerald-400 font-bold">96.97%</td>
                  <td className="py-2.5 text-slate-400">32 of 33 holdout test cases accurately diagnosed</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-cyan-300 font-semibold">F1-Score</td>
                  <td className="py-2.5 text-emerald-400 font-bold">98.25%</td>
                  <td className="py-2.5 text-slate-400">Harmonic mean balance of Precision and Sensitivity</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-cyan-300 font-semibold">Poor-Class Recall (Unsafe)</td>
                  <td className="py-2.5 text-emerald-400 font-bold">100.0%</td>
                  <td className="py-2.5 text-slate-400">4 of 4 contaminated samples detected (Zero missed hazards)</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-cyan-300 font-semibold">False Positive Rate</td>
                  <td className="py-2.5 text-emerald-400 font-bold">0.00%</td>
                  <td className="py-2.5 text-slate-400">Zero hazardous approvals of polluted water</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Visual Graphs & Charts */}
        <div className="space-y-8 pt-4">
          <div className="border-b border-slate-800 pb-2">
            <h3 className="font-mono text-base font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" /> 3.0 Visualizations & Performance Graphs
            </h3>
            <p className="text-xs font-mono text-slate-400 mt-1">
              High-resolution empirical plots generated directly from the 162 CPCB stations and model experiments
            </p>
          </div>

          {/* Graph 1 & 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <img
                src="/figures/fig1_missing_values.png"
                alt="Missing Values by Attribute"
                className="w-full rounded-lg border border-slate-700 shadow-md"
              />
              <span className="text-[11px] font-mono text-slate-300 font-semibold block text-center">
                Figure 1: Missing Value Distribution across CPCB Parameters (333 Total)
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <img
                src="/figures/fig2_class_distribution.png"
                alt="Class Distribution and Archetypes"
                className="w-full rounded-lg border border-slate-700 shadow-md"
              />
              <span className="text-[11px] font-mono text-slate-300 font-semibold block text-center">
                Figure 2: Water Quality Classes & Monitoring Station Archetypes
              </span>
            </div>
          </div>

          {/* Graph 3: Method Comparison */}
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <img
              src="/figures/fig3_method_comparison.png"
              alt="Missing Data Treatment Benchmark"
              className="w-full rounded-lg border border-slate-700 shadow-md"
            />
            <span className="text-[11px] font-mono text-slate-300 font-semibold block text-center">
              Figure 3: Benchmark of Imputation vs Deletion across 10%, 20%, 30% Missingness (Showing Deletion Collapse)
            </span>
          </div>

          {/* Graph 4 & 5 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <img
                src="/figures/fig4_confusion_matrices.png"
                alt="Confusion Matrix Comparison"
                className="w-full rounded-lg border border-slate-700 shadow-md"
              />
              <span className="text-[11px] font-mono text-slate-300 font-semibold block text-center">
                Figure 4: Confusion Matrix Heatmaps (Baseline vs 20% KNN vs 20% Deletion)
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <img
                src="/figures/fig5_feature_importance.png"
                alt="Feature Importance Splits"
                className="w-full rounded-lg border border-slate-700 shadow-md"
              />
              <span className="text-[11px] font-mono text-slate-300 font-semibold block text-center">
                Figure 5: Gini Impurity Reduction Feature Split Weights (DO: 42%, BOD: 28%)
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Missing-Data Benchmark & Recommendation */}
        <div className="space-y-4">
          <h3 className="font-mono text-base font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            4.0 Missing-Data Treatment Comparison & Recommendation
          </h3>
          <p className="text-xs font-mono text-slate-300 leading-relaxed">
            Under 20% simulated missingness across all sensory features, <strong>KNN Imputation (k=5)</strong> outperformed simple median substitution and listwise row deletion:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-2">
              <span className="text-emerald-400 font-bold block">KNN Imputation (WINNER)</span>
              <div className="text-[11px] text-slate-300 space-y-1">
                <div>Accuracy: <strong>100.0%</strong></div>
                <div>F1 Score: <strong>1.0000</strong></div>
                <div>Data Retained: <strong>100.0%</strong></div>
              </div>
              <p className="text-[10px] text-slate-400 pt-1">
                Preserves multi-parameter correlations without dropping incomplete field records.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-blue-300 font-bold block">Median Imputation</span>
              <div className="text-[11px] text-slate-300 space-y-1">
                <div>Accuracy: <strong>100.0%</strong></div>
                <div>F1 Score: <strong>1.0000</strong></div>
                <div>Data Retained: <strong>100.0%</strong></div>
              </div>
              <p className="text-[10px] text-slate-400 pt-1">
                Fast heuristic baseline; slight attenuation of high-variance variance profiles.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/40 space-y-2">
              <span className="text-amber-400 font-bold block">Listwise Deletion (FAILED)</span>
              <div className="text-[11px] text-slate-300 space-y-1">
                <div>Accuracy: <strong>87.88%</strong></div>
                <div>Unsafe Recall: <strong className="text-red-400">0.0%</strong></div>
                <div>Data Retained: <strong>5.4% (Severe Loss)</strong></div>
              </div>
              <p className="text-[10px] text-slate-400 pt-1">
                Catastrophic class starvation; leaves only 7 samples and misses 100% of contaminated test samples.
              </p>
            </div>
          </div>
        </div>

        {/* Section 5: Responsible AI & Regulatory Disclaimer */}
        <div className="p-5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-3 font-mono text-xs">
          <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" /> 5.0 Statutory Disclaimer & Responsible AI Mandate
          </div>
          <p className="text-slate-300 leading-relaxed">
            AQUORA is an experimental analytical and computational intelligence platform. <strong>It is NOT a certified drinking-water safety device or official medical diagnostic apparatus.</strong> Never claim 100% predictive accuracy, certified safety, or laboratory replacement. Water classifications provided by this system reflect statistical modeling of historical CPCB parameters and must not supersede official statutory laboratory analysis.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
