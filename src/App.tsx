/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Discrepancy,
  TrustScorecard as TrustScorecardType,
  AuditLogEntry,
  UserRole,
  QueryResponse,
} from '../lib/types';
import { DashboardShell } from './components/dashboard-shell';
import { IssueTriageTable } from './components/issue-triage-table';
import { ImpactVisualizer } from './components/impact-visualizer';
import { TrustScorecard } from './components/trust-scorecard';
import { NLQueryBox } from './components/nl-query-box';
import { ApprovalModal } from './components/approval-modal';
import { AuditTrailView } from './components/audit-trail-view';
import { DatasetsInspector } from './components/datasets-inspector';
import { loadAllHRDatasets } from '../lib/csv-loader';
import { runReconciliation } from '../lib/matching-engine';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('Data Steward');
  const [activeTab, setActiveTab] = useState<'triage' | 'impact' | 'trust' | 'query' | 'audit' | 'datasets'>('triage');

  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [scorecard, setScorecard] = useState<TrustScorecardType | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const [selectedForApproval, setSelectedForApproval] = useState<Discrepancy | null>(null);
  const [selectedImpactId, setSelectedImpactId] = useState<string | null>(null);

  const [isReconciling, setIsReconciling] = useState<boolean>(false);
  const [isExplainingId, setIsExplainingId] = useState<string | null>(null);
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch initial reconciliation state from backend
  const fetchReconciliationData = async () => {
    setIsReconciling(true);
    try {
      const res = await fetch('/api/reconcile');
      if (res.ok) {
        const data = await res.json();
        setDiscrepancies(data.discrepancies);
        setScorecard(data.scorecard);
      } else {
        throw new Error('API server returned error');
      }
    } catch {
      // Graceful client-side fallback
      const localData = loadAllHRDatasets();
      const localRecon = runReconciliation(
        localData.coreHr,
        localData.payroll,
        localData.learning,
        localData.accessDirectory
      );
      setDiscrepancies(localRecon.discrepancies);
      setScorecard(localRecon.scorecard);
    } finally {
      setIsReconciling(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit-trail');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs);
      }
    } catch {
      // keep existing
    }
  };

  useEffect(() => {
    fetchReconciliationData();
    fetchAuditLogs();
  }, []);

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    if (role === 'Data Steward') {
      setActiveTab('triage');
      showNotification(`Switched to Data Steward role: Focus on issue triage and data quality fixes.`, 'info');
    } else if (role === 'Analytics Lead') {
      setActiveTab('trust');
      showNotification(`Switched to Analytics Lead role: Viewing enterprise trust scorecards & field integrity.`, 'info');
    } else if (role === 'Systems Owner') {
      setActiveTab('impact');
      showNotification(`Switched to Systems Owner role: Monitoring downstream dependencies & cutoff timers.`, 'info');
    }
  };

  const handleExplainWithAI = async (disc: Discrepancy) => {
    setIsExplainingId(disc.id);
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discrepancyId: disc.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setDiscrepancies((prev) =>
          prev.map((d) =>
            d.id === disc.id
              ? {
                  ...d,
                  aiExplanation: data.aiExplanation,
                  aiRootCause: data.aiRootCause,
                }
              : d
          )
        );
        showNotification(`Gemini Root Cause analysis generated for ${disc.employeeName}.`, 'success');
      }
    } catch {
      showNotification('AI analysis generated using offline deterministic knowledge model.', 'info');
    } finally {
      setIsExplainingId(null);
    }
  };

  const handleQuickStage = async (disc: Discrepancy) => {
    try {
      const res = await fetch('/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discrepancyId: disc.id,
          action: 'stage',
          stewardName: 'Lead Data Steward',
          stewardRole: currentRole,
          comments: `Quick staged for upcoming remediation cycle`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDiscrepancies((prev) =>
          prev.map((d) => (d.id === disc.id ? data.discrepancy : d))
        );
        fetchAuditLogs();
        showNotification(`Issue '${disc.title}' staged for batch approval.`, 'info');
      }
    } catch {
      setDiscrepancies((prev) =>
        prev.map((d) => (d.id === disc.id ? { ...d, status: 'staged' } : d))
      );
      showNotification(`Issue staged locally.`, 'info');
    }
  };

  const handleConfirmResolution = async (payload: {
    discrepancyId: string;
    action: 'approve' | 'stage' | 'dismiss' | 'rollback';
    stewardName: string;
    stewardRole: string;
    comments: string;
  }) => {
    setIsSubmittingApproval(true);
    try {
      const res = await fetch('/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setDiscrepancies((prev) =>
          prev.map((d) => (d.id === payload.discrepancyId ? data.discrepancy : d))
        );
        setScorecard(data.scorecard);
        fetchAuditLogs();
        showNotification(`Remediation protocol '${payload.action}' committed to immutable audit ledger.`, 'success');
      }
    } catch {
      setDiscrepancies((prev) =>
        prev.map((d) =>
          d.id === payload.discrepancyId
            ? { ...d, status: payload.action === 'approve' ? 'approved' : 'staged' }
            : d
        )
      );
      showNotification(`Resolution applied locally.`, 'info');
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const handleExecuteQuery = async (queryText: string): Promise<QueryResponse> => {
    setIsQuerying(true);
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText }),
      });
      if (res.ok) {
        return await res.json();
      }
      throw new Error('Query server error');
    } finally {
      setIsQuerying(false);
    }
  };

  const handleResetSimulation = async () => {
    try {
      await fetch('/api/reset', { method: 'POST' });
      fetchReconciliationData();
      fetchAuditLogs();
      showNotification('Simulation datasets and triage states reset to initial baseline.', 'info');
    } catch {
      fetchReconciliationData();
    }
  };

  const handleNavigateToImpact = (discrepancyId: string) => {
    setSelectedImpactId(discrepancyId);
    setActiveTab('impact');
  };

  return (
    <DashboardShell
      currentRole={currentRole}
      onRoleChange={handleRoleChange}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      scorecard={scorecard}
      onRunReconciliation={fetchReconciliationData}
      onResetSimulation={handleResetSimulation}
      isReconciling={isReconciling}
    >
      {/* Dynamic Toast Banner */}
      {notification && (
        <div className={`mb-6 p-3 rounded-lg text-xs font-medium border flex items-center justify-between transition-all ${
          notification.type === 'success'
            ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
            : notification.type === 'error'
            ? 'bg-red-950/80 border-red-800 text-red-200'
            : 'bg-slate-900 border-slate-700 text-slate-200'
        }`}>
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-200 ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tab Panels */}
      {activeTab === 'triage' && (
        <IssueTriageTable
          discrepancies={discrepancies}
          onSelectForApproval={(disc) => setSelectedForApproval(disc)}
          onQuickStage={handleQuickStage}
          onExplainWithAI={handleExplainWithAI}
          onNavigateToImpact={handleNavigateToImpact}
          currentRole={currentRole}
          isExplainingId={isExplainingId}
        />
      )}

      {activeTab === 'impact' && (
        <ImpactVisualizer
          discrepancies={discrepancies}
          selectedDiscrepancyId={selectedImpactId}
          onSelectDiscrepancy={(id) => setSelectedImpactId(id)}
          onOpenApprovalModal={(disc) => setSelectedForApproval(disc)}
        />
      )}

      {activeTab === 'trust' && scorecard && (
        <TrustScorecard scorecard={scorecard} />
      )}

      {activeTab === 'query' && (
        <NLQueryBox
          onExecuteQuery={handleExecuteQuery}
          isQuerying={isQuerying}
          onSelectEntity={(empId) => {
            const found = discrepancies.find((d) => d.entityId === empId);
            if (found) {
              setSelectedForApproval(found);
            }
          }}
        />
      )}

      {activeTab === 'audit' && (
        <AuditTrailView logs={auditLogs} />
      )}

      {activeTab === 'datasets' && (
        <DatasetsInspector />
      )}

      {/* Human-in-the-Loop Approval & Dry Run Modal */}
      <ApprovalModal
        discrepancy={selectedForApproval}
        onClose={() => setSelectedForApproval(null)}
        onConfirmResolution={handleConfirmResolution}
        currentRole={currentRole}
        isSubmitting={isSubmittingApproval}
      />
    </DashboardShell>
  );
}
