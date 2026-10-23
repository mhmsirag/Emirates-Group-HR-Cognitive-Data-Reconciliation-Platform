import React from 'react';
import { AuditLogEntry } from '../../lib/types';
import {
  History,
  Download,
  ShieldCheck,
  FileCheck2,
  Clock,
  User,
  Hash,
} from 'lucide-react';

interface AuditTrailViewProps {
  logs: AuditLogEntry[];
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ logs }) => {
  const exportAuditCSV = () => {
    const headers = ['ID', 'Timestamp', 'Discrepancy ID', 'Employee Name', 'Category', 'Action Taken', 'Steward Name', 'Steward Role', 'Proposed Change', 'Verification Hash'];
    const rows = logs.map((l) => [
      l.id,
      l.timestamp,
      l.discrepancyId,
      `"${l.employeeName}"`,
      `"${l.category}"`,
      `"${l.actionTaken}"`,
      `"${l.stewardName}"`,
      `"${l.stewardRole}"`,
      `"${l.proposedChange}"`,
      l.verificationHash,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `emirates_hr_audit_trail_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-slate-300" />
            Human-in-the-Loop Governance Audit Trail
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically fingerprinted audit log documenting all discrepancy stages, dry-runs, and sign-offs
          </p>
        </div>

        <button
          onClick={exportAuditCSV}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap self-start"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          Export Audit Ledger (CSV)
        </button>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Event ID / Hash</th>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Subject</th>
                <th className="py-2.5 px-4">Action Taken</th>
                <th className="py-2.5 px-4">Steward & Role</th>
                <th className="py-2.5 px-4">Proposed Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-3 px-4 font-mono">
                    <div className="text-slate-200 font-medium">{log.id}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                      <Hash className="w-2.5 h-2.5" />
                      {log.verificationHash}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-200">{log.employeeName}</div>
                    <div className="text-[10px] font-mono text-slate-400">{log.category}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono">
                      {log.actionTaken}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    <div className="font-medium text-slate-200">{log.stewardName}</div>
                    <div className="text-[10px] text-red-300 font-mono">{log.stewardRole}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs truncate" title={log.proposedChange}>
                    {log.proposedChange}
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
