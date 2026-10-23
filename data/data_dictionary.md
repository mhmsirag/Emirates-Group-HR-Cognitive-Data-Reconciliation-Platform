# Emirates Group HR Cognitive Data Dictionary

This data dictionary outlines the schemas, primary keys, cross-system foreign keys, and business integrity rules for the Emirates Group HR Cognitive Reconciliation Platform.

---

## 1. Systems & Schemas

### A. Core HR (`core_hr.csv`)
* **Source of Record**: Oracle HCM Cloud / Workday Enterprise
* **Primary Key**: `emp_id` (`EK-XXXXX` for Emirates Airline / Group, `DN-XXXXX` for dnata)
* **Fields**:
  - `emp_id`: Unique Global Employee Identifier.
  - `national_id`: UAE Emirates ID format (`784-YYYY-XXXXXXX-Z`).
  - `first_name`, `last_name`, `display_name`: Legal name and flight roster display name.
  - `email`: Corporate email address (`@emirates.com` or `@dnata.com`).
  - `gender`, `date_of_birth`, `hire_date`: Standard demographic master records.
  - `employment_status`: `Active`, `Terminated`, `On Leave`, `Suspended`.
  - `termination_date`: Date ISO format if terminated; blank if active.
  - `business_unit`: `Emirates Airline`, `dnata`, `Emirates Engineering`, `Group Corporate`.
  - `department`: Sub-division (e.g. `Flight Operations`, `Cargo Operations`, `Inflight Services`).
  - `job_title`: Standardized position title.
  - `work_location`: Physical operational base (e.g., `DXB Headquarters`, `DXB Engineering Centre`, `DWC Al Maktoum Airport`).
  - `cost_center`: Financial general ledger cost center code (e.g., `EK-FLTOP-101`, `DN-RAMP-102`).
  - `manager_emp_id`: Line manager global employee ID.

### B. Payroll System (`payroll.csv`)
* **Source of Record**: SAP S/4HANA Payroll & Wage Protection System (WPS)
* **Primary Key**: `payroll_id` (`PR-XXXXX`)
* **Foreign Key**: `emp_code` (Maps to Core HR `emp_id`)
* **Fields**:
  - `payroll_id`: Internal payroll register ID.
  - `emp_code`: Employee ID reference.
  - `national_id_hash`: UAE National ID for UAE Central Bank WPS compliance.
  - `account_holder_name`: Bank account beneficiary name (often entered phonetically).
  - `bank_name`, `iban`: UAE IBAN format.
  - `base_salary`: Base monthly remuneration.
  - `currency`: Default currency (`AED`). Critical rule: Disallow foreign currencies without special expatriate ledger flag.
  - `flight_allowance`: Sector pay, flight duty hours allowance for pilots/cabin crew.
  - `housing_allowance`: Monthly company accommodation cash allowance.
  - `cost_center_code`: Cost allocation ledger code for journal entry generation.
  - `payment_status`: `Active`, `Suspended`, `Hold`.
  - `last_processed_date`: Cutoff timestamp for previous salary run.

### C. Learning & Safety Certifications (`learning.csv`)
* **Source of Record**: Emirates Aviation College LMS / GCAA Flight Ops Training Matrix
* **Primary Key**: `certification_id` (`CERT-XXXX`)
* **Foreign Key**: `staff_number` (Maps to Core HR `emp_id`)
* **Fields**:
  - `certification_id`: Unique training ledger record.
  - `staff_number`: Employee global ID.
  - `attendee_name`: Trainee full name.
  - `course_code`: Regulatory course identifier (`GCAA-B777-LPC`, `EASA-P145-EWIS`, `IATA-DGR-CAT6`, etc.).
  - `course_name`: Official curriculum title.
  - `issuing_authority`: `UAE GCAA`, `EASA`, `IATA`, `Dubai Airports Authority`.
  - `completion_date`: Date training was completed.
  - `valid_until`: Mandatory expiration date.
  - `compliance_status`: `Valid`, `Expired`, `Expiring_Soon`, `Revoked`.
  - `score_pct`: Assessment grade.
  - `renewal_required`: Boolean flag indicating mandatory recurrent certification.

### D. Identity & Access Directory (`access_directory.csv`)
* **Source of Record**: Microsoft Entra ID / CyberArk PAM / Dubai Airports Security System (DASS)
* **Primary Key**: `user_principal_name`
* **Foreign Key**: `employee_reference` (Maps to Core HR `emp_id`)
* **Fields**:
  - `user_principal_name`: Corporate email/login identity.
  - `employee_reference`: Employee ID.
  - `full_name`: Identity display name.
  - `account_status`: `Active`, `Suspended`, `Disabled`.
  - `mfa_enforced`: Multi-factor authentication flag.
  - `security_groups`: Comma-separated AD/Entra groups & privileged access tiers.
  - `badge_number`: Dubai Airports physical RFID badge serial number.
  - `airside_security_clearance`: Physical zone clearance level (`Red Badge`, `Blue Badge`, `Yellow Badge`, `Green Badge`).
  - `badge_status`: `Active`, `Expired`, `Revoked`.
  - `badge_expiration`: Badge validity date.
  - `last_logon_timestamp`: Last authenticated activity timestamp.
  - `last_badge_swipe_location`: Physical electronic turnstile or security gate swipe location.

---

## 2. Integrity & Reconciliation Invariants

1. **Active Roster Safety Invariant**:
   Any flight crew member (Captain, First Officer, Purser) marked `Active` in Core HR who holds scheduled duty MUST have a non-expired GCAA recurrent certification (`valid_until >= CURRENT_DATE`). Any violation is a **SEVERITY: CRITICAL** aviation regulatory breach.

2. **Airside Security Privilege Invariant**:
   Any staff member whose `employment_status` is `Terminated` in Core HR MUST have their `account_status` set to `Disabled` and their physical airport `badge_status` revoked within 1 hour of termination timestamp. Any active badge or active AD account for terminated personnel is a **SEVERITY: CRITICAL** national security and GCAA/ICAO Annex 17 infraction.

3. **Payroll Disbursement Invariant**:
   - `currency` MUST match `AED` unless an explicit offshore agreement exists.
   - `cost_center` in Payroll MUST match `cost_center` in Core HR to avoid inter-company financial distortion.
   - Any salary disbursed to an employee marked `Terminated` or missing from Core HR is an unearned disbursement / potential fraudulent ghost employee.

4. **Transliteration & Identity Invariant**:
   Matching between systems must employ phonetically tolerant algorithms (Jaro-Winkler, Levenshtein, Double Metaphone) to bridge English/Arabic name variants (e.g. Tariq/Tareq, Mohammed/Mohamed/Mohammad, Al-Hashimi/Al Hashmi) alongside National ID verification.
