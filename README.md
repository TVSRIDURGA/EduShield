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
| **Parent / Guardian** | Rajesh Sharma | `guardian@edushield.demo` | `EduShield@2026` | Calculate quotes, purchase & renew policies, submit claims, register children, view family records |
| **Student** | Aarav Sharma | `student@edushield.demo` | `EduShield@2026` | Dynamic IIT Delhi student portal, view degree protections, track claim status, upload evidence |
| **Claims Officer** | Vikram Mehta | `officer@edushield.demo` | `EduShield@2026` | Guidewire ClaimCenter work queue, review evidence, record adjudication decisions, enforce separation of duties |
| **University Registrar** | Dr. Sunita Deshmukh | `university@edushield.demo` | `EduShield@2026` | IIT Delhi Registrar fee portal, verify student enrollment, certify semester dues, direct fee escrow |
| **Administrator** | Priya Nambiar | `admin@edushield.demo` | `EduShield@2026` | Operations hub, manage user accounts & role assignments, business rules, immutable audit log |

*(The `/login` screen includes an Evaluator Quick-Fill helper that populates the email and password form fields for rapid evaluation while still executing real Firebase Authentication).*

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
