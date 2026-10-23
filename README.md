# Emirates Group HR Cognitive Data Reconciliation Platform

An enterprise-grade, full-stack cognitive data governance and reconciliation system engineered for the **Emirates Group HR Data Reconciliation Challenge**.

This platform automatically identifies, explains, ranks, and resolves data inconsistencies across disparate HR systems (`core_hr.csv`, `payroll.csv`, `learning.csv`, `access_directory.csv`), predicts downstream operational blast radius before applying fixes, and delivers an interactive plain-language query engine with full source provenance tracking.

---

## 1. Key Capabilities

* **Multi-System Entity Resolution & Fuzzy Matching**:
  * Cross-references Oracle HCM Cloud, SAP S/4HANA Payroll, Emirates Aviation College LMS, and Dubai Airports Pass Office (DASS).
  * Tolerates phonetic and Arabic patronymic transliteration drift (e.g., Mohammed / Mohamed, Tariq / Tareq, Al-Hashimi / Al Hashmi) alongside National ID (UAE Emirates ID) verification.
* **Cognitive Anomaly Detection & Business Risk Scoring**:
  * **Flight Safety & Airworthiness**: Identifies active flight crew (Captains, First Officers) with expired GCAA Line Proficiency Checks (LPC) or aircraft maintenance engineers signing releases with expired Part-145 EWIS certifications.
  * **Airport Airside & Cyber Security**: Detects separated/terminated employees who still hold active restricted airside DXB passes or privileged Entra ID / CyberArk cloud root credentials.
  * **Payroll Financial Controls (SOX)**: Uncovers catastrophic currency mismatches (e.g., USD specified instead of AED, causing a 367% overpayment risk), cross-entity cost center drift between Emirates Airline and dnata, and ghost employees.
* **Downstream Operational Blast Radius & Impact Predictor**:
  * Models real-time dependencies into **Jeppesen Flight Crew Rostering** (Daily Roster Lock 02:00 UTC), **UAE Central Bank WPS & Payroll Run** (Cutoff Oct 25th 18:00 GST), and **Dubai Airports Physical Airside Gates**.
  * Quantifies financial exposure in AED and triggers countdown notices.
* **Gemini 3.8 Flash Cognitive Engine**:
  * Evaluates deep root cause analyses for each discrepancy.
  * Powers natural language queries with deterministic source provenance citing exact source CSV file, row entity, field name, raw value, and confidence score.
* **Human-in-the-Loop Governance & Cryptographic Audit Ledger**:
  * Staged remediation workflow with dry-run impact simulation.
  * Immutable, timestamped cryptographic audit trail with CSV/JSON ledger export.
* **Multi-Role Tailored Dashboards**:
  * **Data Steward**: Discrepancy triage, evidence inspector, and 1-click remediation.
  * **Analytics Lead**: Field fidelity scorecards, GCAA compliance index, and SOX control scores.
  * **Systems Owner**: Downstream dependency topology, system sync health, and operational cutoff timers.

---

## 2. Architecture & File Structure

```text
├── .github/
│   └── workflows/
│       └── ci.yml                   # GitHub Actions CI check
├── data/                            # Synthetic enterprise HR data pack
│   ├── core_hr.csv                  # Oracle HCM Master employee profiles
│   ├── payroll.csv                  # SAP S/4HANA Payroll & WPS remuneration
│   ├── learning.csv                 # Emirates Aviation College LMS certifications
│   ├── access_directory.csv         # Dubai Airports DASS badges & Entra ID
│   ├── data_dictionary.md           # Field schemas and business invariants
│   └── dependencies.md              # Downstream systems dependency graph
├── lib/                             # Core algorithms & server-side AI
│   ├── types.ts                     # TypeScript schemas for discrepancies & impacts
│   ├── csv-loader.ts                # Strict CSV parser & normalization logic
│   ├── matching-engine.ts           # Multi-system entity resolution & anomaly pipeline
│   └── gemini.ts                    # Google Gen AI client (@google/genai, gemini-3.8-flash)
├── src/
│   ├── components/
│   │   ├── dashboard-shell.tsx      # Role-based container with 3-zone Top Bar
│   │   ├── issue-triage-table.tsx   # Ranked discrepancy queue & evidence comparison
│   │   ├── impact-visualizer.tsx    # Downstream dependency graph & countdowns
│   │   ├── trust-scorecard.tsx      # Field & system-to-system fidelity metrics
│   │   ├── nl-query-box.tsx         # Plain-language query box with source provenance
│   │   ├── approval-modal.tsx       # Human-in-the-loop review & dry-run simulator
│   │   ├── audit-trail-view.tsx     # Cryptographic audit ledger viewer & export
│   │   └── datasets-inspector.tsx   # Direct raw CSV data inspection & download
│   ├── App.tsx                      # Main application orchestrator
│   ├── main.tsx                     # Vite React entry point
│   └── index.css                    # Tailwind CSS v4 design rules
├── server.ts                        # Full-stack Express server with Vite middleware
├── package.json
└── README.md
```

---

## 3. Getting Started

### Prerequisites
* Node.js 20+
* Google Gemini API Key (configured via `GEMINI_API_KEY` in `.env`)

### Installation & Execution
```bash
# Install dependencies
npm install

# Run full-stack development server (Express + Vite on Port 3000)
npm run dev

# Run linting and TypeScript checks
npm run lint

# Build for production
npm run build
```

---

## 4. Security & Compliance
* **GCAA CAR-OPS 1.965**: Flight crew recurrent qualification validation.
* **ICAO Annex 17**: Airside security access control and badge revocation SLA.
* **UAE Central Bank WPS**: Wage Protection System salary formatting & currency verification.
* **SOX Section 404**: Enterprise financial controls and ghost payroll prevention.
