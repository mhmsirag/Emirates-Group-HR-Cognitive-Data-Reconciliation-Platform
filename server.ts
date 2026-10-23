import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadAllHRDatasets } from './lib/csv-loader';
import { runReconciliation } from './lib/matching-engine';
import { explainDiscrepancyWithAI, queryReconciledDataWithAI } from './lib/gemini';
import { AuditLogEntry, Discrepancy } from './lib/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-memory runtime state
const initialData = loadAllHRDatasets();
let currentReconciliation = runReconciliation(
  initialData.coreHr,
  initialData.payroll,
  initialData.learning,
  initialData.accessDirectory
);

let auditLogs: AuditLogEntry[] = [
  {
    id: 'AUDIT-INIT-01',
    timestamp: '2026-10-23T06:00:00Z',
    discrepancyId: 'SYSTEM',
    employeeName: 'System Engine',
    category: 'System Initialization',
    actionTaken: 'Baseline reconciliation matrix computed',
    stewardName: 'Emirates Cognitive Engine',
    stewardRole: 'Automated Pipeline',
    proposedChange: 'Scanned 4 disparate data sources (Core HR, Payroll, LMS, AD)',
    verificationHash: 'SHA256-EK-RECON-77901A',
  },
];

// API: Get Reconciliation Data
app.get('/api/reconcile', (req, res) => {
  res.json({
    discrepancies: currentReconciliation.discrepancies,
    scorecard: currentReconciliation.scorecard,
    meta: {
      totalEmployees: initialData.coreHr.length,
      payrollRecords: initialData.payroll.length,
      learningRecords: initialData.learning.length,
      accessRecords: initialData.accessDirectory.length,
      lastReconciled: new Date().toISOString(),
    },
  });
});

// API: Natural Language Query (RAG-lite with Gemini)
app.post('/api/query', async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const result = await queryReconciledDataWithAI(query, {
      coreHr: initialData.coreHr,
      payroll: initialData.payroll,
      learning: initialData.learning,
      accessDirectory: initialData.accessDirectory,
      discrepancies: currentReconciliation.discrepancies,
    });
    res.json(result);
  } catch (error: any) {
    console.error('Error handling query:', error);
    res.status(500).json({ error: error.message || 'Failed to process query' });
  }
});

// API: AI Deep Explanation of Discrepancy
app.post('/api/explain', async (req, res) => {
  const { discrepancyId } = req.body;
  const disc = currentReconciliation.discrepancies.find((d) => d.id === discrepancyId);
  if (!disc) {
    return res.status(404).json({ error: 'Discrepancy not found' });
  }

  try {
    const analysis = await explainDiscrepancyWithAI(disc);
    res.json(analysis);
  } catch (error: any) {
    console.error('Error generating AI explanation:', error);
    res.status(500).json({ error: error.message || 'Failed to generate explanation' });
  }
});

// API: Resolve / Stage / Approve / Rollback Discrepancy
app.post('/api/resolve', (req, res) => {
  const { discrepancyId, action, stewardName, stewardRole, comments } = req.body;

  const discIndex = currentReconciliation.discrepancies.findIndex((d) => d.id === discrepancyId);
  if (discIndex === -1) {
    return res.status(404).json({ error: 'Discrepancy not found' });
  }

  const disc = currentReconciliation.discrepancies[discIndex];
  const oldStatus = disc.status;

  let newStatus: Discrepancy['status'] = 'approved';
  if (action === 'stage') newStatus = 'staged';
  if (action === 'dismiss') newStatus = 'dismissed';
  if (action === 'rollback') newStatus = 'unresolved';

  disc.status = newStatus;
  disc.auditTrail = {
    resolvedAt: new Date().toISOString(),
    resolvedBy: stewardName || 'Data Steward',
    userRole: stewardRole || 'Lead Data Steward',
    comments: comments || `Action '${action}' applied via Cognitive Reconciliation Console`,
  };

  // Add to audit logs
  const auditEntry: AuditLogEntry = {
    id: `AUDIT-${Date.now()}`,
    timestamp: new Date().toISOString(),
    discrepancyId: disc.id,
    employeeName: disc.employeeName,
    category: disc.category,
    actionTaken: `Status shifted from '${oldStatus}' to '${newStatus}' (${action})`,
    stewardName: stewardName || 'Data Steward',
    stewardRole: stewardRole || 'Lead Data Steward',
    proposedChange: disc.suggestedFix.dryRunExplanation,
    verificationHash: `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
  };

  auditLogs.unshift(auditEntry);

  // Recalculate unresolved counts
  const unresolvedCritical = currentReconciliation.discrepancies.filter(
    (d) => d.severity === 'Critical' && d.status === 'unresolved'
  ).length;

  const unresolvedHigh = currentReconciliation.discrepancies.filter(
    (d) => d.severity === 'High' && d.status === 'unresolved'
  ).length;

  currentReconciliation.scorecard.criticalIssuesCount = unresolvedCritical;
  currentReconciliation.scorecard.highIssuesCount = unresolvedHigh;

  res.json({
    success: true,
    discrepancy: disc,
    auditEntry,
    scorecard: currentReconciliation.scorecard,
  });
});

// API: Get Audit Logs
app.get('/api/audit-trail', (req, res) => {
  res.json({ logs: auditLogs });
});

// API: Raw Datasets Metadata & Previews
app.get('/api/datasets', (req, res) => {
  res.json({
    coreHrCount: initialData.coreHr.length,
    payrollCount: initialData.payroll.length,
    learningCount: initialData.learning.length,
    accessCount: initialData.accessDirectory.length,
    raw: initialData.rawText,
  });
});

// API: Reset Simulation State
app.post('/api/reset', (req, res) => {
  currentReconciliation = runReconciliation(
    initialData.coreHr,
    initialData.payroll,
    initialData.learning,
    initialData.accessDirectory
  );
  auditLogs = [
    {
      id: `AUDIT-RESET-${Date.now()}`,
      timestamp: new Date().toISOString(),
      discrepancyId: 'ALL',
      employeeName: 'System Reset',
      category: 'System State Reset',
      actionTaken: 'All discrepancy stages and approvals restored to initial evaluation state',
      stewardName: 'System Administrator',
      stewardRole: 'Systems Owner',
      proposedChange: 'Reset data structures to baseline',
      verificationHash: 'SHA256-RESET-VERIFIED',
    },
  ];
  res.json({ success: true, message: 'Reconciliation state reset to initial' });
});

// Vite Middleware for Full-Stack integration in development / production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Emirates Group HR Reconciliation Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
