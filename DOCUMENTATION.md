# EduShield — AI-Powered Education Insurance & Academic Continuity Platform
## Final Year B.Tech CSE Project Technical Documentation & Architecture Report

---

## 1. Project Abstract
Higher education is among the most consequential financial investments a family makes. However, unexpected catastrophic events—such as the premature demise of an earning parent, critical illness, permanent total disability, or severe involuntary financial hardship—frequently force students to discontinue their university degree midway due to unpaid semester tuition. Existing general insurance products are neither structured around academic university payment schedules nor integrated with educational institutions. 

**EduShield** is a comprehensive, production-oriented cloud platform inspired by Guidewire PolicyCenter and ClaimCenter enterprise insurance paradigms, tailored specifically for higher education. Built with React 18, TypeScript, Tailwind CSS, Firebase Firestore, Firebase Authentication, Cloud Functions, and Grounded AI (EduShield Continuity Intelligence), EduShield manages the complete insurance lifecycle: dynamic transparent quote actuarial calculations, policy binding, document-driven claim intake, university registrar enrollment verification, claims adjuster adjudication, and direct fee escrow remittance to institutional bank accounts. The platform introduces deterministic funding-gap simulations and clause-grounded AI assistance to ensure absolute academic continuity with zero hallucinations.

---

## 2. Problem Statement
Every year, thousands of students in India and globally drop out of colleges and universities due to unforeseen household financial disruption:
1. **Lack of Specialised Education Coverage**: Traditional term life and health insurance provide lump-sum payouts that are often delayed by complex probate procedures or diverted toward hospital bills, leaving college semester fee deadlines unaddressed.
2. **Complex & Opaque Insurance Processes**: Policyholders struggle to comprehend policy exclusions, waiting periods, and mandatory document requirements written in dense legal jargon.
3. **University Communication Gap**: Insurance companies do not interface directly with university registrar fee ledgers, resulting in semester deregistration and exam disqualification while claims are investigated.
4. **Fraud & Misallocation Risks**: Indemnity payouts sent directly to individual bank accounts risk diversion rather than fee payment.
5. **Slow Claim Adjudication**: Manual document sorting creates backlogs, delaying tuition payments past university cutoff dates.

---

## 3. Objectives and Proposed Solution
### Core Objectives
- Deliver a transparent, deterministic quote calculation engine factoring in degree duration, student age, and university fee schedules.
- Provide a full Guidewire-inspired policy and claims lifecycle state machine.
- Enable direct university registrar fee confirmation and dedicated escrow disbursements.
- Integrate **EduShield Continuity Intelligence**:
  - *Education Funding-Gap Calculator* for multi-year liability visualization.
  - *Grounded AI Policy Explainer* that cites exact contractual clauses with zero hallucination.
  - *AI Claim Document Assistant* providing automated pre-screening, risk flags, and readiness scoring (0–100%).
- Enforce strict Role-Based Access Control (RBAC) across five stakeholders: Parents/Guardians, Students, Claims Officers, University Registrars, and Administrators.

---

## 4. System Architecture

