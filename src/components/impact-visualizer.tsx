import React, { useState } from 'react';
import { Discrepancy } from '../../lib/types';
import {
  Network,
  Clock,
  AlertOctagon,
  ArrowRight,
  ShieldAlert,
  Coins,
  Building,
  Plane,
  Lock,
  Layers,
  FileText,
} from 'lucide-react';

interface ImpactVisualizerProps {
  discrepancies: Discrepancy[];
  selectedDiscrepancyId?: string | null;
  onSelectDiscrepancy: (id: string) => void;
  onOpenApprovalModal: (disc: Discrepancy) => void;
}

export const ImpactVisualizer: React.FC<ImpactVisualizerProps> = ({
  discrepancies,
  selectedDiscrepancyId,
  onSelectDiscrepancy,
  onOpenApprovalModal,
}) => {
  const [activeSystemFilter, setActiveSystemFilter] = useState<string>('all');

  const selectedDisc = discrepancies.find((d) => d.id === selectedDiscrepancyId) || discrepancies[0];

  const totalFinancialExposure = discrepancies
    .filter((d) => d.status !== 'approved')
    .reduce((acc, d) => acc + d.downstreamImpact.financialExposureAED, 0);

  const downstreamNodes = [
    {
      id: 'jeppesen',
      name: 'Jeppesen Flight Crew Rostering',
      type: 'Aviation Operations',
      deadline: 'Daily Roster Lock (02:00 UTC)',
      urgency: 'Immediate (8 hrs)',
      icon: <Plane className="w-4 h-4 text-amber-400" />,
      affectedDiscs: discrepancies.filter((d) =>
        d.downstreamImpact.affectedSystems.some((s) => s.toLowerCase().includes('jeppesen') || s.toLowerCase().includes('flight'))
      ),
    },
    {
      id: 'wps-payroll',
      name: 'UAE Central Bank WPS & SAP Payroll',
      type: 'Financial & Regulatory',
      deadline: 'Monthly Run Cutoff (Oct 25 18:00 GST)',
      urgency: '2 Days Remaining',
      icon: <Coins className="w-4 h-4 text-emerald-400" />,
      affectedDiscs: discrepancies.filter((d) =>
        d.downstreamImpact.affectedSystems.some((s) => s.toLowerCase().includes('wps') || s.toLowerCase().includes('payroll'))
      ),
    },
    {
      id: 'dass-airside',
      name: 'Dubai Airports Pass Office (DASS)',
      type: 'National & Physical Security',
      deadline: 'SLA: Instant (<60 mins after exit)',
      urgency: 'CRITICAL OVERDUE',
      icon: <Lock className="w-4 h-4 text-red-400" />,
      affectedDiscs: discrepancies.filter((d) =>
        d.downstreamImpact.affectedSystems.some((s) => s.toLowerCase().includes('pass') || s.toLowerCase().includes('airside') || s.toLowerCase().includes('turnstiles'))
      ),
    },
    {
      id: 'engineering-car145',
      name: 'Aircraft Maintenance Release (CAR-145)',
      type: 'Airworthiness & Engineering',
      deadline: 'Pre-flight Signoff Gate',
      urgency: 'Per Flight Dispatch',
      icon: <ShieldAlert className="w-4 h-4 text-orange-400" />,
      affectedDiscs: discrepancies.filter((d) =>
        d.category === 'Flight Operations & Safety' && d.title.toLowerCase().includes('engineer')
      ),
    },
    {
      id: 'intercompany-ledger',
      name: 'SAP CO-CCA Intercompany Ledger',
      type: 'Managerial Accounting',
      deadline: 'Month-end Ledger Close (Oct 31)',
      urgency: '8 Days Remaining',
      icon: <Building className="w-4 h-4 text-blue-400" />,
      affectedDiscs: discrepancies.filter((d) =>
        d.category === 'Cost Center Misalignment'
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 tracking-tight flex items-center gap-2">
            <Network className="w-5 h-5 text-sky-400" />
            Downstream Impact & Blast Radius Analyzer
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Predictive modeling of operational disruptions, flight grounding hazards, and financial exposure prior to data remediation
          </p>
        </div>

        {/* Global Financial Exposure Metric */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 flex items-center gap-4">
          <div>
            <div className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">
              Aggregate Unresolved Exposure
            </div>
            <div className="text-lg font-mono font-bold text-amber-400 tabular-nums">
              AED {totalFinancialExposure.toLocaleString()}
            </div>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div>
            <div className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">
              Imminent Deadlines
            </div>
            <div className="text-xs font-mono font-medium text-red-400">
              2 Systems &lt; 48 Hrs
            </div>
          </div>
        </div>
      </div>

      {/* Downstream Systems Topology Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {downstreamNodes.map((node) => {
          const hasIssues = node.affectedDiscs.length > 0;
          return (
            <div
              key={node.id}
              className={`p-4 rounded-xl border transition-all ${
                hasIssues
                  ? 'bg-slate-900/80 border-slate-700/80 shadow-md'
                  : 'bg-slate-900/40 border-slate-800/60 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-slate-800 border border-slate-700">
                    {node.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">{node.name}</h4>
                    <span className="text-[10px] text-slate-400">{node.type}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                  node.urgency.includes('CRITICAL') || node.urgency.includes('Immediate')
                    ? 'bg-red-950 text-red-300 border-red-800'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {node.urgency}
                </span>
              </div>

              <div className="text-xs text-slate-400 space-y-1 mt-3 pt-3 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span>Operational Trigger:</span>
                  <span className="text-slate-300 font-mono text-[11px]">{node.deadline}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Impacted Entities:</span>
                  <span className="font-mono font-semibold text-slate-200">
                    {node.affectedDiscs.length} Discrepanc{node.affectedDiscs.length === 1 ? 'y' : 'ies'}
                  </span>
                </div>
              </div>

              {hasIssues && (
                <div className="mt-3 space-y-1.5">
                  <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">
                    Target Impacted Records:
                  </span>
                  <div className="space-y-1">
                    {node.affectedDiscs.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => onSelectDiscrepancy(d.id)}
                        className={`w-full text-left p-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                          selectedDisc?.id === d.id
                            ? 'bg-red-950/60 border border-red-800 text-red-200'
                            : 'bg-slate-950/60 hover:bg-slate-800/60 text-slate-300 border border-slate-800/80'
                        }`}
                      >
                        <span className="truncate pr-2 font-medium">{d.employeeName}</span>
                        <span className="font-mono text-[10px] text-slate-400 shrink-0">
                          {d.severity}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Deep Blast Radius Detail Card */}
      {selectedDisc && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-mono text-red-400 uppercase tracking-wider">
                Selected Blast Radius Focus
              </span>
              <h3 className="text-base font-semibold text-slate-100 mt-0.5">
                {selectedDisc.title}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Subject: <strong className="text-slate-200">{selectedDisc.employeeName}</strong> ({selectedDisc.entityId})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenApprovalModal(selectedDisc)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors whitespace-nowrap"
              >
                Launch Staged Remediation
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-2">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Deadlines & Urgency
              </span>
              <div className="text-slate-200 font-mono">
                {selectedDisc.downstreamImpact.deadlineNotice}
              </div>
              <div className="text-[11px] text-slate-400">
                Action Urgency Window:{' '}
                <strong className="text-amber-300 font-mono">
                  {selectedDisc.downstreamImpact.urgencyDays === 0
                    ? 'Immediate (Within 60 mins)'
                    : `${selectedDisc.downstreamImpact.urgencyDays} Days Remaining`}
                </strong>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-2">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-400" />
                Financial Exposure
              </span>
              <div className="text-slate-200 font-mono text-base font-bold tabular-nums">
                AED {selectedDisc.downstreamImpact.financialExposureAED.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400">
                Direct payroll leakage, regulatory penalty fines, or operational flight delay costs.
              </div>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-2">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                Regulatory Infractions
              </span>
              <ul className="text-red-300 text-[11px] space-y-1 list-disc list-inside">
                {selectedDisc.downstreamImpact.regulatoryInfractions.map((reg, idx) => (
                  <li key={idx}>{reg}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Step-by-Step Simulated Remediation Chain */}
          <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-800/80">
            <h4 className="text-xs font-semibold uppercase font-mono tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              Simulated Remediation Blast Sequence
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="font-mono text-slate-400 text-[11px] mb-1">1. Proposed Fix</div>
                <div className="text-slate-200 font-medium">
                  {selectedDisc.suggestedFix.actionType}
                </div>
                <div className="text-slate-400 text-[11px] mt-1">
                  Target: {selectedDisc.suggestedFix.targetSystem} ({selectedDisc.suggestedFix.targetField} → {String(selectedDisc.suggestedFix.proposedValue)})
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="font-mono text-slate-400 text-[11px] mb-1">2. Downstream Interception</div>
                <div className="text-slate-200 font-medium">
                  Prevents Fault Propagation
                </div>
                <div className="text-slate-400 text-[11px] mt-1">
                  Locks record before {selectedDisc.downstreamImpact.affectedSystems[0]} consumes bad data.
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="font-mono text-slate-400 text-[11px] mb-1">3. Rollback & Audit Safety</div>
                <div className="text-slate-200 font-medium">
                  Reversible via Audit Ledger
                </div>
                <div className="text-slate-400 text-[11px] mt-1">
                  Creates immutable timestamped hash before executing transaction.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
