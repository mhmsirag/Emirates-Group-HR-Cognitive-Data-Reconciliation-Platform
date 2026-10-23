import { GoogleGenAI } from '@google/genai';
import { Discrepancy, QueryResponse } from './types';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.startsWith('MY_')) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function withTimeout<T>(promise: Promise<T>, ms = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Gemini API timeout')), ms)),
  ]);
}

export async function explainDiscrepancyWithAI(discrepancy: Discrepancy): Promise<{
  aiExplanation: string;
  aiRootCause: string;
  regulatoryRiskAnalysis: string;
  remediationAdvice: string;
}> {
  const ai = getGeminiClient();
  if (!ai) {
    return {
      aiExplanation: discrepancy.aiExplanation || 'Discrepancy detected across enterprise HR systems.',
      aiRootCause: discrepancy.aiRootCause || 'System integration synchronization delay or schema discrepancy.',
      regulatoryRiskAnalysis: `Potential exposure under ${discrepancy.downstreamImpact.regulatoryInfractions.join(', ')}. Estimated financial exposure: AED ${discrepancy.downstreamImpact.financialExposureAED.toLocaleString()}.`,
      remediationAdvice: discrepancy.suggestedFix.dryRunExplanation,
    };
  }

  try {
    const prompt = `
You are the Lead Aviation & HR Data Governance Architect for Emirates Group.
Analyze this HR data discrepancy detected between Core HR, SAP Payroll, Aviation Learning/Safety, and Dubai Airports Access Directory.

Discrepancy Details:
- ID: ${discrepancy.id}
- Employee: ${discrepancy.employeeName} (${discrepancy.entityId})
- Category: ${discrepancy.category}
- Severity: ${discrepancy.severity} (Business Risk Score: ${discrepancy.businessRiskScore}/100)
- Title: ${discrepancy.title}
- Description: ${discrepancy.description}
- Evidence: ${JSON.stringify(discrepancy.evidence, null, 2)}
- Downstream Systems: ${discrepancy.downstreamImpact.affectedSystems.join(', ')}
- Deadlines: ${discrepancy.downstreamImpact.deadlineNotice}

Provide a structured, executive-grade analysis with:
1. Cognitive Root Cause: Why this happened across systems (e.g. middleware sync lag, manual entry typo, unhandled webhook).
2. Deep Explanation: Detailed narrative of the inconsistency.
3. Aviation / Financial / Security Regulatory Blast Radius: Exact impact on GCAA CAR-OPS, ICAO Annex 17, UAE Central Bank WPS, or SOX 404 audits.
4. Remediation Advice: Specific step-by-step instructions for data stewards.

Format your response in JSON:
{
  "aiExplanation": "...",
  "aiRootCause": "...",
  "regulatoryRiskAnalysis": "...",
  "remediationAdvice": "..."
}
`;

    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      }),
      6000
    );

    const text = response.text || '';
    const parsed = JSON.parse(text);
    return {
      aiExplanation: parsed.aiExplanation || discrepancy.aiExplanation || '',
      aiRootCause: parsed.aiRootCause || discrepancy.aiRootCause || '',
      regulatoryRiskAnalysis: parsed.regulatoryRiskAnalysis || '',
      remediationAdvice: parsed.remediationAdvice || discrepancy.suggestedFix.dryRunExplanation || '',
    };
  } catch (err) {
    console.error('Gemini explanation error:', err);
    return {
      aiExplanation: discrepancy.aiExplanation || 'Discrepancy detected across enterprise HR systems.',
      aiRootCause: discrepancy.aiRootCause || 'Integration middleware synchronization failure.',
      regulatoryRiskAnalysis: `High exposure under ${discrepancy.downstreamImpact.regulatoryInfractions.join(', ')}.`,
      remediationAdvice: discrepancy.suggestedFix.dryRunExplanation,
    };
  }
}

