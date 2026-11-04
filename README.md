# EduShield — AI-Powered Education Insurance Platform
### Final Year B.Tech CSE Project • Inspired by Guidewire PolicyCenter & ClaimCenter

EduShield is an end-to-end, production-oriented cloud platform built to safeguard student higher education against unexpected family financial catastrophes (parental demise, critical illness, permanent disability, and emergency tuition hardship).

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js v18 or higher (tested with Node.js v24)
- npm or pnpm

### 2. Run Local Development Server
```bash
# In project root:
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 3. Run Automated Vitest Test Suite
```bash
npm run test
```
Runs 6 automated test suites with 78 passing unit and integration tests verifying:
- Genuine Firebase authentication, password reset, and session persistence
- Role-based route guards and access restrictions
- Account lifecycle status (`PENDING`, `APPROVED`, `REJECTED`) and administrator-controlled approval workflow
- Prevention of privilege self-assignment on registration
- Actuarial premium calculation formulas and statutory GST (18%)
- Education funding-gap projection logic
- Guidewire-inspired finite state transitions
- Document checklist completeness and readiness scoring
- Clause-grounded AI explanation generation
- Firestore security rules permission matrix & tenant isolation
- Separation of duties & parent-only payment enforcement
- **Enterprise Policy Administration System**:
  - Full 9-module product configuration & template validation
  - Incomplete policy template rejection
  - Centralized eligibility engine with descriptive rejection reasons (age, institution, degree, duration, academic year)
  - Coverage benefit schedules, category waiting periods, and benefit recipient routing
  - Explicit policy exclusion schedules
  - Centralized premium calculation engine with GST, duration discounts, age factors, add-on riders, and quarterly/semi-annual multipliers
  - Financial limits enforcement: sum insured, per-event limits, aggregate caps, deductibles, co-pay %, and emergency sublimits
  - Policy issuance with immutable version snapshotting and verified terms acceptance audit
  - Version immutability verification ensuring subsequent product catalog revisions do not alter existing contracts
  - Policy renewal evaluation: 30-day window, 15-day grace period, 5% renewal discount
  - Policy cancellation refund calculation: Free-Look (15 days, 100% minus stamp fee) vs Short-Period scale vs 0% post-claim
  - Deterministic policy & product status state transitions
  - Strict RBAC enforcement preventing students & claims officers from policy purchasing or catalog configuration

### 4. Build for Production
```bash
npm run build
```
Generates production-optimized JavaScript, CSS, and HTML assets in `dist/`.

---

## 👥 Evaluator Role Accounts & Authentication

EduShield enforces **genuine Firebase Authentication** with persistent sessions and server-enforced role access control. Demo role switching dropdowns have been removed from the application.

Evaluator accounts are provisioned for testing each independent stakeholder experience:

| Role | Evaluator Account | Verified Email | Credential Provisioning | Authorized Scope & Key Capabilities |
|---|---|---|---|---|
| **Parent / Guardian** | Rajesh Sharma | `guardian@edushield.demo` | Provisioned via Secure Seed / In-App Evaluator Helper | Calculate quotes, purchase & renew policies, submit claims, register children under 5 universities, view family records |
| **Student** | Aarav Sharma | `student@edushield.demo` | Provisioned via Secure Seed / In-App Evaluator Helper | Dynamic student portal, view degree protections, track claim status, upload evidence |
| **Claims Officer** | Vikram Mehta | `officer@edushield.demo` | Provisioned via Secure Seed / In-App Evaluator Helper | Guidewire ClaimCenter work queue, review evidence, enforce separation of duties, approve claims once university fee verification is satisfied |
| **IIT Delhi Registrar** | Dr. Sunita Deshmukh | `registrar.iitd@edushield.demo` | Provisioned via Secure Seed / In-App Evaluator Helper | IIT Delhi fee portal (`univ_iitd`), verify student enrollment, certify semester dues, direct fee escrow |
| **BITS Pilani Registrar** | Prof. Chandrashekhar Rao | `registrar.bits@edushield.demo` | Provisioned via Secure Seed / In-App Evaluator Helper | BITS Pilani Hyderabad fee portal (`univ_bits`), verify BITS students, audit semester fee ledger |
| **NIT Trichy Registrar** | Dr. K. Balasubramanian | `registrar.nitt@edushield.demo` | Provisioned via Secure Seed / In-App Evaluator Helper | NIT Trichy fee portal (`univ_nitt`), verify NIT student enrollment & outstanding tuition ledger |
| **DU Registrar** | Dr. Vikas Gupta | `registrar.du@edushield.demo` | Provisioned via Secure Seed / In-App Evaluator Helper | University of Delhi fee portal (`univ_du`), verify enrollment, inspect fee demand challans |
| **REVA University Registrar** | Dr. N. Ramesh | `registrar.reva@edushield.demo` | Provisioned via Secure Seed / In-App Evaluator Helper | REVA University fee portal (`univ_reva`), verify Bangalore campus students, confirm tuition dues |
| **Administrator** | Priya Nambiar | `admin@edushield.demo` | Provisioned via Secure Seed / In-App Evaluator Helper | Operations hub, manage user accounts & role assignments across universities, business rules, immutable audit log |

*(The `/login` screen includes an in-app Evaluator Quick-Fill helper that populates email and credentials into the genuine Firebase Authentication form for evaluator convenience without bypassing authentication)*.

---

### 🏛️ Five Universities Supported

1. **Indian Institute of Technology Delhi (IIT Delhi)** — ID: `univ_iitd`
2. **BITS Pilani – Hyderabad Campus** — ID: `univ_bits`
3. **National Institute of Technology Tiruchirappalli (NIT Trichy)** — ID: `univ_nitt`
4. **University of Delhi (Cluster Innovation Centre / Faculty of Technology)** — ID: `univ_du`
5. **REVA University, Bengaluru** — ID: `univ_reva`

Each university has dedicated authentication, isolated fee verification queues, and institutional escrow bank details. Cross-university data leakage is strictly prevented at both the application level and via backend Firestore Security Rules.

---

## 🔒 Security & Authorization Architecture

1. **Firebase Authentication**: Establishes genuine cryptographic identity tokens (JWT) with persistent sessions across page refreshes.
2. **Strict Role Authorization**: No default guardian role fallback. Unknown or unassigned roles are denied access and display an explicit `Account Access Pending` status.
3. **Role-Protected Routes**: `ProtectedRoute` verifies token roles and redirects unauthorized access attempts to `UnauthorizedPage`.
4. **Backend Firestore Security Rules**:
   - User profile reads are restricted to the document owner and authorized administrators.
   - Profile updates prevent non-administrators from tampering with protected identity, role, ownership (`id`, `uid`, `email`), or `universityId` fields.
   - Student profile updates prevent altering student ID, guardian ID, university ID, or creation timestamp.
   - Parent and student claim updates are restricted strictly to document uploads and readiness metadata; altering decisions, approved amounts, status, or settlements is denied.
   - Claims officers can adjudicate claims but cannot modify university verification records.
   - Claims officers cannot approve claims while university fee verification is pending, in discrepancy, or incomplete.
   - Separation of duties strictly prohibits claims officers from adjudicating or disbursing payments for their own family claims.
   - University registrars can only access and certify claims for their designated `universityId`.
   - Notifications updates are restricted to marking `read` by the recipient.
   - Audit records must bind to the authenticated caller to resist spoofing, and are strictly immutable (update and delete denied).
   - Policy payment initiation is restricted exclusively to authenticated Parents/Guardians.
5. **Deterministic State Machine**: Every claim status transition is validated against `ALLOWED_CLAIM_TRANSITIONS`.

---

## 📦 Deployment & Configuration

### 1. Firebase Rules Deployment
To deploy the security rules and Firestore indexes to your Firebase project:
```bash
# Login to Firebase CLI
firebase login