```text
+----------------------------------------------------------------------------------------------------+
|                                    PRESENTATION LAYER (React 18 + TS)                              |
|                                                                                                    |
|  +--------------------+  +--------------------+  +--------------------+  +-----------------------+ |
|  |  Guardian Portal   |  |   Student Portal   |  | Claims Adjuster Hub|  | University Registrar  | |
|  | (Quotes, Policies) |  | (Coverage Status)  |  | (Guidewire Queue)  |  |  (Fee Certification)  | |
|  +--------------------+  +--------------------+  +--------------------+  +-----------------------+ |
|            |                        |                       |                        |             |
|            +------------------------+-----------------------+------------------------+             |
|                                     |                                                              |
|                       +-----------------------------+                                              |
|                       |  Role-Based Router & Guards |                                              |
|                       |   (AuthContext & RBAC Hook) |                                              |
|                       +-----------------------------+                                              |
+----------------------------------------------------------------------------------------------------+
                                      |
+----------------------------------------------------------------------------------------------------+
|                                  APPLICATION SERVICES LAYER                                        |
|                                                                                                    |
|  +-------------------+  +-------------------+  +-------------------+  +--------------------------+ |
|  |   Quote Service   |  |  Policy Service   |  |   Claim Service   |  |     Payment Service      | |
|  | (Actuarial Engine)|  | (Binding & Terms) |  | (State Transitions|  | (Direct Registrar Escrow)| |
|  +-------------------+  +-------------------+  +-------------------+  +--------------------------+ |
|            |                        |                       |                        |             |
|  +-----------------------------------------------------------------------------------------------+ |
|  |                 EduShield Continuity Intelligence (AI & Grounding Engine)                     | |
|  |  - Funding-Gap Projection     - Policy Explainer (Clause Grounded)    - Document Triage/OCR   | |
|  +-----------------------------------------------------------------------------------------------+ |
+----------------------------------------------------------------------------------------------------+
                                      |
+----------------------------------------------------------------------------------------------------+
|                               DATA ACCESS LAYER (Repositories & Cache)                             |
|                                                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  |                    Universal Repository Pattern (Offline Cache & Realtime Sync)               | |
|  |    PlansRepo | UniversitiesRepo | StudentsRepo | QuotesRepo | PoliciesRepo | ClaimsRepo       | |
|  +-----------------------------------------------------------------------------------------------+ |
+----------------------------------------------------------------------------------------------------+
                                      |
+----------------------------------------------------------------------------------------------------+
|                                   CLOUD & PERSISTENCE INFRASTRUCTURE                               |
|                                                                                                    |
|  +-------------------+  +-------------------+  +--------------------+  +-------------------------+ |
|  |   Firebase Auth   |  | Firebase Firestore|  |  Firebase Storage  |  |  Firebase Cloud Funcs   | |
|  |  (RBAC & Claims)  |  | (Granular Rules)  |  | (Secure Document)  |  |    (Server Triage)      | |
|  +-------------------+  +-------------------+  +--------------------+  +-------------------------+ |
+----------------------------------------------------------------------------------------------------+
```

---

## 5. Technology Stack

| Layer | Technology | Selection Rationale |
|---|---|---|
| **Frontend Framework** | React 18 + TypeScript | Component modularity, concurrent rendering, and strict type-safety across complex insurance structures. |
| **Styling** | Tailwind CSS | Utility-first responsive design matching professional insurance enterprise palettes (slate, deep navy, teal, emerald). |
| **Routing** | React Router v6 | Declarative client-side routing with role-protected route guards. |
| **Data Visualizations** | Recharts | Composable SVG charts for funding gap projections and claims lifecycle metrics. |
| **Backend & Database** | Firebase Firestore | Real-time NoSQL document database with fine-grained security rules and offline persistence. |
| **Authentication** | Firebase Auth | Secure identity management with token claims and demo role switching. |
| **Serverless Logic** | Cloud Functions v2 | Isolated server-side execution for payment initiation, audit streams, and privileged triggers. |
| **AI Engine** | Grounded Hybrid Engine | Deterministic clause retrieval and structured schemas, ensuring 100% free-tier operation and zero hallucination. |
| **Testing** | Vitest + RTL | High-speed unit and integration testing of business logic and UI components. |

---

## 6. Database Design (Firestore Collections)

### `users`
- `id` / `uid`: string (User identifier)
- `email`: string
- `displayName`: string
- `role`: `'guardian' | 'student' | 'university' | 'claims_officer' | 'admin'`
- `universityId`?: string (For institutional registrar representatives)
- `createdAt`, `updatedAt`: ISO Timestamps

### `students`
- `id`: string
- `guardianId`, `guardianName`: string
- `fullName`, `dateOfBirth`, `gender`: string
- `universityId`, `universityName`: string
- `courseName`, `degreeType`: string
- `currentAcademicYear`, `totalCourseDurationYears`: number
- `annualTuitionFee`, `otherEligibleExpenses`: number

### `insurancePlans`
- `id`, `code`, `name`: string
- `tier`: `'BASIC' | 'COMPREHENSIVE' | 'PREMIUM'`
- `baseRatePercent`: number (e.g., 2.2%, 3.1%, 4.0%)
- `maxCoverageLimit`: number (₹15L, ₹35L, ₹75L)
- `waitingPeriodDays`: number (30 days, 15 days, 0 days)
- `coveredEvents`: ClaimType[]
- `includedBenefits`: string[]
- `exclusions`: string[]

