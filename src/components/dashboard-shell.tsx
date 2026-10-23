import React from 'react';
import { UserRole, TrustScorecard } from '../../lib/types';
import {
  ShieldCheck,
  Plane,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  BarChart3,
  Network,
  Search,
  History,
  FileSpreadsheet,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface DashboardShellProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeTab: 'triage' | 'impact' | 'trust' | 'query' | 'audit' | 'datasets';
  onTabChange: (tab: 'triage' | 'impact' | 'trust' | 'query' | 'audit' | 'datasets') => void;
  scorecard: TrustScorecard | null;
  onRunReconciliation: () => void;
  onResetSimulation: () => void;
  isReconciling: boolean;
  children: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  currentRole,
  onRoleChange,
  activeTab,
  onTabChange,
  scorecard,
  onRunReconciliation,
  onResetSimulation,
  isReconciling,
  children,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Contract: 3 Zones strictly separated */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Title (Single line wordmark) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-red-600/90 flex items-center justify-center text-white font-bold shadow-md shadow-red-950/50">
            <Plane className="w-4 h-4 text-white -rotate-45" />
          </div>
          <div>
            <span className="text-base font-semibold tracking-tight text-white whitespace-nowrap">
              Emirates Group
            </span>
            <span className="text-slate-400 font-normal ml-2 text-xs hidden sm:inline whitespace-nowrap">
              HR Cognitive Reconciliation
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (single-line, clean) */}
        <nav className="hidden md:flex items-center gap-1 shrink-0 bg-slate-950/60 p-1 rounded-lg border border-slate-800/60 text-xs">
          <button
            onClick={() => onTabChange('triage')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'triage'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Issue Triage
            {scorecard && scorecard.criticalIssuesCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-red-950 text-red-300 border border-red-800 rounded font-mono">
                {scorecard.criticalIssuesCount}
              </span>
            )}
          </button>
          <button
            onClick={() => onTabChange('impact')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'impact'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-sky-400" />
            Downstream Impact
          </button>
          <button
            onClick={() => onTabChange('trust')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'trust'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            Trust Scorecard
          </button>
          <button
            onClick={() => onTabChange('query')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'query'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-purple-400" />
            Oracle Query
          </button>
          <button
            onClick={() => onTabChange('audit')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5 text-slate-300" />
            Audit Trail
          </button>
          <button
            onClick={() => onTabChange('datasets')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'datasets'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
            Datasets
          </button>
        </nav>

        {/* Zone 3: Primary Actions and Role Selector */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Role Selection Segment */}
          <div className="hidden lg:flex items-center bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 text-xs">
            {(['Data Steward', 'Analytics Lead', 'Systems Owner'] as UserRole[]).map((role) => (
              <button
                key={role}
                onClick={() => onRoleChange(role)}
                className={`px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap ${
                  currentRole === role
                    ? 'bg-red-700 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <button
            onClick={onRunReconciliation}
            disabled={isReconciling}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isReconciling ? 'animate-spin' : ''}`} />
            {isReconciling ? 'Reconciling...' : 'Run Pipeline'}
          </button>
        </div>
      </header>

      {/* KPI Global Health Banner */}
      {scorecard && (
        <section className="bg-slate-900/60 border-b border-slate-800/80 px-6 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-6 overflow-x-auto py-1">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Data Trust Score:</span>
                <span className="font-mono tabular-nums font-semibold text-sm text-slate-100">
                  {scorecard.overallTrustScore}%
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {scorecard.overallTrustScore >= 80 ? '✓ Nominal' : '⚠ Audit Defect'}
                </span>
              </div>
              <span className="text-slate-700 hidden sm:inline">|</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">GCAA Safety Index:</span>
                <span className={`font-mono tabular-nums font-semibold text-sm ${
                  scorecard.gcaaAviationReadiness < 95 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {scorecard.gcaaAviationReadiness}%
                </span>
              </div>
              <span className="text-slate-700 hidden sm:inline">|</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">SOX Payroll Control:</span>
                <span className={`font-mono tabular-nums font-semibold text-sm ${
                  scorecard.soxFinancialControlScore < 95 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {scorecard.soxFinancialControlScore}%
                </span>
              </div>
              <span className="text-slate-700 hidden sm:inline">|</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Airside Cyber Security:</span>
                <span className={`font-mono tabular-nums font-semibold text-sm ${
                  scorecard.airsideCyberSecurityScore < 95 ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  {scorecard.airsideCyberSecurityScore}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-mono text-[11px]">
                Active Role: <span className="text-red-300 font-semibold">{currentRole}</span>
              </span>
              <button
                onClick={onResetSimulation}
                title="Reset simulation to initial state"
                className="text-slate-400 hover:text-slate-200 transition-colors p-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {children}
      </main>

      {/* Clean Enterprise Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span>Emirates Group Aviation & Corporate Systems</span>
          <span className="mx-2">·</span>
          <span>Core HR · SAP S/4HANA Payroll · Aviation College LMS · Dubai Airports DASS</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>Confidential & Proprietary</span>
          <span>·</span>
          <span>GCAA CAR-OPS & UAE WPS Protected</span>
        </div>
      </footer>
    </div>
  );
};