# Select active project
firebase use edushield-6de64

# Deploy Firestore Security Rules and Indexes
firebase deploy --only firestore:rules,firestore:indexes
```

### 2. Vercel SPA Routing Configuration
The single-page application routing is preserved via [`vercel.json`](./vercel.json):
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 3. Environment Variables
Client configurations are managed via `.env` (copy from [`.env.example`](./.env.example)):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_USE_FIREBASE_EMULATOR` (Set `true` when connecting to local emulator suite)

### 4. Administrator Account Provisioning Workflow
EduShield provides a built-in administrative approval and role provisioning console at `/admin/users`:
1. When a new user authenticates without a pre-assigned role, their account is registered with `accountStatus: 'PENDING'` and `role: null`.
2. The user sees an informational **Account Access Pending** screen displaying their email, dynamic User ID, and a **Check Status** button.
3. The Administrator signs in with `admin@edushield.demo`, navigates to `/admin/users`, and views the **Pending Approvals** banner and queue.
4. The Administrator clicks **Review & Approve**, selects the authorized role (`guardian`, `student`, `claims_officer`, `university`, `admin`), assigns the partner university if role is `university`, and sets status to `APPROVED`.
5. The approval and role changes are immutably signed and recorded in `auditLogs`.
6. The user clicks **Check Status** on their pending screen (or refreshes the page) and is immediately granted access to their role-specific dashboard.