### `quotes`
- `id`, `quoteNumber`: string (`QTE-YYYY-XXXXXX`)
- `guardianId`, `studentId`, `universityId`: string
- `coverageAmount`: number
- `policyDurationYears`: number
- `basePremium`, `riskFactorAdjustment`, `taxAmount`, `totalAnnualPremium`: number
- `status`: `'DRAFT' | 'GENERATED' | 'ACCEPTED' | 'EXPIRED'`
- `waitingPeriodDays`, `exclusions`, `benefits`: array
- `calculatedAt`, `expiresAt`: ISO Timestamps

### `educationPolicies`
- `id`, `policyNumber`: string (`EDU-YYYY-XXXXXX`)
- `quoteId`, `guardianId`, `studentId`, `universityId`: string
- `coverageAmount`, `totalAnnualPremium`: number
- `effectiveDate`, `expiryDate`, `renewalDueDate`: ISO Timestamps
- `waitingPeriodDays`, `waitingPeriodEndsAt`: string
- `status`: `'PENDING_PAYMENT' | 'ACTIVE' | 'RENEWAL_DUE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED'`
- `paymentReference`: string

### `educationClaims`
- `id`, `claimNumber`: string (`CLM-YYYY-XXXXXX`)
- `policyId`, `policyNumber`: string
- `guardianId`, `studentId`, `universityId`: string
- `claimType`: `'PARENT_DEATH' | 'PARENT_DISABILITY' | 'CRITICAL_ILLNESS' | 'UNEXPECTED_FINANCIAL_HARDSHIP'`
- `incidentDate`, `description`: string
- `requestedAmount`, `eligibleAmount`, `approvedAmount`: number
- `status`: `'SUBMITTED' | 'UNDER_REVIEW' | 'DOCUMENTS_REQUIRED' | 'UNIVERSITY_VERIFICATION_PENDING' | 'ASSESSMENT' | 'APPROVED' | 'REJECTED' | 'PAYMENT_PROCESSING' | 'PAID' | 'CLOSED'`
- `readinessScore`: number (0–100)
- `documents`: ClaimDocument[]
- `universityVerification`?: UniversityVerification
- `reviews`: ClaimReview[]
- `payment`?: ClaimPayment

### `auditLogs`
- `id`, `action`, `entityType`, `entityId`: string
- `performedByUserId`, `performedByUserName`, `performedByUserRole`: string
- `details`: string
- `timestamp`: ISO Timestamp (Strictly append-only)

---

## 7. Module Descriptions
1. **Authentication & Role Switcher**: Manages email/password signup, session persistence, and provides an instant Evaluator Role Switcher to toggle between Guardian, Student, Claims Adjuster, University Registrar, and Admin views without repeated sign-ins.
2. **Quote Engine**: Dynamic calculator evaluating degree duration, student age, university tier, and selected riders to output an itemized annual premium breakdown (including statutory 18% GST).
3. **Policy Management**: Binds accepted quotes upon simulated checkout, generates collision-resistant policy numbers, and tracks active waiting periods and renewal deadlines.
4. **Claims Intake & Workflow**: Allows authorized guardians to report covered emergencies, enter claimed tuition dues, attach supporting documents, and receive real-time AI document screening.
5. **Guidewire ClaimCenter Console**: Enables claims adjusters to inspect policy limits, review university certifications, verify attached proofs, and record formal decisions.
6. **University Registrar Verification Portal**: Enables institutional accounts officers to look up enrollment roll numbers, certify semester ledger balances, and view direct fee escrow credits.
7. **University Fee Escrow Remittance**: Direct payout mechanism transferring approved fee amounts to the verified university registrar collection account with unique UTR tracking.
8. **Reports & Exports**: Filterable, searchable reporting interface generating authentic CSV exports of claims, policies, quotes, and immutable audit logs.

---

