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
Runs 5 automated test suites with 58 passing unit and integration tests verifying:
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
- **Testing**: Vitest & React Testing Library (67 passed tests across 5 suites)

---

## 📑 Detailed Documentation
See **[`DOCUMENTATION.md`](./DOCUMENTATION.md)** for the complete technical report, database schema, mathematical formulas, and all **25 Viva Voce Questions and Detailed Answers**.
