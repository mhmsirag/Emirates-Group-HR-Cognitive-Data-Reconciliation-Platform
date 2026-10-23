# Emirates Group HR Downstream Dependency Matrix

This document maps upstream HR source entities to critical downstream business systems, operational workflows, and executive compliance reports. When discrepancies occur or proposed fixes are evaluated, this dependency graph determines the blast radius and urgency.

---

## 1. Core Downstream Systems

```text
[Core HR] ──┬──> [Jeppesen Crew Pairing & Flight Rostering] ──> [DXB Flight Dispatch]
            ├──> [SAP S/4HANA Finance & General Ledger] ──────> [Group Financial Audits (SOX)]
            ├──> [Dubai Airports Security Pass Office (DASS)] ──> [Airside Security Access Gates]
            └──> [Central Bank UAE Wage Protection System (WPS)] ─> [Employee Salary Disbursement]

[Learning] ───> [GCAA Aviation Safety Regulatory Ledger] ───> [Aircraft Operating Certificate (AOC)]

[Directory] ──> [Entra ID Privileged Identity (PIM)] ────────> [Cloud Infrastructure & Flight Software]
```

---

## 2. Dependency Nodes & Business Impact Rules

| Downstream System / Report | Upstream Feeds | Regulatory / SLA Trigger | Business Impact if Discrepancy Exists |
| :--- | :--- | :--- | :--- |
| **Jeppesen Flight Crew Roster Engine** | `core_hr.csv`, `learning.csv` | Daily Roster Lock (02:00 UTC) | **Flight Grounding / Crew Illegal Duty**: If a pilot or purser lacks valid recurrent certifications, flight cannot be dispatched without violating UAE GCAA CAR-OPS 1. Flights delayed or grounded cost $15,000–$50,000 per hour. |
| **UAE Central Bank WPS & Monthly Payroll Run** | `core_hr.csv`, `payroll.csv` | 25th of Month (Cutoff 18:00 GST) | **Salary Overpayment / Bank Batch Rejection**: Foreign currency mismatches (e.g. 38,000 USD paid instead of AED = ~140,000 AED) cause catastrophic cash leakage; ghost employee disbursements trigger SOX Section 404 audit deficiencies. |
| **Dubai Airports Security & Pass Office (DASS)** | `core_hr.csv`, `access_directory.csv` | Real-time revocation (<60 min) | **DXB Airside Breach / ICAO Annex 17 Violation**: Terminated employees entering airside zones can trigger airport-wide security alerts, heavy fines from Dubai Police/GCAA, and suspension of airport pass issuance. |
| **Aircraft Maintenance Release (CAR-145)** | `core_hr.csv`, `learning.csv` | Pre-flight Signoff | **Airworthiness Invalidation**: Uncertified aircraft engineers signing off maintenance cards can ground the entire aircraft until re-inspected by certified engineers. |
| **Intercompany Cost Allocation Ledger** | `core_hr.csv`, `payroll.csv` | Month-End Financial Close | **Cost Distortion**: dnata ground staff mistakenly billed to Emirates Airline engineering cost centers skews unit profitability and corporate tax filings. |
| **UAE Ministry of Human Resources & Emiratisation (MOHRE)** | `core_hr.csv`, `payroll.csv` | Quarterly Audit | **Tawteen / Emiratisation Quota Fines**: Inaccurate national identification or ghost entries can jeopardize federal Emiratisation compliance ratings. |

---

## 3. Predicted Impact Assessment Formula

When evaluating a discrepancy:
$$\text{Risk Score} = w_{\text{safety}} \cdot S + w_{\text{financial}} \cdot F + w_{\text{security}} \cdot C + w_{\text{deadline}} \cdot D$$

Where:
- $S \in [0, 100]$: Aviation Flight Safety & Airworthiness risk
- $F \in [0, 100]$: Financial loss / overpayment / audit exposure
- $C \in [0, 100]$: Airside physical & cyber privilege risk
- $D \in [0, 100]$: Proximity to cutoff deadline (Payroll 25th, Flight Roster 02:00 UTC)