## 8. Guidewire-Inspired Architecture
While EduShield is custom-engineered using modern web technologies, its core domain architecture mirrors key structural paradigms of **Guidewire PolicyCenter** and **Guidewire ClaimCenter**:
- **Separation of Entities & Typelists**: Strict enum typelists (`QuoteStatus`, `PolicyStatus`, `ClaimStatus`, `ClaimType`, `DocumentType`, `ClaimDecision`) govern domain state.
- **Finite State Machine**: State transitions are strictly validated through `isValidClaimTransition()`. Unlawful transitions (e.g., jumping from `DRAFT` directly to `PAID`, or paying a `REJECTED` claim) are blocked.
- **Claim Readiness Scoring**: Deterministic checklist evaluation evaluates case maturity before adjudication, mimicking Guidewire's rule-based validation assistants.
- **Two-Tier Verification**: Separation between claimant assertions and third-party institutional certification (University Registrar fee confirmation).
- **Immutable Auditability**: All major decisions, status updates, and financial transfers record unalterable audit entries.

---

## 9. AI Feature Deep Dive: EduShield Continuity Intelligence
### Feature A: Grounded AI Policy Explainer
- **Objective**: Demystify complex insurance clauses for families in stress.
- **Grounding Mechanism**: The engine extracts the active policy's contractual schedule (benefits, coverage cap, exclusions, waiting period days, and inception date). User inquiries trigger targeted semantic clause matching.
- **Guardrail**: If an inquiry relates to non-covered events or unknown procedures, the system explicitly cites Clause 7.4 or states information absence rather than synthesizing terms.

### Feature B: AI Claim Document Assistant & Triage
- **Objective**: Accelerate document review and eliminate submission errors.
- **Extraction & Comparison**: Compares uploaded document categories against the mandatory proofs required for the specific claim type (e.g., official Death Certificate for `PARENT_DEATH`, Medical Board Certificate for `PARENT_DISABILITY`).
- **Readiness Scoring Formula**:
  $$\text{Readiness Score} = \left(\frac{\text{Completed Validated Requirements}}{\text{Total Mandatory Requirements}}\right) \times 100$$
- **Explainable Recommendations**: Suggests precise next steps (e.g., "Awaiting Registrar Fee Certification from IIT Delhi").

### Feature C: Education Funding-Gap Calculator
- **Objective**: Prevent underinsurance before policy binding.
- **Formula**:
  $$\text{Total Education Liability} = (\text{Annual Tuition} + \text{Living Expenses}) \times \text{Remaining Years}$$
  $$\text{Funding Gap} = \max(0, \text{Total Liability} - (\text{Insurance Coverage} + \text{Family Savings}))$$

---

## 10. Quote and Premium Calculation Engine
The premium calculation engine uses deterministic actuarial principles:
1. **Gross Education Coverage**:
   $$\text{Coverage} = \min((\text{Annual Tuition} + \text{Other Expenses}) \times \text{Duration}, \text{Plan Max Limit})$$
2. **Base Annual Premium**:
   $$\text{Base Annual} = \left(\frac{\text{Coverage}}{\text{Duration}}\right) \times \left(\frac{\text{Plan Base Rate \%}}{100}\right)$$
3. **Actuarial Adjustments**:
   - *Duration Factor*: 10% volume discount for $\ge 4$-year degree commitments ($0.90\times$).
   - *Age Factor*: Standard college bracket (17–25) $= 1.0\times$; $<17 = 0.95\times$; $>28 = 1.10\times$.
4. **Statutory Tax**:
   $$\text{Tax (GST 18\%)} = \text{Adjusted Base} \times 0.18$$
   $$\text{Total Annual Premium} = \text{Adjusted Base} + \text{Tax}$$

---

## 11. Claim Eligibility & Validation
Claims undergo a six-point validation gate:
1. **Authorization**: Claimant must be the verified guardian of the insured student.
2. **Policy Status**: Policy must be `ACTIVE` at the time of the incident date.
3. **Waiting Period Check**: Incident date must be subsequent to `waitingPeriodEndsAt` (unless an accidental mortality waiver applies under Scholar Elite).
4. **Covered Event Scope**: Event must be listed within the plan's `coveredEvents`.
5. **Document Verification**: Mandatory identity and event certificates must be attached.
6. **University Registrar Certification**: University representative must verify student roll number and certify outstanding fee balance.

---

