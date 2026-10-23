import React from 'react';
import { TrustScorecard as TrustScorecardType } from '../../lib/types';
import {
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Database,
  Lock,
  Coins,
  Plane,
} from 'lucide-react';

interface TrustScorecardProps {
  scorecard: TrustScorecardType;
}

export const TrustScorecard: React.FC<TrustScorecardProps> = ({ scorecard }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-100 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          Enterprise Data Trust & Compliance Scorecard
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Quantified integrity metrics across Emirates Group master data, regulatory flight safety standards, and financial controls
        </p>
      </div>

      {/* Main KPI Quad Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Trust */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Overall Data Trust</span>
            <Database className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold text-slate-100 tabular-nums">
              {scorecard.overallTrustScore}%
            </span>
            <span className="text-xs text-slate-400">Fidelity</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${scorecard.overallTrustScore}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400">
            Based on 5 core master integrity invariants
          </div>
        </div>

        {/* GCAA Aviation Safety */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>GCAA Aviation Readiness</span>
            <Plane className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-mono font-bold tabular-nums ${
              scorecard.gcaaAviationReadiness < 95 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {scorecard.gcaaAviationReadiness}%
            </span>
            <span className="text-xs text-slate-400">CAR-OPS 1</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${scorecard.gcaaAviationReadiness}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400">
            Flight deck & maintenance certifications
          </div>
        </div>

        {/* SOX Financial Control */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>SOX Financial Control</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-mono font-bold tabular-nums ${
              scorecard.soxFinancialControlScore < 95 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {scorecard.soxFinancialControlScore}%
            </span>
            <span className="text-xs text-slate-400">WPS & GL</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${scorecard.soxFinancialControlScore}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400">
            Currency validity & ghost disbursal audit
          </div>
        </div>

        {/* Airside Cyber Security */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Airside & Cyber Security</span>
            <Lock className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-mono font-bold tabular-nums ${
              scorecard.airsideCyberSecurityScore < 95 ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {scorecard.airsideCyberSecurityScore}%
            </span>
            <span className="text-xs text-slate-400">ICAO Annex 17</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-red-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${scorecard.airsideCyberSecurityScore}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400">
            Separated employee badge revocation SLA
          </div>
        </div>
      </div>

      {/* System-to-System Consistency Index */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400" />
          System-to-System Cross-Boundary Synchronization Index
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">Core HR ⟷ SAP Payroll</span>
              <span className="font-mono font-bold text-slate-100 tabular-nums">
                {scorecard.systemConsistency.coreHrToPayroll}%
              </span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-sky-500 h-full rounded-full"
                style={{ width: `${scorecard.systemConsistency.coreHrToPayroll}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400">
              Evaluates status synchronization, currency integrity, and cost center attribution.
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">Core HR ⟷ Dubai Pass Office (DASS)</span>
              <span className="font-mono font-bold text-slate-100 tabular-nums">
                {scorecard.systemConsistency.coreHrToAccessDirectory}%
              </span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-red-500 h-full rounded-full"
                style={{ width: `${scorecard.systemConsistency.coreHrToAccessDirectory}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400">
              Evaluates instant de-provisioning of airside passes and privileged cloud admin roles.
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-medium">Core HR ⟷ Aviation Safety LMS</span>
              <span className="font-mono font-bold text-slate-100 tabular-nums">
                {scorecard.systemConsistency.coreHrToLearning}%
              </span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full"
                style={{ width: `${scorecard.systemConsistency.coreHrToLearning}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400">
              Evaluates active flight deck type ratings, LPC checks, and Part-145 certifications.
            </div>
          </div>
        </div>
      </div>

      {/* Field-by-Field Integrity Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">
            Field-Level Master Data Integrity Breakdown
          </h3>
          <span className="text-xs font-mono text-slate-400">
            Total Monitored Employees: {scorecard.totalMonitoredEmployees}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Monitored Invariant Field</th>
                <th className="py-2.5 px-4">Audited Systems</th>
                <th className="py-2.5 px-4 text-right">Total Inspected</th>
                <th className="py-2.5 px-4 text-right">Valid Records</th>
                <th className="py-2.5 px-4 text-right">Anomalies</th>
                <th className="py-2.5 px-4 text-right">Integrity Index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {scorecard.fieldMetrics.map((fm) => (
                <tr key={fm.field} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-slate-200">
                    {fm.field}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {fm.sourceSystem}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-300">
                    {fm.totalRecords}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-300">
                    {fm.matchedRecords}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums">
                    <span className={`px-2 py-0.5 rounded ${
                      fm.anomalyCount > 0 ? 'bg-red-950/80 text-red-300 font-semibold' : 'text-slate-500'
                    }`}>
                      {fm.anomalyCount}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                    <span className={fm.integrityPct >= 95 ? 'text-emerald-400' : fm.integrityPct >= 80 ? 'text-amber-400' : 'text-red-400'}>
                      {fm.integrityPct}%
                    </span>
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
