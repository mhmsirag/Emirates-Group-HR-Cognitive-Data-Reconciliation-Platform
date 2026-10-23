export interface CoreHREmployee {
  emp_id: string;
  national_id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  email: string;
  gender: string;
  date_of_birth: string;
  hire_date: string;
  employment_status: 'Active' | 'Terminated' | 'On Leave' | 'Suspended';
  termination_date?: string;
  business_unit: string;
  department: string;
  job_title: string;
  work_location: string;
  cost_center: string;
  manager_emp_id: string;
}

export interface PayrollRecord {
  payroll_id: string;
  emp_code: string;
  national_id_hash: string;
  account_holder_name: string;
  bank_name: string;
  iban: string;
  base_salary: number;
  currency: string;
  flight_allowance: number;
  housing_allowance: number;
  cost_center_code: string;
  payment_status: 'Active' | 'Suspended' | 'Hold';
  last_processed_date: string;
}

export interface LearningRecord {
  certification_id: string;
  staff_number: string;
  attendee_name: string;
  course_code: string;
  course_name: string;
  issuing_authority: string;
  completion_date: string;
  valid_until: string;
  compliance_status: 'Valid' | 'Expired' | 'Expiring_Soon' | 'Revoked';
  score_pct: number;
  renewal_required: boolean;
}

export interface AccessDirectoryRecord {
  user_principal_name: string;
  employee_reference: string;
  full_name: string;
  account_status: 'Active' | 'Suspended' | 'Disabled';
  mfa_enforced: boolean;
  security_groups: string;
  badge_number: string;
  airside_security_clearance: string;
  badge_status: 'Active' | 'Expired' | 'Revoked';
  badge_expiration: string;
  last_logon_timestamp: string;
  last_badge_swipe_location: string;
}

export type DiscrepancySeverity = 'Critical' | 'High' | 'Medium' | 'Low';

export type DiscrepancyCategory =
  | 'Flight Operations & Safety'
  | 'Airside Security & Cyber Privilege'
  | 'Payroll & Financial Integrity'
  | 'Cost Center Misalignment'
  | 'Ghost Employee / Unmatched Record'
  | 'Identity & Transliteration Drift';

export interface EvidenceItem {
  system: 'Core HR' | 'Payroll' | 'Learning' | 'Access Directory';
  field: string;
  value: string | number | boolean;
  statusIndicator?: 'mismatch' | 'invalid' | 'breach' | 'normal';
}

export interface SuggestedFix {
  actionType: 'disable_badge' | 'disable_account' | 'suspend_payroll' | 'fix_currency' | 'update_cost_center' | 'schedule_training' | 'remove_ghost';
  targetSystem: 'Core HR' | 'Payroll' | 'Learning' | 'Access Directory' | 'All Systems';
  targetField: string;
  proposedValue: string | number;
  dryRunExplanation: string;
}

export interface DownstreamImpact {
  affectedSystems: string[];
  affectedReports: string[];
  financialExposureAED: number;
  regulatoryInfractions: string[];
  urgencyDays: number;
  blastRadius: 'Company-Wide' | 'Departmental' | 'Individual Flight / Shift';
  deadlineNotice: string;
}

export interface Discrepancy {
  id: string;
  entityId: string;
  employeeName: string;
  category: DiscrepancyCategory;
  severity: DiscrepancySeverity;
  businessRiskScore: number; // 0 - 100
  title: string;
  description: string;
  evidence: EvidenceItem[];
  downstreamImpact: DownstreamImpact;
  aiExplanation?: string;
  aiRootCause?: string;
  suggestedFix: SuggestedFix;
  status: 'unresolved' | 'staged' | 'approved' | 'dismissed';
  auditTrail?: {
    resolvedAt?: string;
    resolvedBy?: string;
    userRole?: string;
    comments?: string;
  };
}

export interface FieldTrustMetric {
  field: string;
  sourceSystem: string;
  totalRecords: number;
  matchedRecords: number;
  integrityPct: number;
  anomalyCount: number;
}

export interface TrustScorecard {
  overallTrustScore: number; // 0 - 100
  gcaaAviationReadiness: number; // 0 - 100
  soxFinancialControlScore: number; // 0 - 100
  airsideCyberSecurityScore: number; // 0 - 100
  systemConsistency: {
    coreHrToPayroll: number;
    coreHrToAccessDirectory: number;
    coreHrToLearning: number;
  };
  fieldMetrics: FieldTrustMetric[];
  criticalIssuesCount: number;
  highIssuesCount: number;
  totalMonitoredEmployees: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  discrepancyId: string;
  employeeName: string;
  category: string;
  actionTaken: string;
  stewardName: string;
  stewardRole: string;
  proposedChange: string;
  verificationHash: string;
}

export interface ProvenanceSource {
  system: string;
  entityId: string;
  field: string;
  rawValue: string;
  confidence: number;
  citation: string;
}

export interface QueryResponse {
  query: string;
  answerMarkdown: string;
  intent: string;
  confidence: number;
  sources: ProvenanceSource[];
  suggestedActions: string[];
  timestamp: string;
}

export type UserRole = 'Data Steward' | 'Analytics Lead' | 'Systems Owner';