## 12. Security Implementation
- **Authentication**: Firebase Authentication handles password encryption, token refreshes, and UID generation.
- **Client Privilege Prevention**: Public registration assigns strictly the `guardian` role. Privileged roles (`claims_officer`, `university`, `admin`) cannot be self-granted by the client.
- **Firestore Security Rules**: Rules enforce least-privilege document access. Audit logs are set to `allow update, delete: if false;` to guarantee immutability.
- **Safe Sanitization**: CSV exports and form inputs are sanitized against CSV injection and script payloads.

---

## 13. System Workflow Diagram

```text
[Guardian] ──> Enter Student & College Details ──> [Deterministic Quote Engine]
                                                              │
                                                     Generates Quote (QTE-XXXX)
                                                              │
[Guardian] ──> Simulated Checkout ───────────────> Policy Bound (EDU-XXXX)
                                                              │
                                                  [Covered Emergency Occurs]
                                                              │
[Guardian] ──> File Claim + Upload Docs ─────────> [AI Document Pre-Screening]
                                                              │
                                                  Readiness Score Evaluated
                                                              │
[University Registrar] ──> Confirm Roll No & Ledger Dues ────┘
                               │
                       Certified Ledger
                               │
[Claims Adjuster] ──> Adjudication (Approved/Rejected)
                               │
                   If Approved: Initiate Remittance
                               │
[University Fee Escrow] <── Direct Bank Transfer (Simulated NEFT/UTR) ── Status: PAID
```

---

## 14. Deployment Architecture
- **Firebase Hosting**: High-performance CDN hosting pre-compiled Vite production assets (`dist/`).
- **Firebase Firestore**: Production multi-region NoSQL store (`edushield-6de64`).
- **Cloud Functions**: Node 18 serverless functions for privileged operations.
- **Local Fallback Engine**: If cloud services operate on Spark free-tier without outbound billing, EduShield automatically falls back to its deterministic local engine, ensuring 100% demo continuity.

---

## 15. Setup and Execution Guide
### Prerequisites
- Node.js v18+ (tested on Node v24)
- Git

### Installation
```bash
git clone <repository-url> edushield
cd edushield
npm install
```

