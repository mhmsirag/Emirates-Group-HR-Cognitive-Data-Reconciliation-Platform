import React, { useState } from 'react';
import { Discrepancy, UserRole } from '../../lib/types';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  X,
  FileCheck,
  RotateCcw,
  Layers,
  ArrowRight,
  Lock,
} from 'lucide-react';

interface ApprovalModalProps {
  discrepancy: Discrepancy | null;
  onClose: () => void;
  onConfirmResolution: (payload: {
    discrepancyId: string;
    action: 'approve' | 'stage' | 'dismiss' | 'rollback';
    stewardName: string;
    stewardRole: string;
    comments: string;
  }) => Promise<void>;
  currentRole: UserRole;
  isSubmitting: boolean;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  discrepancy,
  onClose,
  onConfirmResolution,
  currentRole,
  isSubmitting,
}) => {
  if (!discrepancy) return null;

  const [stewardName, setStewardName] = useState<string>('M. Sirag');
  const [stewardRole, setStewardRole] = useState<string>(currentRole);
  const [comments, setComments] = useState<string>(
    `Remediation verified against source documentation. Approved ${discrepancy.suggestedFix.actionType} protocol.`
  );
  const [selectedAction, setSelectedAction] = useState<'approve' | 'stage' | 'dismiss' | 'rollback'>('approve');

  const handleAction = async () => {
    await onConfirmResolution({
      discrepancyId: discrepancy.id,
      action: selectedAction,
      stewardName,
      stewardRole,
      comments,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-950/80 border border-red-800 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                Human-in-the-Loop Remediation Review
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Staged resolution & downstream blast radius dry-run verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Target Issue Overview */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-mono text-[11px] text-red-400 font-semibold uppercase">
                {discrepancy.severity} Risk Anomaly
              </span>
              <span className="font-mono">{discrepancy.id}</span>
            </div>
            <div className="text-sm font-semibold text-slate-200">
              {discrepancy.title}
            </div>
            <p className="text-slate-400 text-[11px]">
              Target: <strong className="text-slate-200">{discrepancy.employeeName}</strong> ({discrepancy.entityId})
              <span className="mx-2 text-slate-600">·</span>
              Financial Exposure: <strong className="text-amber-300 font-mono">AED {discrepancy.downstreamImpact.financialExposureAED.toLocaleString()}</strong>
            </p>
          </div>

          {/* Dry Run Simulation Box */}
          <div className="bg-sky-950/20 border border-sky-900/60 p-3.5 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-sky-300 font-semibold uppercase font-mono text-[11px]">
              <Layers className="w-4 h-4" />
              <span>Dry-Run Execution Simulation</span>
            </div>
            <p className="text-slate-200 leading-relaxed font-mono text-[11px]">
              {discrepancy.suggestedFix.dryRunExplanation}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-sky-900/40 text-[11px]">
              <div>
                <span className="text-slate-400">Target System:</span>{' '}
                <strong className="text-sky-200 font-mono">{discrepancy.suggestedFix.targetSystem}</strong>
              </div>
              <div>
                <span className="text-slate-400">Modified Field:</span>{' '}
                <strong className="text-sky-200 font-mono">{discrepancy.suggestedFix.targetField}</strong>
              </div>
            </div>
          </div>

          {/* Action Choice Selection */}
          <div className="space-y-2">
            <label className="text-slate-300 font-medium font-mono uppercase text-[11px]">
              Select Remediation Protocol:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedAction('approve')}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  selectedAction === 'approve'
                    ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve & Commit
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Executes fix and flags audit trail
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAction('stage')}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  selectedAction === 'stage'
                    ? 'bg-sky-950/60 border-sky-600 text-sky-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-xs flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Stage in Queue
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Ready for batch commit
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAction('rollback')}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  selectedAction === 'rollback'
                    ? 'bg-amber-950/60 border-amber-600 text-amber-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-xs flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset / Reopen
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Revert to unresolved
                </div>
              </button>
            </div>
          </div>

          {/* Reviewer Sign-off Form */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-[11px] font-mono block mb-1">
                  Steward / Signer Name:
                </label>
                <input
                  type="text"
                  value={stewardName}
                  onChange={(e) => setStewardName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-red-600 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[11px] font-mono block mb-1">
                  Authorized Governance Role:
                </label>
                <select
                  value={stewardRole}
                  onChange={(e) => setStewardRole(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-red-600 font-mono"
                >
                  <option value="Data Steward">Data Steward</option>
                  <option value="Analytics Lead">Analytics Lead</option>
                  <option value="Systems Owner">Systems Owner</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-slate-400 text-[11px] font-mono block mb-1">
                Audit Trail Reason & Justification Notes:
              </label>
              <textarea
                rows={2}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-red-600"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
            <Lock className="w-3 h-3 text-slate-400" />
            Immutable Audit Trail Signed
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAction}
              disabled={isSubmitting || !stewardName.trim()}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <FileCheck className="w-3.5 h-3.5" />
              {isSubmitting ? 'Committing...' : 'Commit Protocol'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
