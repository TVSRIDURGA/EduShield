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
Runs comprehensive automated unit and integration tests verifying:
- Genuine authentication, password reset, and session persistence
- Role-based route guards and access restrictions
- Actuarial premium calculation formulas and statutory GST (18%)
- Education funding-gap projection logic
- Guidewire-inspired finite state transitions
- Document checklist completeness and readiness scoring
- Clause-grounded AI explanation generation

### 4. Build for Production
```bash
npm run build
```
Generates production-optimized JavaScript, CSS, and HTML assets in `dist/`.

---

## 👥 Evaluator Role Accounts & Authentication

EduShield enforces **genuine Firebase Authentication** with persistent sessions and server-enforced role access control. Demo role switching dropdowns have been removed.

To evaluate each independent stakeholder experience, authenticate using the verified credentials below:

| Role | Evaluator Account | Verified Email | Password | Authorized Scope & Key Capabilities |
|---|---|---|---|---|
| **Parent / Guardian** | Rajesh Sharma | `guardian@edushield.demo` | `EduShield@2026` | Calculate quotes, purchase & renew policies, submit claims, register children under 5 universities, view family records |
| **Student** | Aarav Sharma | `student@edushield.demo` | `EduShield@2026` | Dynamic student portal, view degree protections, track claim status, upload evidence |
| **Claims Officer** | Vikram Mehta | `officer@edushield.demo` | `EduShield@2026` | Guidewire ClaimCenter work queue, review evidence, enforce separation of duties, approve claims once university fee verification is satisfied |
| **IIT Delhi Registrar** | Dr. Sunita Deshmukh | `registrar.iitd@edushield.demo` | `EduShield@2026` | IIT Delhi fee portal (`univ_iitd`), verify student enrollment, certify semester dues, direct fee escrow |
| **BITS Pilani Registrar** | Prof. Chandrashekhar Rao | `registrar.bits@edushield.demo` | `EduShield@2026` | BITS Pilani Hyderabad fee portal (`univ_bits`), verify BITS students, audit semester fee ledger |
| **NIT Trichy Registrar** | Dr. K. Balasubramanian | `registrar.nitt@edushield.demo` | `EduShield@2026` | NIT Trichy fee portal (`univ_nitt`), verify NIT student enrollment & outstanding tuition ledger |
| **DU Registrar** | Dr. Vikas Gupta | `registrar.du@edushield.demo` | `EduShield@2026` | University of Delhi fee portal (`univ_du`), verify enrollment, inspect fee demand challans |
| **REVA University Registrar** | Dr. N. Ramesh | `registrar.reva@edushield.demo` | `EduShield@2026` | REVA University fee portal (`univ_reva`), verify Bangalore campus students, confirm tuition dues |
| **Administrator** | Priya Nambiar | `admin@edushield.demo` | `EduShield@2026` | Operations hub, manage user accounts & role assignments across universities, business rules, immutable audit log |

*(The `/login` screen includes an Evaluator Quick-Fill helper that populates email and password fields for each stakeholder, including all five universities).*

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

- **Firebase Authentication**: Establishes genuine cryptographic identity tokens (JWT).
- **Persistent Sessions**: User sessions persist across page refreshes via `onAuthStateChanged`.
- **Role-Protected Routes**: The `ProtectedRoute` component redirects unauthenticated users to `/login` and renders an explicit `UnauthorizedPage` for unauthorized access attempts.
- **Backend Firestore Rules**: Explicit role-aware and ownership-aware Security Rules prevent role self-escalation and cross-tenant access.
- **Separation of Duties**: Claims adjusters cannot self-approve claims where they are the registered policyholder/guardian.
- **Payment Exclusivity**: Payment facilities are accessible strictly to authenticated Parents/Guardians.
- **Immutable Audit Trail**: Sensitive operations (login, role modification, claim adjudication, university verification, and fee settlement) are recorded in the append-only `auditLogs` collection.

---

## 🛠️ Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React
- **Routing**: React Router v6
- **Data Visualizations**: Recharts
- **Database & Auth**: Firebase Firestore & Firebase Authentication (`edushield-6de64`)
- **Serverless**: Firebase Cloud Functions
- **AI Engine**: EduShield Continuity Intelligence (Clause-Grounded Hybrid Engine)
- **Testing**: Vitest & React Testing Library

---

## 📑 Detailed Documentation
See **[`DOCUMENTATION.md`](./DOCUMENTATION.md)** for the complete technical report, database schema, mathematical formulas, and all **25 Viva Voce Questions and Detailed Answers**.
