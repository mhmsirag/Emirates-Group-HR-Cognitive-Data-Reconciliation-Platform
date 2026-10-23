import React, { useState } from 'react';
import { Discrepancy, DiscrepancySeverity, DiscrepancyCategory, UserRole } from '../../lib/types';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Coins,
  Building2,
  UserX,
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';

interface IssueTriageTableProps {
  discrepancies: Discrepancy[];
  onSelectForApproval: (discrepancy: Discrepancy) => void;
  onQuickStage: (discrepancy: Discrepancy) => void;
  onExplainWithAI: (discrepancy: Discrepancy) => void;
  onNavigateToImpact: (discrepancyId: string) => void;
  currentRole: UserRole;
  isExplainingId: string | null;
}

export const IssueTriageTable: React.FC<IssueTriageTableProps> = ({
  discrepancies,
  onSelectForApproval,
  onQuickStage,
  onExplainWithAI,
  onNavigateToImpact,
  currentRole,
  isExplainingId,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredDiscrepancies = discrepancies.filter((d) => {
    if (selectedSeverity !== 'all' && d.severity !== selectedSeverity) return false;
    if (selectedCategory !== 'all' && d.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && d.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        d.employeeName.toLowerCase().includes(q) ||
        d.entityId.toLowerCase().includes(q) ||
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const getSeverityBadge = (severity: DiscrepancySeverity) => {
    switch (severity) {
      case 'Critical':
        return (
          <span className="font-mono text-xs font-semibold text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
            CRITICAL
          </span>
        );
      case 'High':
        return (
          <span className="font-mono text-xs font-semibold text-amber-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            HIGH
          </span>
        );
      case 'Medium':
        return (
          <span className="font-mono text-xs font-semibold text-blue-400 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="font-mono text-xs font-semibold text-slate-400 flex items-center gap-1">
            LOW
          </span>
        );
    }
  };

  const getCategoryIcon = (category: DiscrepancyCategory) => {
    switch (category) {
      case 'Flight Operations & Safety':
        return <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'Airside Security & Cyber Privilege':
        return <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />;
      case 'Payroll & Financial Integrity':
        return <Coins className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'Cost Center Misalignment':
        return <Building2 className="w-4 h-4 text-blue-400 shrink-0" />;
      case 'Ghost Employee / Unmatched Record':
        return <UserX className="w-4 h-4 text-purple-400 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 tracking-tight">
            Cognitive Discrepancy Triage
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ranked anomaly queue cross-referencing Core HR, SAP Payroll, Aviation LMS, and Dubai Airports Pass Office
          </p>
        </div>

        {/* Search */}
        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Search employee, ID, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-600"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
        <div className="flex items-center gap-1 text-slate-400 mr-2">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        {/* Severity */}
        <div className="flex items-center gap-1">
          {['all', 'Critical', 'High', 'Medium'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                selectedSeverity === sev
                  ? 'bg-slate-800 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev === 'all' ? 'All Severities' : sev}
            </button>
          ))}
        </div>

        <span className="text-slate-700 mx-1">|</span>

        {/* Status */}
        <div className="flex items-center gap-1">
          {[
            { id: 'all', label: 'All Status' },
            { id: 'unresolved', label: 'Unresolved' },
            { id: 'staged', label: 'Staged' },
            { id: 'approved', label: 'Resolved' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStatus(st.id)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                selectedStatus === st.id
                  ? 'bg-slate-800 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Discrepancy List */}
      <div className="space-y-3">
        {filteredDiscrepancies.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-slate-800/80">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-slate-200">No Discrepancies Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              All multi-system records in this filter set are synchronized and compliant.
            </p>
          </div>
        ) : (
          filteredDiscrepancies.map((disc) => {
            const isExpanded = expandedId === disc.id;
            const isExplaining = isExplainingId === disc.id;

            return (
              <div
                key={disc.id}
                className={`bg-slate-900/70 border rounded-xl transition-all duration-150 overflow-hidden ${
                  disc.status === 'approved'
                    ? 'border-emerald-900/60 bg-emerald-950/10'
                    : disc.severity === 'Critical'
                    ? 'border-red-900/70 shadow-sm shadow-red-950/20'
                    : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Main Card Row */}
                <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    {/* Top Metadata Line */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {getSeverityBadge(disc.severity)}
                      <span className="text-slate-600">·</span>
                      <div className="flex items-center gap-1 text-slate-300">
                        {getCategoryIcon(disc.category)}
                        <span>{disc.category}</span>
                      </div>
                      <span className="text-slate-600">·</span>
                      <span className="font-mono text-slate-400">
                        Risk Score: <strong className="text-slate-200">{disc.businessRiskScore}/100</strong>
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="font-mono text-slate-400">
                        Exposure: <strong className="text-amber-300">AED {disc.downstreamImpact.financialExposureAED.toLocaleString()}</strong>
                      </span>
                      {disc.status === 'staged' && (
                        <span className="text-sky-400 font-mono text-[11px] bg-sky-950/80 border border-sky-800 px-2 py-0.5 rounded">
                          STAGED FOR APPROVAL
                        </span>
                      )}
                      {disc.status === 'approved' && (
                        <span className="text-emerald-400 font-mono text-[11px] bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                          RESOLVED & AUDITED
                        </span>
                      )}
                    </div>

                    {/* Title & Subject */}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                        {disc.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Target Employee: <strong className="text-slate-200 font-medium">{disc.employeeName}</strong>{' '}
                        <span className="font-mono text-slate-500">({disc.entityId})</span>
                        <span className="mx-2 text-slate-600">|</span>
                        <span>{disc.description}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-2 shrink-0 self-start lg:self-center">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : disc.id)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700/80 transition-colors whitespace-nowrap"
                    >
                      {isExpanded ? 'Hide Evidence' : 'Inspect Evidence'}
                    </button>

                    <button
                      onClick={() => onExplainWithAI(disc)}
                      disabled={isExplaining}
                      className="px-3 py-1.5 text-xs font-medium text-purple-300 hover:text-purple-100 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/80 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isExplaining ? 'animate-spin' : ''}`} />
                      {isExplaining ? 'Analyzing...' : 'AI Root Cause'}
                    </button>

                    {disc.status !== 'approved' && (
                      <button
                        onClick={() => onSelectForApproval(disc)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors whitespace-nowrap"
                      >
                        Remediate
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Multi-System Evidence Section */}
                {isExpanded && (
                  <div className="border-t border-slate-800/80 bg-slate-950/60 p-4 space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Multi-System Evidence Comparison
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {disc.evidence.map((ev, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-lg border text-xs ${
                              ev.statusIndicator === 'breach'
                                ? 'bg-red-950/30 border-red-800/80 text-red-200'
                                : ev.statusIndicator === 'invalid'
                                ? 'bg-amber-950/30 border-amber-800/80 text-amber-200'
                                : 'bg-slate-900 border-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="text-[11px] font-mono text-slate-400 mb-1 flex items-center justify-between">
                              <span>{ev.system}</span>
                              <span className="text-[10px] uppercase font-semibold">
                                {ev.statusIndicator || 'record'}
                              </span>
                            </div>
                            <div className="text-slate-400 text-[11px]">{ev.field}:</div>
                            <div className="font-mono font-medium text-slate-100 truncate mt-0.5" title={String(ev.value)}>
                              {String(ev.value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Cognitive Root Cause & Explanation */}
                    {disc.aiExplanation && (
                      <div className="p-3 bg-purple-950/20 border border-purple-900/50 rounded-lg text-xs space-y-1.5">
                        <div className="flex items-center gap-2 text-purple-300 font-semibold">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Gemini Cognitive Root Cause Analysis</span>
                        </div>
                        <p className="text-slate-300">{disc.aiExplanation}</p>
                        {disc.aiRootCause && (
                          <p className="text-slate-400 text-[11px]">
                            <strong className="text-purple-300">Technical Cause:</strong> {disc.aiRootCause}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Downstream Blast Radius & Recommended Fix */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-slate-900 text-xs">
                      <div className="space-y-1">
                        <div className="text-slate-400">
                          <strong className="text-slate-300">Affected Downstream:</strong>{' '}
                          {disc.downstreamImpact.affectedSystems.join(' · ')}
                        </div>
                        <div className="text-amber-400/90 text-[11px]">
                          <strong>Regulatory Infraction:</strong> {disc.downstreamImpact.regulatoryInfractions.join('; ')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onNavigateToImpact(disc.id)}
                          className="px-3 py-1 text-[11px] font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1"
                        >
                          <span>System Blast Radius Graph</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>

                        {disc.status === 'unresolved' && (
                          <button
                            onClick={() => onQuickStage(disc)}
                            className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                          >
                            Stage Fix
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