#### Manual Provisioning via Firebase Console
If an account is created directly in the Firebase Console:
1. Under **Authentication** $\to$ **Users**, create the user account and copy the generated **User UID**.
2. Under **Firestore Database**, create a document in `users` collection with Document ID set to the **User UID**.
3. Set the fields:
   - `id`: `<User UID>`
   - `uid`: `<User UID>`
   - `email`: user's email address
   - `displayName`: user's full name
   - `role`: `'guardian'` | `'student'` | `'claims_officer'` | `'university'` | `'admin'`
   - `accountStatus`: `'APPROVED'`
   - `universityId`: `'univ_iitd'` | `'univ_bits'` | `'univ_nitt'` | `'univ_du'` | `'univ_reva'` (if role is university)
   - `createdAt`: ISO 8601 timestamp
   - `updatedAt`: ISO 8601 timestamp

---

## 🛠️ Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React
- **Routing**: React Router v6
- **Data Visualizations**: Recharts
- **Database & Auth**: Firebase Firestore & Firebase Authentication (`edushield-6de64`)
- **Serverless**: Firebase Cloud Functions v2
- **AI Engine**: EduShield Continuity Intelligence (Clause-Grounded Hybrid Engine)
- **Testing**: Vitest & React Testing Library (78 passed tests across 6 suites)

---

## 🛡️ Enterprise Insurance Policy Administration Architecture

EduShield's insurance policy administration follows enterprise architecture standards inspired by Guidewire PolicyCenter, establishing a strict boundary between two distinct policy concepts:

### A. Insurance Product / Policy Template (Administrator-Managed)
The catalog definition created, versioned, and managed by the System Administrator across **9 Mandatory Configuration Modules**:
1. **Basic Policy Information**: Code, name, tier, version, duration options, effective/expiry dates, status lifecycle (`DRAFT`, `UNDER_REVIEW`, `APPROVED`, `PUBLISHED`, `SUSPENDED`, `WITHDRAWN`).
2. **Eligibility Criteria Engine**: Age boundaries, allowed degree types (`UNDERGRADUATE`, `POSTGRADUATE`, `DIPLOMA`), course duration limits, eligible partner universities, mandatory verification document checks with descriptive rejection feedback.
3. **Covered Risks & Benefits Schedule**: Defined benefit categories (`PARENT_DEATH`, `PERMANENT_DISABILITY`, `CRITICAL_ILLNESS`, `TUITION_CONTINUATION`, `EMERGENCY_MEDICAL`), waiting periods, benefit recipient (`UNIVERSITY_DIRECT` fee escrow vs `GUARDIAN_REIMBURSEMENT`), and optional add-on riders.
4. **Policy Exclusions Schedule**: Explicit exclusion clauses with condition scopes and non-compensable risk definitions.
5. **Premium Calculation Engine**: Base rate % on annual cover, flat administrative base fee, age factor bands, multi-year duration discounts, add-on rider premiums, statutory 18% GST, and payment frequency multipliers (`ANNUAL` 1.0x, `SEMI_ANNUAL` 0.52x, `QUARTERLY` 0.27x).
6. **Financial Limits & Deductibles**: Sum insured, per-event claim limits, annual/aggregate caps, deductible amounts, co-payment percentages, and category sublimits.
7. **Policy Issuance Requirements**: Mandatory declarations, student enrollment validation, and identity binding.
8. **Policy Renewal Conditions**: 30-day renewal window, 15-day grace period, 5% no-claim renewal discount, and term extension.
9. **Cancellation & Refund Scale**: 15-day Free-Look cancellation (100% refund less ₹100 stamp duty), short-period retention scale for mid-term cancellations, and strict 0% refund clause if any claim has been registered.

### B. Issued Insurance Policy (Immutable Contract Snapshot)
When an authenticated Parent/Guardian purchases a policy for an enrolled student:
- The system generates an immutable `versionSnapshot` capturing the complete product state at that exact instant.
- Terms acceptance is recorded with cryptographic timestamps, user ID, email, and confirmed declarations (`TermsAcceptanceRecord`).
- **Subsequent product catalog revisions, tariff hikes, or rule alterations NEVER silently alter or mutate existing issued contracts.**

> [!NOTE]
> **Actuarial Disclaimer**: All premium tariffs, factor multipliers, and discount rates within EduShield configurations are clearly identified illustrative project simulation data designed for academic demonstration and final-year evaluation. In production deployments, tariffs require formal actuarial certification.

---

## 📑 Detailed Documentation
See **[`DOCUMENTATION.md`](./DOCUMENTATION.md)** for the complete technical report, database schema, mathematical formulas, and all **25 Viva Voce Questions and Detailed Answers**.