export async function queryReconciledDataWithAI(
  userQuery: string,
  reconciledContext: {
    coreHr: any[];
    payroll: any[];
    learning: any[];
    accessDirectory: any[];
    discrepancies: Discrepancy[];
  }
): Promise<QueryResponse> {
  const ai = getGeminiClient();

  // If Gemini API is not available or errors out, fallback to an intelligent deterministic RAG matcher
  const searchLower = userQuery.toLowerCase();

  // Prepare context summary for LLM
  const summaryContext = {
    discrepanciesSummary: reconciledContext.discrepancies.map((d) => ({
      id: d.id,
      empId: d.entityId,
      name: d.employeeName,
      title: d.title,
      category: d.category,
      severity: d.severity,
      evidence: d.evidence,
      affectedSystems: d.downstreamImpact.affectedSystems,
      financialExposureAED: d.downstreamImpact.financialExposureAED,
    })),
    employees: reconciledContext.coreHr.map((e) => ({
      id: e.emp_id,
      name: e.display_name,
      status: e.employment_status,
      title: e.job_title,
      dept: e.department,
      costCenter: e.cost_center,
    })),
  };

  if (ai) {
    try {
      const prompt = `
You are the Emirates Group HR Cognitive Data Reconciliation Oracle.
Answer the user's natural language question about Emirates Group employees, payroll integrity, aviation safety training, and physical/cyber airport access credentials.

User Question: "${userQuery}"

Reconciled Data Context:
${JSON.stringify(summaryContext, null, 2)}

Instructions:
1. Provide a comprehensive, accurate answer citing specific employees, ID numbers, currencies, dates, and systems.
2. In the "sources" list, cite EXACT provenance (system, entityId, field, rawValue, confidence 0.0-1.0, citation note).
3. Identify the user intent (e.g. "SAFETY_AUDIT", "PAYROLL_FRAUD_CHECK", "AIRSIDE_SECURITY_CHECK", "COST_CENTER_ALIGNMENT").
4. List 2-3 suggested follow-up actions.

Format strictly as JSON:
{
  "answerMarkdown": "Markdown formatted clear answer with bullet points and bold highlights",
  "intent": "INTENT_LABEL",
  "confidence": 0.98,
  "sources": [
    {
      "system": "Core HR | Payroll | Learning | Access Directory",
      "entityId": "EK-XXXXX",
      "field": "field_name",
      "rawValue": "value",
      "confidence": 0.95,
      "citation": "Descriptive reason this record is cited"
    }
  ],
  "suggestedActions": ["Action 1", "Action 2"]
}
`;

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        }),
        6000
      );

      const parsed = JSON.parse(response.text || '{}');
      return {
        query: userQuery,
        answerMarkdown: parsed.answerMarkdown || 'Analysis completed.',
        intent: parsed.intent || 'GENERAL_QUERY',
        confidence: parsed.confidence || 0.95,
        sources: parsed.sources || [],
        suggestedActions: parsed.suggestedActions || ['Review discrepancy triage queue', 'Notify departmental lead'],
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      console.error('Gemini query error:', err);
    }
  }

  // Deterministic cognitive RAG fallback
  const matchingDiscs = reconciledContext.discrepancies.filter((d) => {
    return (
      d.employeeName.toLowerCase().includes(searchLower) ||
      d.title.toLowerCase().includes(searchLower) ||
      d.category.toLowerCase().includes(searchLower) ||
      d.description.toLowerCase().includes(searchLower) ||
      (searchLower.includes('pilot') && d.category.includes('Flight Operations')) ||
      (searchLower.includes('safety') && d.category.includes('Flight Operations')) ||
      (searchLower.includes('badge') && d.category.includes('Airside Security')) ||
      (searchLower.includes('terminated') && d.description.toLowerCase().includes('terminated')) ||
      (searchLower.includes('currency') && d.category.includes('Payroll')) ||
      (searchLower.includes('salary') && d.category.includes('Payroll')) ||
      (searchLower.includes('ghost') && d.category.includes('Ghost'))
    );
  });

  const sources = matchingDiscs.flatMap((d) =>
    d.evidence.map((ev) => ({
      system: ev.system,
      entityId: d.entityId,
      field: ev.field,
      rawValue: String(ev.value),
      confidence: 0.96,
      citation: `${ev.system} record for ${d.employeeName} (${d.entityId}) confirming ${ev.field}=${ev.value}`,
    }))
  );

  let answerMarkdown = '';
  if (matchingDiscs.length === 0) {
    answerMarkdown = `**No critical discrepancies detected** matching query "${userQuery}". The audited systems (` +
      `\`core_hr.csv\`, \`payroll.csv\`, \`learning.csv\`, \`access_directory.csv\`) show consistent alignment for this subset.`;
  } else {
    answerMarkdown = `### Reconciled Findings for: *"${userQuery}"*\n\n` +
      `We identified **${matchingDiscs.length} critical finding(s)** across enterprise systems:\n\n` +
      matchingDiscs
        .map(
          (d) =>
            `- **${d.title}** (${d.severity} - Risk ${d.businessRiskScore}/100)\n` +
            `  - **Subject**: ${d.employeeName} (\`${d.entityId}\`)\n` +
            `  - **Findings**: ${d.description}\n` +
            `  - **Financial / Regulatory Risk**: AED ${d.downstreamImpact.financialExposureAED.toLocaleString()} (${d.downstreamImpact.regulatoryInfractions[0] || 'Internal Defect'})\n` +
            `  - **Recommended Action**: ${d.suggestedFix.dryRunExplanation}`
        )
        .join('\n\n');
  }

  return {
    query: userQuery,
    answerMarkdown,
    intent: 'DISCREPANCY_ANALYSIS',
    confidence: 0.94,
    sources: sources.slice(0, 8),
    suggestedActions: [
      'Stage recommended fixes in Triage view',
      'Download audit trail provenance report',
      'Lock payroll batch for impacted records',
    ],
    timestamp: new Date().toISOString(),
  };
}
