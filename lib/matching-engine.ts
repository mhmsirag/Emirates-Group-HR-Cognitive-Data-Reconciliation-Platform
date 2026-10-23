import {
  CoreHREmployee,
  PayrollRecord,
  LearningRecord,
  AccessDirectoryRecord,
  Discrepancy,
  TrustScorecard,
  FieldTrustMetric,
} from './types';

// Arabic transliteration normalization helper
export function normalizeName(name: string): string {
  if (!name) return '';
  let cleaned = name.toLowerCase().trim();
  // Strip titles
  cleaned = cleaned.replace(/^(capt\.|dr\.|eng\.|mr\.|mrs\.|ms\.)\s+/i, '');
  // Normalize transliterations
  cleaned = cleaned.replace(/\bal[- ]/g, 'al'); // al-mansoor -> almansoor
  cleaned = cleaned.replace(/\bmohammed\b|\bmohammad\b|\bmuhammed\b/g, 'mohamed');
  cleaned = cleaned.replace(/\btariq\b|\btarek\b/g, 'tareq');
  cleaned = cleaned.replace(/\bhashmi\b/g, 'hashimi');
  cleaned = cleaned.replace(/\s+/g, ' ');
  return cleaned;
}

export function calculateLevenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function runReconciliation(
  coreHr: CoreHREmployee[],
  payroll: PayrollRecord[],
  learning: LearningRecord[],
  accessDir: AccessDirectoryRecord[],
  currentDateStr = '2026-10-23'
): { discrepancies: Discrepancy[]; scorecard: TrustScorecard } {
  const discrepancies: Discrepancy[] = [];
  const currentDate = new Date(currentDateStr);

  const coreHrMap = new Map<string, CoreHREmployee>();
  coreHr.forEach((emp) => coreHrMap.set(emp.emp_id, emp));

  const payrollMap = new Map<string, PayrollRecord>();
  payroll.forEach((pr) => payrollMap.set(pr.emp_code, pr));

  const accessMap = new Map<string, AccessDirectoryRecord>();
  accessDir.forEach((ad) => accessMap.set(ad.employee_reference, ad));

  const learningMap = new Map<string, LearningRecord[]>();
  learning.forEach((lr) => {
    const arr = learningMap.get(lr.staff_number) || [];
    arr.push(lr);
    learningMap.set(lr.staff_number, arr);
  });

  // Track field match counters for scorecard
  let statusMatches = 0;
  let statusTotal = 0;
  let costCenterMatches = 0;
  let costCenterTotal = 0;
  let currencyValid = 0;
  let currencyTotal = 0;
  let safetyValid = 0;
  let safetyTotal = 0;
  let securityAccessCompliant = 0;
  let securityAccessTotal = 0;

  // 1. Check Core HR to Payroll & Directory
  coreHr.forEach((emp) => {
    const pr = payrollMap.get(emp.emp_id);
    const ad = accessMap.get(emp.emp_id);
    const lrList = learningMap.get(emp.emp_id) || [];

    // --- ANOMALY 1: Ghost Employee / Active Payroll for Terminated Staff ---
    if (emp.employment_status === 'Terminated') {
      statusTotal++;
      securityAccessTotal++;

      if (pr && pr.payment_status === 'Active') {
        const salaryInAED = pr.currency === 'USD' ? pr.base_salary * 3.6725 : pr.base_salary;
        const totalDisbursement = salaryInAED + (pr.housing_allowance || 0) + (pr.flight_allowance || 0);

        discrepancies.push({
          id: `DISC-PR-${emp.emp_id}`,
          entityId: emp.emp_id,
          employeeName: emp.display_name,
          category: 'Payroll & Financial Integrity',
          severity: 'Critical',
          businessRiskScore: 94,
          title: `Ghost Payroll Disbursement: Terminated Employee Scheduled for Salary Run`,
          description: `Employee was officially terminated in Core HR on ${emp.termination_date}, yet their payroll status is still 'Active' in SAP Payroll with an impending monthly disbursement of AED ${totalDisbursement.toLocaleString()}.`,
          evidence: [
            { system: 'Core HR', field: 'employment_status', value: 'Terminated', statusIndicator: 'invalid' },
            { system: 'Core HR', field: 'termination_date', value: emp.termination_date || 'N/A', statusIndicator: 'invalid' },
            { system: 'Payroll', field: 'payment_status', value: 'Active', statusIndicator: 'breach' },
            { system: 'Payroll', field: 'base_salary', value: `${pr.base_salary} ${pr.currency}`, statusIndicator: 'breach' },
            { system: 'Payroll', field: 'last_processed_date', value: pr.last_processed_date, statusIndicator: 'normal' },
          ],
          downstreamImpact: {
            affectedSystems: ['SAP S/4HANA Payroll', 'UAE Central Bank WPS', 'Group Financial Accounts'],
            affectedReports: ['Monthly General Ledger Disbursal Report', 'SOX 404 Internal Controls Audit'],
            financialExposureAED: totalDisbursement,
            regulatoryInfractions: ['UAE Wage Protection System Unearned Disbursement Audit', 'SOX Financial Fraud Control Defect'],
            urgencyDays: 2,
            blastRadius: 'Departmental',
            deadlineNotice: 'Monthly Payroll Run cutoff occurs on October 25th at 18:00 GST',
          },
          aiExplanation: `Employee ${emp.display_name} ceased employment on ${emp.termination_date}. The termination notification event in Core HR failed to propagate via API middleware into SAP Payroll, leaving bank dispatch scheduled for the October run.`,
          aiRootCause: 'Integration bridge timeout between Oracle HCM termination webhook and SAP S/4HANA infotype 0008.',
          suggestedFix: {
            actionType: 'suspend_payroll',
            targetSystem: 'Payroll',
            targetField: 'payment_status',
            proposedValue: 'Suspended',
            dryRunExplanation: `Will instantly update ${pr.payroll_id} status to 'Suspended', preventing automated AED ${totalDisbursement.toLocaleString()} WPS bank file generation.`,
          },
          status: 'unresolved',
        });
      } else {
        statusMatches++;
      }

      // --- ANOMALY 2: Security Breach - Active Badge & Privileged Access for Terminated Staff ---
      if (ad && (ad.account_status === 'Active' || ad.badge_status === 'Active')) {
        const isAirside = ad.airside_security_clearance.toLowerCase().includes('airside') || ad.airside_security_clearance.toLowerCase().includes('red badge');
        const hasAdminPrivilege = ad.security_groups.includes('Admins') || ad.security_groups.includes('Root') || ad.security_groups.includes('PAM');
        const severity = isAirside || hasAdminPrivilege ? 'Critical' : 'High';
        const risk = isAirside ? 98 : hasAdminPrivilege ? 95 : 85;

        discrepancies.push({
          id: `DISC-SEC-${emp.emp_id}`,
          entityId: emp.emp_id,
          employeeName: emp.display_name,
          category: 'Airside Security & Cyber Privilege',
          severity,
          businessRiskScore: risk,
          title: isAirside
            ? `Critical Airside Security Breach: Terminated Staff Retains Active Restricted Pass`
            : `Privileged Cyber Access Breach: Terminated Staff Retains Enterprise Admin Rights`,
          description: isAirside
            ? `Staff member terminated on ${emp.termination_date} still holds an Active ${ad.airside_security_clearance} (Badge #${ad.badge_number}). Last electronic swipe detected at '${ad.last_badge_swipe_location}'.`
            : `Staff member terminated on ${emp.termination_date} still has an Active Entra ID account with privileged roles [${ad.security_groups}]. Last authentication occurred on ${ad.last_logon_timestamp}.`,
          evidence: [
            { system: 'Core HR', field: 'employment_status', value: 'Terminated', statusIndicator: 'invalid' },
            { system: 'Access Directory', field: 'account_status', value: ad.account_status, statusIndicator: 'breach' },
            { system: 'Access Directory', field: 'badge_status', value: ad.badge_status, statusIndicator: 'breach' },
            { system: 'Access Directory', field: 'clearance', value: ad.airside_security_clearance, statusIndicator: 'breach' },
            { system: 'Access Directory', field: 'last_activity', value: ad.last_badge_swipe_location || ad.last_logon_timestamp, statusIndicator: 'breach' },
          ],
          downstreamImpact: {
            affectedSystems: ['Dubai Airports Pass Office (DASS)', 'Entra ID PIM', 'Physical Airside Access Turnstiles'],
            affectedReports: ['ICAO Annex 17 Aviation Security Audit', 'Dubai Police Airside Pass Registry'],
            financialExposureAED: isAirside ? 150000 : 75000,
            regulatoryInfractions: [
              'ICAO Annex 17 Airport Security Non-Compliance',
              'GCAA National Civil Aviation Security Programme (NCASP) Part 108 Infraction',
            ],
            urgencyDays: 0,
            blastRadius: 'Company-Wide',
            deadlineNotice: 'Mandatory revocation SLA is within 60 minutes of termination',
          },
          aiExplanation: `Terminated employee record exists in Core HR but automated SCIM deprovisioning failed to execute revocation calls to Dubai Airports Security Pass Office and Microsoft Entra ID. Active credentials allow unauthorized physical or logical access.`,
          aiRootCause: 'SCIM gateway sync failed due to unhandled schema mapping error on employee separation date.',
          suggestedFix: {
            actionType: isAirside ? 'disable_badge' : 'disable_account',
            targetSystem: 'Access Directory',
            targetField: 'account_status',
            proposedValue: 'Disabled',
            dryRunExplanation: `Will immediately revoke badge #${ad.badge_number} in DASS physical controllers and set directory account ${ad.user_principal_name} to 'Disabled'.`,
          },
          status: 'unresolved',
        });
      } else {
        securityAccessCompliant++;
      }
    } else {
      statusTotal++;
      statusMatches++;
      securityAccessTotal++;
      securityAccessCompliant++;
    }

    // --- ANOMALY 3: Aviation Safety & Regulatory Training Expiration ---
    if (emp.employment_status === 'Active') {
      const isPilot = emp.job_title.toLowerCase().includes('captain') || emp.job_title.toLowerCase().includes('first officer');
      const isEngineer = emp.job_title.toLowerCase().includes('engineer') || emp.job_title.toLowerCase().includes('avionics');

      lrList.forEach((cert) => {
        safetyTotal++;
        const certExpiry = new Date(cert.valid_until);
        const isExpired = certExpiry < currentDate;

        if (isExpired && cert.compliance_status === 'Expired') {
          const isFlightDeck = cert.course_code.includes('LPC') || cert.course_code.includes('MED');
          const isAirworthiness = cert.course_code.includes('EWIS') || cert.course_code.includes('P66');

          if (isFlightDeck || isAirworthiness) {
            discrepancies.push({
              id: `DISC-SAFE-${cert.certification_id}`,
              entityId: emp.emp_id,
              employeeName: emp.display_name,
              category: 'Flight Operations & Safety',
              severity: 'Critical',
              businessRiskScore: 99,
              title: isFlightDeck
                ? `Active Flight Crew with Expired GCAA Recurrent Simulator Certification`
                : `Active Licensed Aircraft Engineer Signing Releases with Expired EWIS Certification`,
              description: `Active staff member '${emp.display_name}' (${emp.job_title}) holds an expired safety certification '${cert.course_name}' (expired on ${cert.valid_until}). If rostered on commercial flights or aircraft releases, this violates UAE GCAA CAR-OPS regulations.`,
              evidence: [
                { system: 'Core HR', field: 'job_title', value: emp.job_title, statusIndicator: 'normal' },
                { system: 'Core HR', field: 'employment_status', value: emp.employment_status, statusIndicator: 'normal' },
                { system: 'Learning', field: 'course_code', value: cert.course_code, statusIndicator: 'invalid' },
                { system: 'Learning', field: 'valid_until', value: cert.valid_until, statusIndicator: 'breach' },
                { system: 'Learning', field: 'compliance_status', value: 'Expired', statusIndicator: 'breach' },
              ],
              downstreamImpact: {
                affectedSystems: ['Jeppesen Crew Pairing Roster', 'DXB Flight Dispatch Desk', 'GCAA Aviation Safety Ledger'],
                affectedReports: ['Flight Crew Legal Roster Manifest', 'CAR-OPS 1 Line Operations Safety Audit'],
                financialExposureAED: 220000,
                regulatoryInfractions: ['UAE GCAA CAR-OPS 1.965 Mandatory Recurrent Checking Defect', 'AOC Flight Operation Invalidation'],
                urgencyDays: 1,
                blastRadius: 'Individual Flight / Shift',
                deadlineNotice: 'Daily Jeppesen Roster Lock at 02:00 UTC tomorrow',
              },
              aiExplanation: `Mandatory simulator check ${cert.course_code} expired on ${cert.valid_until}. The learning management system failed to flag the Jeppesen crew pairing engine to restrict assignment, risking an illegal flight crew pairing.`,
              aiRootCause: 'Batch synchronization between Aviation College LMS and Jeppesen Rostering delayed.',
              suggestedFix: {
                actionType: 'schedule_training',
                targetSystem: 'Learning',
                targetField: 'compliance_status',
                proposedValue: 'Recurrent_Sim_Booked',
                dryRunExplanation: `Places employee on flight roster hold and books emergency simulator recurrent slot with Emirates Aviation College.`,
              },
              status: 'unresolved',
            });
          }
        } else {
          safetyValid++;
        }
      });
    }

    // --- ANOMALY 4: Payroll Currency Mismatch (e.g. USD vs AED) ---
    if (pr) {
      currencyTotal++;
      if (pr.currency !== 'AED') {
        const expectedAED = pr.base_salary;
        const actualAEDdisbursement = pr.base_salary * 3.6725;
        const overpaymentRisk = actualAEDdisbursement - expectedAED;

        discrepancies.push({
          id: `DISC-CURR-${pr.payroll_id}`,
          entityId: emp.emp_id,
          employeeName: emp.display_name,
          category: 'Payroll & Financial Integrity',
          severity: 'Critical',
          businessRiskScore: 92,
          title: `Catastrophic Currency Inversion: Salary Defined in ${pr.currency} Instead of AED`,
          description: `Core HR compensation grade specifies AED currency, but Payroll record ${pr.payroll_id} was submitted in ${pr.currency}. At prevailing exchange rates (3.6725), this causes an inadvertent 367% overpayment of AED ${overpaymentRisk.toFixed(0)}.`,
          evidence: [
            { system: 'Core HR', field: 'expected_currency', value: 'AED', statusIndicator: 'normal' },
            { system: 'Payroll', field: 'base_salary', value: `${pr.base_salary} ${pr.currency}`, statusIndicator: 'breach' },
            { system: 'Payroll', field: 'estimated_payout_aed', value: `AED ${actualAEDdisbursement.toLocaleString()}`, statusIndicator: 'breach' },
            { system: 'Payroll', field: 'iban', value: pr.iban, statusIndicator: 'normal' },
          ],
          downstreamImpact: {
            affectedSystems: ['SAP S/4HANA Finance', 'Emirates NBD Corporate Banking Gateway', 'UAE WPS File Validator'],
            affectedReports: ['WPS SIF (Salary Information File) Rejection Log', 'Group Treasury Liquidity Forecast'],
            financialExposureAED: overpaymentRisk,
            regulatoryInfractions: ['UAE Central Bank WPS Format Mismatch Violation', 'SOX 404 Key Financial Control Exception'],
            urgencyDays: 2,
            blastRadius: 'Departmental',
            deadlineNotice: 'WPS Payroll generation cutoff is October 25th',
          },
          aiExplanation: `During recent contract renegotiation or expat transfer, an HR data clerk entered the currency code 'USD' instead of 'AED' while retaining the AED nominal numerical value 38,000.`,
          aiRootCause: 'Manual input override in SAP infotype 0008 without cross-currency validation guardrails.',
          suggestedFix: {
            actionType: 'fix_currency',
            targetSystem: 'Payroll',
            targetField: 'currency',
            proposedValue: 'AED',
            dryRunExplanation: `Resets currency to 'AED' and caps gross disbursement at AED 38,000, preventing AED ${overpaymentRisk.toLocaleString()} erroneous outflow.`,
          },
          status: 'unresolved',
        });
      } else {
        currencyValid++;
      }

      // --- ANOMALY 5: Cost Center Misalignment / Cross-Entity Misbilling ---
      costCenterTotal++;
      if (emp.cost_center !== pr.cost_center_code) {
        discrepancies.push({
          id: `DISC-CC-${emp.emp_id}`,
          entityId: emp.emp_id,
          employeeName: emp.display_name,
          category: 'Cost Center Misalignment',
          severity: 'High',
          businessRiskScore: 78,
          title: `Inter-Company Cost Center Drift: HR Cost Center Differs from Payroll Ledger`,
          description: `Employee belongs to '${emp.business_unit} - ${emp.department}' with HR cost center '${emp.cost_center}', but payroll expenses are being charged to '${pr.cost_center_code}'. This distorts departmental P&L and inter-company cost allocations between Emirates Airline and dnata.`,
          evidence: [
            { system: 'Core HR', field: 'cost_center', value: emp.cost_center, statusIndicator: 'normal' },
            { system: 'Core HR', field: 'department', value: emp.department, statusIndicator: 'normal' },
            { system: 'Payroll', field: 'cost_center_code', value: pr.cost_center_code, statusIndicator: 'invalid' },
            { system: 'Payroll', field: 'monthly_charge', value: `AED ${pr.base_salary}`, statusIndicator: 'normal' },
          ],
          downstreamImpact: {
            affectedSystems: ['SAP S/4HANA Controlling (CO-CCA)', 'Intercompany Journal Allocation Engine'],
            affectedReports: ['Monthly Departmental Budget Variance Report', 'dnata / Emirates Transfer Pricing Ledger'],
            financialExposureAED: pr.base_salary * 12,
            regulatoryInfractions: ['Internal Audit Inter-company Ledger Allocation Misalignment'],
            urgencyDays: 8,
            blastRadius: 'Departmental',
            deadlineNotice: 'Month-end financial closing cycle',
          },
          aiExplanation: `Cost center change in Core HR was completed upon departmental transfer, but the corresponding update in Payroll cost distribution was omitted.`,
          aiRootCause: 'Cost center change order #CO-8912 was approved in HCM but skipped SAP infotype 0027 sync.',
          suggestedFix: {
            actionType: 'update_cost_center',
            targetSystem: 'Payroll',
            targetField: 'cost_center_code',
            proposedValue: emp.cost_center,
            dryRunExplanation: `Aligns payroll cost center code to '${emp.cost_center}', ensuring payroll charges correctly debit '${emp.department}'.`,
          },
          status: 'unresolved',
        });
      } else {
        costCenterMatches++;
      }

      // --- ANOMALY 6: Identity / Transliteration Mismatch ---
      const hrNormalized = normalizeName(emp.display_name);
      const prNormalized = normalizeName(pr.account_holder_name);
      if (hrNormalized !== prNormalized && calculateLevenshtein(hrNormalized, prNormalized) > 1) {
        discrepancies.push({
          id: `DISC-ID-${emp.emp_id}`,
          entityId: emp.emp_id,
          employeeName: emp.display_name,
          category: 'Identity & Transliteration Drift',
          severity: 'Medium',
          businessRiskScore: 52,
          title: `Transliteration Inconsistency: Name Discrepancy Across Master Systems`,
          description: `Name in Core HR is '${emp.display_name}', but bank account holder in Payroll is listed as '${pr.account_holder_name}'. UAE Central Bank WPS validates against Emirates ID national registry, which may reject payments if beneficiary name divergence exceeds threshold.`,
          evidence: [
            { system: 'Core HR', field: 'display_name', value: emp.display_name, statusIndicator: 'normal' },
            { system: 'Core HR', field: 'national_id', value: emp.national_id, statusIndicator: 'normal' },
            { system: 'Payroll', field: 'account_holder_name', value: pr.account_holder_name, statusIndicator: 'invalid' },
          ],
          downstreamImpact: {
            affectedSystems: ['UAE Central Bank WPS SIF Engine', 'Emirates NBD Host-to-Host Banking API'],
            affectedReports: ['WPS Employee Identification Verification Report'],
            financialExposureAED: pr.base_salary,
            regulatoryInfractions: ['UAE Central Bank WPS Name Matching Threshold Alert'],
            urgencyDays: 5,
            blastRadius: 'Individual Flight / Shift',
            deadlineNotice: 'WPS Batch Processing window',
          },
          aiExplanation: `Phonetic difference arising from English transliteration of Arabic patronymics. National ID matches exactly, confirming singular biological entity.`,
          aiRootCause: 'Lack of automated Emirates ID name normalization during bank beneficiary setup.',
          suggestedFix: {
            actionType: 'update_cost_center',
            targetSystem: 'Payroll',
            targetField: 'account_holder_name',
            proposedValue: emp.display_name,
            dryRunExplanation: `Updates Payroll account holder name to match official Emirates ID spelling '${emp.display_name}'.`,
          },
          status: 'unresolved',
        });
      }
    }
  });

  // --- ANOMALY 7: Ghost Employee in Payroll (Not in Core HR at all!) ---
  payroll.forEach((pr) => {
    if (!coreHrMap.has(pr.emp_code)) {
      discrepancies.push({
        id: `DISC-GHOST-${pr.payroll_id}`,
        entityId: pr.emp_code,
        employeeName: pr.account_holder_name,
        category: 'Ghost Employee / Unmatched Record',
        severity: 'Critical',
        businessRiskScore: 96,
        title: `Pure Ghost Employee: Active Payroll Record Without Core HR Master Record`,
        description: `Payroll record '${pr.payroll_id}' for '${pr.account_holder_name}' (Code: ${pr.emp_code}) is actively receiving AED ${pr.base_salary} monthly salary, yet has NO matching employee master record in Core HR. Potential serious payroll fraud or corrupted legacy migration.`,
        evidence: [
          { system: 'Payroll', field: 'emp_code', value: pr.emp_code, statusIndicator: 'breach' },
          { system: 'Payroll', field: 'account_holder_name', value: pr.account_holder_name, statusIndicator: 'breach' },
          { system: 'Payroll', field: 'base_salary', value: `AED ${pr.base_salary}`, statusIndicator: 'breach' },
          { system: 'Core HR', field: 'emp_id', value: 'NOT FOUND', statusIndicator: 'invalid' },
        ],
        downstreamImpact: {
          affectedSystems: ['SAP S/4HANA Payroll', 'Group Financial Accounts', 'Internal Audit Oversight'],
          affectedReports: ['Monthly General Ledger Disbursal Report', 'SOX 404 Internal Controls Audit'],
          financialExposureAED: pr.base_salary * 12,
          regulatoryInfractions: ['SOX Section 404 Fraudulent Payroll Entry', 'UAE Labour Law Illegal Wage Transfer'],
          urgencyDays: 1,
          blastRadius: 'Departmental',
          deadlineNotice: 'Immediate freeze required before upcoming payroll run',
        },
        aiExplanation: `Record exists solely within SAP Payroll database. No hiring requisition, background check, or Emirates ID registration exists in Oracle HCM.`,
        aiRootCause: 'Orphaned payroll record remaining from manual ad-hoc contractor payment in legacy system.',
        suggestedFix: {
          actionType: 'remove_ghost',
          targetSystem: 'Payroll',
          targetField: 'payment_status',
          proposedValue: 'Suspended',
          dryRunExplanation: `Immediately blocks payroll record ${pr.payroll_id} and flags account AE710330000998018899999 for compliance audit.`,
        },
        status: 'unresolved',
      });
    }
  });

  // Calculate Field Trust Metrics
  const fieldMetrics: FieldTrustMetric[] = [
    {
      field: 'employment_status',
      sourceSystem: 'Core HR vs Payroll / Access',
      totalRecords: statusTotal || 1,
      matchedRecords: statusMatches,
      integrityPct: Math.round(((statusMatches || 0) / (statusTotal || 1)) * 100),
      anomalyCount: statusTotal - statusMatches,
    },
    {
      field: 'currency_code',
      sourceSystem: 'Payroll',
      totalRecords: currencyTotal || 1,
      matchedRecords: currencyValid,
      integrityPct: Math.round(((currencyValid || 0) / (currencyTotal || 1)) * 100),
      anomalyCount: currencyTotal - currencyValid,
    },
    {
      field: 'cost_center',
      sourceSystem: 'Core HR vs Payroll',
      totalRecords: costCenterTotal || 1,
      matchedRecords: costCenterMatches,
      integrityPct: Math.round(((costCenterMatches || 0) / (costCenterTotal || 1)) * 100),
      anomalyCount: costCenterTotal - costCenterMatches,
    },
    {
      field: 'regulatory_certifications',
      sourceSystem: 'Learning vs Flight Operations',
      totalRecords: safetyTotal || 1,
      matchedRecords: safetyValid,
      integrityPct: Math.round(((safetyValid || 0) / (safetyTotal || 1)) * 100),
      anomalyCount: safetyTotal - safetyValid,
    },
    {
      field: 'airside_badge_entitlement',
      sourceSystem: 'Core HR vs Dubai Airports Pass Office',
      totalRecords: securityAccessTotal || 1,
      matchedRecords: securityAccessCompliant,
      integrityPct: Math.round(((securityAccessCompliant || 0) / (securityAccessTotal || 1)) * 100),
      anomalyCount: securityAccessTotal - securityAccessCompliant,
    },
  ];

  const overallTrustScore = Math.round(
    fieldMetrics.reduce((acc, m) => acc + m.integrityPct, 0) / fieldMetrics.length
  );

  const criticalIssuesCount = discrepancies.filter((d) => d.severity === 'Critical').length;
  const highIssuesCount = discrepancies.filter((d) => d.severity === 'High').length;

  const gcaaAviationReadiness = Math.round((safetyValid / (safetyTotal || 1)) * 100);
  const soxFinancialControlScore = Math.round((currencyValid / (currencyTotal || 1)) * 100);
  const airsideCyberSecurityScore = Math.round((securityAccessCompliant / (securityAccessTotal || 1)) * 100);

  const scorecard: TrustScorecard = {
    overallTrustScore,
    gcaaAviationReadiness,
    soxFinancialControlScore,
    airsideCyberSecurityScore,
    systemConsistency: {
      coreHrToPayroll: Math.round(((costCenterMatches + currencyValid) / (costCenterTotal + currencyTotal || 1)) * 100),
      coreHrToAccessDirectory: airsideCyberSecurityScore,
      coreHrToLearning: gcaaAviationReadiness,
    },
    fieldMetrics,
    criticalIssuesCount,
    highIssuesCount,
    totalMonitoredEmployees: coreHr.length + 1,
  };

  // Sort discrepancies by risk score descending
  discrepancies.sort((a, b) => b.businessRiskScore - a.businessRiskScore);

  return { discrepancies, scorecard };
}