### Running Locally
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Running Automated Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
```

---

## 16. Testing and Results
- **Test Suite**: Vitest + React Testing Library
- **Unit Test Files**:
  - `tests/businessRules.test.ts`: 9/9 tests passed (Premium math, funding gap analysis, Guidewire state machine transitions, readiness checklist).
  - `tests/aiService.test.ts`: 4/4 tests passed (Clause grounding, exclusion citations, waiting period calculation, document screening).
  - `tests/components.test.tsx`: 4/4 tests passed (Badges, Alert components, Stat cards).
- **Total Test Results**: **17 passed / 17 total (100% pass rate)**.
- **Production Build**: Clean compilation in 8.95s generating optimized JavaScript and CSS bundles.

---

## 17. Future Enhancements
1. **Automated Digilocker & NAD Integration**: Direct fetching of official student marksheets and death certificates from India's National Academic Depository (NAD).
2. **Real-Time OCR & Forensic PDF Analysis**: Computer vision models to detect document tampering or certificate forgery.
3. **Smart Contract Escrow on Polygon/Solana**: Transparent, immutable fee disbursements encoded as smart contracts triggered by registrar attestations.
4. **Predictive Dropout Risk Telemetry**: Machine learning analyzing student semester attendance and fee delays to proactively suggest micro-relief grants.
5. **Multi-Currency Cross-Border Tuition Support**: International exchange module managing foreign exchange fluctuations for students studying abroad.

---

## 18. Comprehensive Viva Voce Questions and Answers

### Q1: What is the primary problem that EduShield solves?
**Answer**: EduShield solves the critical problem of higher education discontinuation caused by unexpected household financial catastrophes (death, critical illness, or disability of an earning parent). By providing specialized education insurance linked directly to university fee schedules, it ensures that college tuition fees are paid directly to university registrars, preventing semester deregistration and student dropouts.

### Q2: How does EduShield's architecture take inspiration from Guidewire PolicyCenter and ClaimCenter?
**Answer**: EduShield incorporates Guidewire's core enterprise patterns: distinct insurance domain entities (`Quote`, `Policy`, `Claim`, `Payment`), strict typelist enumerations, a formal finite state machine that forbids illegal status jumps, two-tier institutional verification, transparent claim readiness scoring, and unalterable audit logs.

### Q3: Why is Firebase Firestore well-suited for this insurance platform?
**Answer**: Firestore provides a hierarchical, document-oriented NoSQL model that aligns naturally with insurance relationships (e.g., a Guardian document owning multiple Student and Policy sub-entities). Its declarative security rules enforce role-based access control, and its offline caching guarantees demo reliability even when network connectivity fluctuates.

### Q4: How is Role-Based Access Control (RBAC) enforced across the platform?
**Answer**: RBAC is enforced on three layers: (1) Client-side UI routing and dynamic navigation filtering; (2) Firestore security rules validating `request.auth.token.role` and document ownership; and (3) Server-side Cloud Functions performing explicit permission checks before executing privileged actions.

### Q5: How does the deterministic quote calculation engine work?
**Answer**: The quote engine takes the annual tuition fee, eligible campus expenses, and degree duration to calculate total coverage. It applies a base plan rate (e.g., 2.2% for Foundation, 3.1% for Comprehensive), applies risk adjustments based on student age, incorporates a 10% volume discount for four-year degree commitments, and adds statutory 18% GST to output an itemized annual premium.

### Q6: What is EduShield Continuity Intelligence?
**Answer**: EduShield Continuity Intelligence is the platform's signature innovation suite comprising: (1) an Education Funding-Gap Calculator that projects multi-year liabilities against coverage; (2) a Clause-Grounded AI Policy Explainer; (3) an AI Claim Document Assistant providing structured pre-screening and readiness scores; and (4) explainable advisory recommendations.

### Q7: How does EduShield prevent AI hallucinations in policy explanations?
**Answer**: The AI service does not allow free-form model synthesis. It injects the active policy's verified contractual schedule (coverage caps, waiting period dates, benefit limits, and exclusion lists) into the query context. The response citations strictly map back to predefined policy clauses (e.g., Clause 3.1, Clause 7.4). If a clause does not exist, the assistant explicitly states that the condition is unverified.

### Q8: What is the Claim Readiness Score and how is it calculated?
**Answer**: The Claim Readiness Score is an explainable 0–100% maturity indicator. It evaluates the completion of deterministic mandatory checks: active policy verification, waiting period compliance, identity proof presence, event-specific certificates (death/medical/disability), official university fee demand notes, and registrar verification. It represents submission completeness rather than probability of fraud.

### Q9: Why are claim payouts made directly to the university instead of the parent's bank account?
**Answer**: Direct disbursement to the university registrar's fee escrow account eliminates fund diversion risks. In times of family crisis, indemnity funds sent to personal accounts are frequently depleted by non-academic emergencies (such as medical bills or creditor repayments), still leaving the student vulnerable to semester deregistration.

### Q10: How does the platform handle simulated payments vs. real payment providers?
**Answer**: Following insurance software development ethics, simulated transactions are explicitly labeled with a `SIM-` prefix (e.g., `SIM-TXN-2026-XXXX` and `SIM-NEFT-XXXX`) and clear warnings in the UI. The payment service implements a clean interface that can be hot-swapped for a production payment gateway (such as Razorpay or Stripe) without refactoring the business layer.

### Q11: Explain the finite state machine governing claim lifecycles.
**Answer**: Claims transition strictly through: `DRAFT` $\to$ `SUBMITTED` $\to$ `UNDER_REVIEW` $\to$ `UNIVERSITY_VERIFICATION_PENDING` / `DOCUMENTS_REQUIRED` $\to$ `ASSESSMENT` $\to$ `APPROVED` / `REJECTED` $\to$ `PAYMENT_PROCESSING` $\to$ `PAID` $\to$ `CLOSED`. Any attempt to transition directly from `SUBMITTED` to `PAID` or from `REJECTED` to `APPROVED` without formal review is rejected by `isValidClaimTransition()`.

### Q12: How are collision-resistant policy and claim numbers generated?
**Answer**: Identifiers follow structured conventions: `EDU-YYYY-XXXXXX` for policies, `CLM-YYYY-XXXXXX` for claims, `QTE-YYYY-XXXXXX` for quotes, and `PAY-YYYY-XXXXXX` for payments. They combine domain prefixes, the current calendar year, and randomized entropy tokens to prevent enumeration attacks.

### Q13: What happens if a claim is submitted during the policy waiting period?
**Answer**: The validation engine calculates the delta between the policy effective date and the incident date. If the delta is less than `waitingPeriodDays`, the claim readiness score flags a waiting period violation, and the claims adjuster is prompted to evaluate whether the incident qualifies for an accidental emergency waiver.

### Q14: How does the University Registrar Portal interact with the claims process?
**Answer**: When a claim is filed, an institutional verification task is routed to the university registrar portal. The registrar representative logs in, verifies the student's enrollment and roll number, inspects the fee demand challan, certifies the exact outstanding tuition amount, and marks the case as `VERIFIED`.

### Q15: How does the application support offline demonstration during viva examinations?
**Answer**: The repository layer implements a resilient cache-first and local storage fallback mechanism. If cloud network access is restricted or offline during an academic evaluation, the system seamlessly initializes pre-seeded realistic Indian university and policy records, allowing full end-to-end demonstration.

### Q16: What is the significance of the 18% statutory tax in the premium calculator?
**Answer**: In India, general and non-life insurance services are subject to an 18% Goods and Services Tax (GST) under the regulatory framework of the Insurance Regulatory and Development Authority of India (IRDAI). Incorporating GST reflects real-world actuarial compliance.

### Q17: How are immutable audit logs implemented?
**Answer**: Every major state transition, quote generation, and fee remittance calls `auditService.log()`, which records the user ID, timestamp, entity type, and action details in the `auditLogs` collection. Firestore security rules enforce `allow update, delete: if false;`, ensuring that logs cannot be altered or purged.

### Q18: What is the purpose of the Evaluator Demo Role Switcher?
**Answer**: The Role Switcher dropdown in the navigation bar allows evaluators and professors to instantly switch perspectives between Guardian (Rajesh Sharma), Student (Aarav Sharma), Claims Adjuster (Vikram Mehta), University Registrar (IIT Delhi), and Administrator (Priya Nambiar) with a single click, without having to repeatedly log in and out.

### Q19: How are CSV reports generated securely?
**Answer**: CSV exports in `ReportsPage.tsx` format data strictly in memory, escaping internal quotation marks to prevent CSV injection vulnerabilities, and construct an ephemeral Blob download link without transmitting sensitive data to third-party services.

### Q20: Explain the difference between `requestedAmount`, `eligibleAmount`, and `approvedAmount`.
**Answer**: `requestedAmount` is the figure entered by the claimant. `eligibleAmount` is the amount permitted after applying policy coverage limits and benefit sub-caps. `approvedAmount` is the final sum authorized by the claims adjuster after validating the university fee statement.

### Q21: What testing methodology was employed for the application?
**Answer**: Vitest and React Testing Library were used to execute 17 automated unit and integration tests covering actuarial premium math, multi-year funding-gap projections, Guidewire state transitions, readiness checklist logic, AI clause citations, and UI component rendering.

### Q22: Why did you choose React 18 and Vite over Next.js for this project?
**Answer**: Vite provides lightning-fast compilation, instantaneous Hot Module Replacement (HMR), and clean Single Page Application (SPA) bundling that deploys effortlessly to Firebase Hosting's free tier without requiring Node.js server infrastructure or paid container runtime hosting.

### Q23: How does the system prevent unauthorized privilege escalation during registration?
**Answer**: In `authService.ts`, the registration handler explicitly forces `role = 'guardian'`. Even if a malicious client sends `role: 'admin'` in the request body, Firestore security rules reject non-owner privilege assignment.

### Q24: What are the primary insurance exclusions modeled in EduShield?
**Answer**: Pre-existing chronic illnesses diagnosed prior to policy inception, voluntary student dropouts, disciplinary termination by university academic councils, and reckless self-inflicted injuries.

### Q25: How could EduShield be expanded for commercial production deployment?
**Answer**: Commercial deployment would require: (1) IRDAI regulatory sandbox licensing; (2) Actuarial underwriting certification; (3) Live payment gateway integration; (4) DigiLocker API integration for automated government ID retrieval; and (5) Direct ERP integration with university campus management systems (e.g., SAP Campus Management or Ellucian Banner).
