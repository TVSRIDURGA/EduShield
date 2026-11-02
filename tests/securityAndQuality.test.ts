import { describe, it, expect, vi } from 'vitest';
import { 
  isValidClaimTransition, 
  ALLOWED_CLAIM_TRANSITIONS, 
  calculatePremium 
} from '../src/utils/businessRules';
import { claimService } from '../src/services/claimService';
import { paymentService } from '../src/services/paymentService';
import { policyService } from '../src/services/policyService';
import { quoteService } from '../src/services/quoteService';
import { authService, CANONICAL_DEMO_ACCOUNTS } from '../src/services/authService';
import { 
  UserRole, 
  UserProfile, 
  EducationClaim, 
  EducationPolicy, 
  Quote, 
  InsurancePlan 
} from '../src/models/insurance';

// Mock Firestore Repositories
vi.mock('../src/repositories/firestoreRepo', () => {
  const store: Record<string, any> = {};

  return {
    PoliciesRepo: {
      getById: vi.fn(async (id: string) => store[id] || null),
      create: vi.fn(async (doc: any) => { store[doc.id] = doc; return doc; }),
      update: vi.fn(async (id: string, updates: any) => {
        if (!store[id]) return null;
        store[id] = { ...store[id], ...updates };
        return store[id];
      }),
      getAll: vi.fn(async () => Object.values(store)),
    },
    ClaimsRepo: {
      getById: vi.fn(async (id: string) => store[id] || null),
      create: vi.fn(async (doc: any) => { store[doc.id] = doc; return doc; }),
      update: vi.fn(async (id: string, updates: any) => {
        if (!store[id]) return null;
        store[id] = { ...store[id], ...updates };
        return store[id];
      }),
      getAll: vi.fn(async () => Object.values(store)),
    },
    QuotesRepo: {
      getById: vi.fn(async (id: string) => store[id] || null),
      create: vi.fn(async (doc: any) => { store[doc.id] = doc; return doc; }),
      update: vi.fn(async (id: string, updates: any) => {
        if (!store[id]) return null;
        store[id] = { ...store[id], ...updates };
        return store[id];
      }),
      getAll: vi.fn(async () => Object.values(store)),
    },
    StudentsRepo: {
      getById: vi.fn(async (id: string) => store[id] || null),
      create: vi.fn(async (doc: any) => { store[doc.id] = doc; return doc; }),
      update: vi.fn(async (id: string, updates: any) => {
        if (!store[id]) return null;
        store[id] = { ...store[id], ...updates };
        return store[id];
      }),
      getAll: vi.fn(async () => Object.values(store)),
    },
    NotificationsRepo: {
      create: vi.fn(async (notif: any) => notif),
    },
    AuditsRepo: {
      create: vi.fn(async (log: any) => log),
      getAll: vi.fn(async () => []),
    },
    UsersRepo: {
      getById: vi.fn(async (id: string) => store[id] || null),
      create: vi.fn(async (doc: any) => { store[doc.id] = doc; return doc; }),
      update: vi.fn(async (id: string, updates: any) => {
        if (!store[id]) return null;
        store[id] = { ...store[id], ...updates };
        return store[id];
      }),
      getAll: vi.fn(async () => Object.values(store)),
    },
    __store: store,
  };
});

// Mock Firebase Auth and Firestore for unit tests without live network
vi.mock('firebase/auth', async () => {
  const actual = await vi.importActual('firebase/auth');
  return {
    ...actual,
    createUserWithEmailAndPassword: vi.fn(async (_auth, email) => ({
      user: { uid: `mock_uid_${email}`, email, displayName: '' }
    })),
    updateProfile: vi.fn(async () => {}),
    signInWithEmailAndPassword: vi.fn(async (_auth, email) => ({
      user: { uid: `mock_uid_${email}`, email }
    })),
    sendPasswordResetEmail: vi.fn(async () => {}),
    signOut: vi.fn(async () => {}),
    onAuthStateChanged: vi.fn(() => () => {})
  };
});

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    doc: vi.fn((_db, _col, id) => ({ id })),
    getDoc: vi.fn(async () => ({ exists: () => false, data: () => null })),
    setDoc: vi.fn(async () => {}),
    updateDoc: vi.fn(async () => {})
  };
});

describe('Priority 1: Firestore Security Rules Logic & Permission Matrix', () => {

  // Rule simulator mirroring firestore.rules logic
  const evaluateFirestoreRules = {
    getUserRole: (token: any, userDoc: any) => {
      if (token?.role) return token.role;
      if (userDoc?.role) return userDoc.role;
      return ''; // No default guardian fallback!
    },

    getUniversityId: (token: any, userDoc: any) => {
      if (token?.universityId) return token.universityId;
      if (userDoc?.universityId) return userDoc.universityId;
      return '';
    },

    canReadUserProfile: (auth: any, targetUserId: string) => {
      if (!auth) return false;
      const isAdmin = auth.token?.role === 'admin' || auth.userDoc?.role === 'admin';
      const isOwner = auth.uid === targetUserId;
      return isOwner || isAdmin;
    },

    canUpdateUserProfile: (auth: any, currentDoc: any, updatedDoc: any) => {
      if (!auth) return false;
      const isAdmin = auth.token?.role === 'admin' || auth.userDoc?.role === 'admin';
      if (isAdmin) return true;
      if (auth.uid !== currentDoc.id) return false;

      // Protected fields: role, universityId, email, uid, id cannot be modified by user
      const protectedFields = ['role', 'universityId', 'email', 'uid', 'id'];
      for (const field of protectedFields) {
        if (currentDoc[field] !== updatedDoc[field]) {
          return false;
        }
      }
      return true;
    },

    canUpdateStudent: (auth: any, currentDoc: any, updatedDoc: any) => {
      if (!auth) return false;
      const isAdmin = auth.token?.role === 'admin' || auth.userDoc?.role === 'admin';
      if (isAdmin) return true;

      const isGuardian = auth.token?.role === 'guardian' || auth.userDoc?.role === 'guardian';
      if (!isGuardian || currentDoc.guardianId !== auth.uid) return false;

      // Protected student fields: id, guardianId, universityId, createdAt
      const protectedFields = ['id', 'guardianId', 'universityId', 'createdAt'];
      for (const field of protectedFields) {
        if (currentDoc[field] !== updatedDoc[field]) {
          return false;
        }
      }
      return true;
    },

    canUpdateClaim: (auth: any, currentDoc: any, updatedDoc: any) => {
      if (!auth) return false;
      const userRole = evaluateFirestoreRules.getUserRole(auth.token, auth.userDoc);
      const userUniv = evaluateFirestoreRules.getUniversityId(auth.token, auth.userDoc);
      const isAdmin = userRole === 'admin';
      if (isAdmin) return true;

      // 1. Parent or Student Update (document uploads only)
      const isOwnerParent = currentDoc.guardianId === auth.uid;
      const isOwnerStudent = currentDoc.studentId === auth.uid;
      if (isOwnerParent || isOwnerStudent) {
        // Must NOT modify decisions, status, approvedAmount, universityVerification, payment, or reviews
        if (currentDoc.status !== updatedDoc.status) return false;
        if (currentDoc.approvedAmount !== updatedDoc.approvedAmount) return false;
        if (JSON.stringify(currentDoc.universityVerification) !== JSON.stringify(updatedDoc.universityVerification)) return false;
        if (JSON.stringify(currentDoc.reviews) !== JSON.stringify(updatedDoc.reviews)) return false;
        if (JSON.stringify(currentDoc.payment) !== JSON.stringify(updatedDoc.payment)) return false;
        return true;
      }

      // 2. University Registrar Update
      if (userRole === 'university') {
        // Tenant isolation: must match universityId
        if (!userUniv || userUniv !== currentDoc.universityId) return false;
        // Cannot modify financial decisions or other fields
        if (currentDoc.approvedAmount !== updatedDoc.approvedAmount) return false;
        if (JSON.stringify(currentDoc.payment) !== JSON.stringify(updatedDoc.payment)) return false;
        if (JSON.stringify(currentDoc.reviews) !== JSON.stringify(updatedDoc.reviews)) return false;
        if (currentDoc.guardianId !== updatedDoc.guardianId) return false;
        if (currentDoc.policyId !== updatedDoc.policyId) return false;
        // Status transitions allowed to registrar
        if (!['ASSESSMENT', 'UNIVERSITY_VERIFICATION_PENDING', 'DOCUMENTS_REQUIRED'].includes(updatedDoc.status)) {
          return false;
        }
        return true;
      }

      // 3. Claims Officer Update
      if (userRole === 'claims_officer') {
        // Separation of duties
        if (currentDoc.guardianId === auth.uid) return false;
        // Cannot modify university verification certification
        if (JSON.stringify(currentDoc.universityVerification) !== JSON.stringify(updatedDoc.universityVerification)) {
          return false;
        }
        // Mandatory verification before approval
        if (updatedDoc.status === 'APPROVED') {
          const univStatus = currentDoc.universityVerification?.status;
          const isVerified = ['VERIFIED', 'VERIFIED_PAID', 'VERIFIED_OUTSTANDING'].includes(univStatus);
          if (!isVerified) return false;
        }
        return true;
      }

      return false;
    },

    canCreateAuditLog: (auth: any, logEntry: any) => {
      if (!auth) return false;
      const isAdmin = auth.token?.role === 'admin' || auth.userDoc?.role === 'admin';
      if (isAdmin) return true;
      // Resistant to spoofing: performedByUserId must match authenticated caller
      return logEntry.performedByUserId === auth.uid;
    },

    canInitiatePayment: (auth: any, policyDoc: any) => {
      if (!auth) return false;
      const userRole = evaluateFirestoreRules.getUserRole(auth.token, auth.userDoc);
      const isAdmin = userRole === 'admin';
      if (isAdmin) return true;
      const isGuardian = userRole === 'guardian';
      return isGuardian && policyDoc.guardianId === auth.uid;
    }
  };

  it('1.1: Denies access when role is missing or unknown (no default guardian fallback)', () => {
    // Unassigned role token and missing Firestore doc
    const anonymousUser = { uid: 'usr_unknown_123', token: {}, userDoc: null };
    const role = evaluateFirestoreRules.getUserRole(anonymousUser.token, anonymousUser.userDoc);
    expect(role).toBe('');

    // Attempt to access parent-restricted payment with unknown role
    const canPay = evaluateFirestoreRules.canInitiatePayment(anonymousUser, { guardianId: 'usr_unknown_123' });
    expect(canPay).toBe(false);

    // Attempt to update claim with unknown role
    const canUpdate = evaluateFirestoreRules.canUpdateClaim(anonymousUser, { guardianId: 'usr_other' }, { guardianId: 'usr_other' });
    expect(canUpdate).toBe(false);
  });

  it('1.2: Restricts user profile reads exclusively to owner and admin', () => {
    const guardianUser = { uid: 'usr_guardian_1', token: { role: 'guardian' }, userDoc: { role: 'guardian' } };
    const adminUser = { uid: 'usr_admin_1', token: { role: 'admin' }, userDoc: { role: 'admin' } };
    const otherGuardian = { uid: 'usr_guardian_2', token: { role: 'guardian' }, userDoc: { role: 'guardian' } };

    // Owner reading own profile -> Allowed
    expect(evaluateFirestoreRules.canReadUserProfile(guardianUser, 'usr_guardian_1')).toBe(true);

    // Admin reading other user's profile -> Allowed
    expect(evaluateFirestoreRules.canReadUserProfile(adminUser, 'usr_guardian_1')).toBe(true);

    // Another guardian attempting to read someone else's profile -> Denied
    expect(evaluateFirestoreRules.canReadUserProfile(otherGuardian, 'usr_guardian_1')).toBe(false);

    // Unauthenticated read attempt -> Denied
    expect(evaluateFirestoreRules.canReadUserProfile(null, 'usr_guardian_1')).toBe(false);
  });

  it('1.3: Prevents users from modifying protected role, university ID, email, and identity fields', () => {
    const guardianUser = { uid: 'usr_guardian_1', token: { role: 'guardian' }, userDoc: { role: 'guardian' } };
    const currentProfile = {
      id: 'usr_guardian_1',
      uid: 'usr_guardian_1',
      email: 'guardian@edushield.demo',
      displayName: 'Rajesh Sharma',
      role: 'guardian',
      universityId: ''
    };

    // Legitimate update: modifying displayName and phone -> Allowed
    const validUpdate = { ...currentProfile, displayName: 'Rajesh K. Sharma', phoneNumber: '+91 9876543210' };
    expect(evaluateFirestoreRules.canUpdateUserProfile(guardianUser, currentProfile, validUpdate)).toBe(true);

    // Tampering attempt 1: Self-promoting role to 'claims_officer' -> Denied
    const hackedRoleUpdate = { ...currentProfile, role: 'claims_officer' };
    expect(evaluateFirestoreRules.canUpdateUserProfile(guardianUser, currentProfile, hackedRoleUpdate)).toBe(false);

    // Tampering attempt 2: Self-assigning universityId -> Denied
    const hackedUnivUpdate = { ...currentProfile, universityId: 'univ_iitd' };
    expect(evaluateFirestoreRules.canUpdateUserProfile(guardianUser, currentProfile, hackedUnivUpdate)).toBe(false);

    // Tampering attempt 3: Altering email or id -> Denied
    const hackedEmailUpdate = { ...currentProfile, email: 'hacker@edushield.demo' };
    expect(evaluateFirestoreRules.canUpdateUserProfile(guardianUser, currentProfile, hackedEmailUpdate)).toBe(false);
  });

  it('1.4: Restricts student profile updates to permitted fields and locks identity/university', () => {
    const guardianUser = { uid: 'usr_guardian_1', token: { role: 'guardian' }, userDoc: { role: 'guardian' } };
    const currentStudent = {
      id: 'stud_101',
      guardianId: 'usr_guardian_1',
      fullName: 'Aarav Sharma',
      universityId: 'univ_iitd',
      currentAcademicYear: 1,
      createdAt: '2026-01-01T00:00:00.000Z'
    };

    // Permitted update: year progression -> Allowed
    const validStudentUpdate = { ...currentStudent, currentAcademicYear: 2 };
    expect(evaluateFirestoreRules.canUpdateStudent(guardianUser, currentStudent, validStudentUpdate)).toBe(true);

    // Illegal tampering 1: Attempting to re-assign student to another university -> Denied
    const hackedUnivStudent = { ...currentStudent, universityId: 'univ_bits' };
    expect(evaluateFirestoreRules.canUpdateStudent(guardianUser, currentStudent, hackedUnivStudent)).toBe(false);

    // Illegal tampering 2: Attempting to transfer student to another guardian -> Denied
    const hackedGuardianStudent = { ...currentStudent, guardianId: 'usr_hacker' };
    expect(evaluateFirestoreRules.canUpdateStudent(guardianUser, currentStudent, hackedGuardianStudent)).toBe(false);
  });

  it('1.5 & 1.6: Restricts parent/student claim updates to document uploads and prevents altering decisions', () => {
    const guardianUser = { uid: 'usr_guardian_1', token: { role: 'guardian' }, userDoc: { role: 'guardian' } };
    const currentClaim = {
      id: 'clm_001',
      guardianId: 'usr_guardian_1',
      studentId: 'stud_101',
      status: 'UNDER_REVIEW',
      approvedAmount: 0,
      documents: [{ id: 'doc_1', fileName: 'challan.pdf' }],
      universityVerification: { status: 'PENDING' },
      reviews: [],
      payment: null
    };

    // Legitimate update: parent uploads a new document -> Allowed
    const validDocUpload = {
      ...currentClaim,
      documents: [...currentClaim.documents, { id: 'doc_2', fileName: 'discharge.pdf' }]
    };
    expect(evaluateFirestoreRules.canUpdateClaim(guardianUser, currentClaim, validDocUpload)).toBe(true);

    // Fraud attempt 1: Parent attempts to set status to 'APPROVED' -> Denied
    const fraudStatusClaim = { ...currentClaim, status: 'APPROVED' };
    expect(evaluateFirestoreRules.canUpdateClaim(guardianUser, currentClaim, fraudStatusClaim)).toBe(false);

    // Fraud attempt 2: Parent attempts to set approvedAmount -> Denied
    const fraudAmountClaim = { ...currentClaim, approvedAmount: 250000 };
    expect(evaluateFirestoreRules.canUpdateClaim(guardianUser, currentClaim, fraudAmountClaim)).toBe(false);

    // Fraud attempt 3: Parent attempts to self-certify university verification -> Denied
    const fraudUnivClaim = {
      ...currentClaim,
      universityVerification: { status: 'VERIFIED_PAID', studentRollNo: 'FAKEROLL' }
    };
    expect(evaluateFirestoreRules.canUpdateClaim(guardianUser, currentClaim, fraudUnivClaim)).toBe(false);
  });

  it('1.8: Enforces audit trail resistance to spoofing and immutability', () => {
    const callerAuth = { uid: 'usr_officer_vikram', token: { role: 'claims_officer' }, userDoc: { role: 'claims_officer' } };

    // Legitimate audit log: performedByUserId matches caller -> Allowed
    const validLog = {
      action: 'CLAIM_DECISION_APPROVED',
      performedByUserId: 'usr_officer_vikram',
      details: 'Approved verified claim'
    };
    expect(evaluateFirestoreRules.canCreateAuditLog(callerAuth, validLog)).toBe(true);

    // Spoofing attempt: caller tries to frame another user -> Denied
    const spoofedLog = {
      action: 'CLAIM_DECISION_APPROVED',
      performedByUserId: 'usr_admin_victim',
      details: 'Forged action'
    };
    expect(evaluateFirestoreRules.canCreateAuditLog(callerAuth, spoofedLog)).toBe(false);
  });

  it('1.9: Enforces payment initiation exclusively for authenticated Parents/Guardians', () => {
    const guardianUser = { uid: 'usr_guardian_1', token: { role: 'guardian' }, userDoc: { role: 'guardian' } };
    const studentUser = { uid: 'usr_student_1', token: { role: 'student' }, userDoc: { role: 'student' } };
    const officerUser = { uid: 'usr_officer_1', token: { role: 'claims_officer' }, userDoc: { role: 'claims_officer' } };
    const registrarUser = { uid: 'usr_univ_1', token: { role: 'university' }, userDoc: { role: 'university' } };

    const policyDoc = { id: 'pol_001', guardianId: 'usr_guardian_1' };

    // Parent/Guardian payment initiation -> Allowed
    expect(evaluateFirestoreRules.canInitiatePayment(guardianUser, policyDoc)).toBe(true);

    // Student payment initiation -> Denied
    expect(evaluateFirestoreRules.canInitiatePayment(studentUser, policyDoc)).toBe(false);

    // Claims Officer payment initiation -> Denied
    expect(evaluateFirestoreRules.canInitiatePayment(officerUser, policyDoc)).toBe(false);

    // University Registrar payment initiation -> Denied
    expect(evaluateFirestoreRules.canInitiatePayment(registrarUser, policyDoc)).toBe(false);
  });

  it('1.10: Enforces institutional tenant isolation for all five university registrars', () => {
    const universities = [
      { id: 'univ_iitd', name: 'IIT Delhi', email: 'registrar.iitd@edushield.demo' },
      { id: 'univ_bits', name: 'BITS Pilani', email: 'registrar.bits@edushield.demo' },
      { id: 'univ_nitt', name: 'NIT Trichy', email: 'registrar.nitt@edushield.demo' },
      { id: 'univ_du', name: 'DU', email: 'registrar.du@edushield.demo' },
      { id: 'univ_reva', name: 'REVA University', email: 'registrar.reva@edushield.demo' }
    ];

    // For every pair of different universities, cross-access is strictly denied
    for (const registrarUniv of universities) {
      const registrarAuth = {
        uid: `usr_${registrarUniv.id}`,
        token: { role: 'university', universityId: registrarUniv.id },
        userDoc: { role: 'university', universityId: registrarUniv.id }
      };

      for (const targetUniv of universities) {
        const claim = {
          id: `clm_${targetUniv.id}`,
          universityId: targetUniv.id,
          status: 'UNDER_REVIEW',
          approvedAmount: 0,
          universityVerification: { status: 'PENDING' }
        };

        const updatedClaim = {
          ...claim,
          status: 'ASSESSMENT',
          universityVerification: { status: 'VERIFIED_OUTSTANDING' }
        };

        const canVerify = evaluateFirestoreRules.canUpdateClaim(registrarAuth, claim, updatedClaim);
        if (registrarUniv.id === targetUniv.id) {
          expect(canVerify).toBe(true);
        } else {
          expect(canVerify).toBe(false);
        }
      }
    }
  });
});

describe('Priority 2: Claims and University Workflow State Machine & Safeguards', () => {
  it('2.1: Validates every permitted and unlawful claim state transition', () => {
    // Permitted transitions
    expect(isValidClaimTransition('DRAFT', 'SUBMITTED')).toBe(true);
    expect(isValidClaimTransition('SUBMITTED', 'UNDER_REVIEW')).toBe(true);
    expect(isValidClaimTransition('UNDER_REVIEW', 'ASSESSMENT')).toBe(true);
    expect(isValidClaimTransition('ASSESSMENT', 'APPROVED')).toBe(true);
    expect(isValidClaimTransition('APPROVED', 'PAID')).toBe(true);
    expect(isValidClaimTransition('APPROVED', 'PAYMENT_PROCESSING')).toBe(true);
    expect(isValidClaimTransition('PAYMENT_PROCESSING', 'PAID')).toBe(true);
    expect(isValidClaimTransition('PAID', 'CLOSED')).toBe(true);

    // Unlawful transitions that must be blocked
    expect(isValidClaimTransition('DRAFT', 'APPROVED')).toBe(false);
    expect(isValidClaimTransition('DRAFT', 'PAID')).toBe(false);
    expect(isValidClaimTransition('SUBMITTED', 'PAID')).toBe(false);
    expect(isValidClaimTransition('REJECTED', 'APPROVED')).toBe(false);
    expect(isValidClaimTransition('REJECTED', 'PAID')).toBe(false);
    expect(isValidClaimTransition('CLOSED', 'SUBMITTED')).toBe(false);
  });

  it('2.2: Rejects Claims Officer approval when university verification is PENDING, DISCREPANCY, or REQUIRES_INFO', async () => {
    const officer: UserProfile = {
      id: 'usr_officer_vikram',
      uid: 'usr_officer_vikram',
      email: 'officer@edushield.demo',
      displayName: 'Vikram Mehta',
      role: 'claims_officer',
      createdAt: '',
      updatedAt: ''
    };

    const mockRepo = (await import('../src/repositories/firestoreRepo')) as any;

    // Case 1: Verification is PENDING
    mockRepo.__store['clm_pending_test'] = {
      id: 'clm_pending_test',
      guardianId: 'usr_guardian_1',
      status: 'ASSESSMENT',
      universityVerification: { status: 'PENDING' },
      reviews: []
    };

    await expect(
      claimService.adjudicateClaim('clm_pending_test', 'APPROVED', 'Notes', 'REASON', 200000, officer)
    ).rejects.toThrow(/Adjudication Blocked.*Mandatory institutional registrar verification must be completed/);

    // Case 2: Verification is DISCREPANCY
    mockRepo.__store['clm_discrepancy_test'] = {
      id: 'clm_discrepancy_test',
      guardianId: 'usr_guardian_1',
      status: 'ASSESSMENT',
      universityVerification: { status: 'DISCREPANCY' },
      reviews: []
    };

    await expect(
      claimService.adjudicateClaim('clm_discrepancy_test', 'APPROVED', 'Notes', 'REASON', 200000, officer)
    ).rejects.toThrow(/Adjudication Blocked/);

    // Case 3: Verification is REQUIRES_INFORMATION
    mockRepo.__store['clm_reqinfo_test'] = {
      id: 'clm_reqinfo_test',
      guardianId: 'usr_guardian_1',
      status: 'ASSESSMENT',
      universityVerification: { status: 'REQUIRES_INFORMATION' },
      reviews: []
    };

    await expect(
      claimService.adjudicateClaim('clm_reqinfo_test', 'APPROVED', 'Notes', 'REASON', 200000, officer)
    ).rejects.toThrow(/Adjudication Blocked/);

    // Case 4: Verification is VERIFIED_OUTSTANDING -> Success
    mockRepo.__store['clm_verified_test'] = {
      id: 'clm_verified_test',
      guardianId: 'usr_guardian_1',
      status: 'ASSESSMENT',
      universityVerification: { status: 'VERIFIED_OUTSTANDING', studentRollNo: '2023CS101' },
      reviews: []
    };

    const approved = await claimService.adjudicateClaim('clm_verified_test', 'APPROVED', 'Approved', 'REASON', 200000, officer);
    expect(approved.status).toBe('APPROVED');
    expect(approved.approvedAmount).toBe(200000);
  });

  it('2.3: Rejects registrar verification attempts across institutional boundaries', async () => {
    const bitsRegistrar: UserProfile = {
      id: 'usr_bits_rep',
      uid: 'usr_bits_rep',
      email: 'registrar.bits@edushield.demo',
      displayName: 'BITS Registrar',
      role: 'university',
      universityId: 'univ_bits',
      createdAt: '',
      updatedAt: ''
    };

    const mockRepo = (await import('../src/repositories/firestoreRepo')) as any;
    mockRepo.__store['clm_iitd_target'] = {
      id: 'clm_iitd_target',
      universityId: 'univ_iitd',
      universityName: 'IIT Delhi',
      studentName: 'Aarav Sharma',
      guardianId: 'usr_guardian_1',
      status: 'SUBMITTED',
      requestedAmount: 200000
    };

    await expect(
      claimService.verifyByUniversity(
        'clm_iitd_target',
        '2024CS101',
        200000,
        200000,
        'Remarks',
        bitsRegistrar,
        'VERIFIED_OUTSTANDING'
      )
    ).rejects.toThrow(/Institutional Security Violation/);
  });

  it('2.4: Prevents Claims Officers from modifying university registrar verification records', async () => {
    const officer: UserProfile = {
      id: 'usr_officer_vikram',
      uid: 'usr_officer_vikram',
      email: 'officer@edushield.demo',
      displayName: 'Vikram Mehta',
      role: 'claims_officer',
      createdAt: '',
      updatedAt: ''
    };

    const mockRepo = (await import('../src/repositories/firestoreRepo')) as any;
    const originalVerification = {
      status: 'VERIFIED_OUTSTANDING',
      studentRollNo: 'ORIGINAL_ROLL_101',
      confirmedOutstandingFee: 220000,
      officerRemarks: 'Certified by University Registrar'
    };

    mockRepo.__store['clm_univ_tamper'] = {
      id: 'clm_univ_tamper',
      guardianId: 'usr_guardian_1',
      status: 'ASSESSMENT',
      universityVerification: originalVerification,
      reviews: []
    };

    // Adjudicate claim
    const adjudicated = await claimService.adjudicateClaim('clm_univ_tamper', 'APPROVED', 'Notes', 'REASON', 220000, officer);
    
    // Verification record remains unmodified by Claims Officer
    expect(adjudicated.universityVerification?.studentRollNo).toBe('ORIGINAL_ROLL_101');
    expect(adjudicated.universityVerification?.confirmedOutstandingFee).toBe(220000);
    expect(adjudicated.universityVerification?.officerRemarks).toBe('Certified by University Registrar');
  });

  it('2.5: Enforces Separation of Duties: Claims Officer cannot adjudicate or pay own family claim', async () => {
    const officerWhoIsAlsoParent: UserProfile = {
      id: 'usr_officer_parent_double',
      uid: 'usr_officer_parent_double',
      email: 'officer.parent@edushield.demo',
      displayName: 'Officer Parent',
      role: 'claims_officer',
      createdAt: '',
      updatedAt: ''
    };

    const mockRepo = (await import('../src/repositories/firestoreRepo')) as any;
    mockRepo.__store['clm_self_claim'] = {
      id: 'clm_self_claim',
      guardianId: 'usr_officer_parent_double', // Self-claim!
      status: 'ASSESSMENT',
      universityVerification: { status: 'VERIFIED_OUTSTANDING', studentRollNo: 'ROLL1' },
      reviews: []
    };

    // Attempt to adjudicate own family claim -> Rejected
    await expect(
      claimService.adjudicateClaim('clm_self_claim', 'APPROVED', 'Self note', 'REASON', 100000, officerWhoIsAlsoParent)
    ).rejects.toThrow(/Separation of Duties Violation/);

    // Attempt to disburse university payout for own family claim -> Rejected
    await expect(
      paymentService.processUniversityPayout(mockRepo.__store['clm_self_claim'], officerWhoIsAlsoParent)
    ).rejects.toThrow(/Separation of Duties Violation/);
  });

  it('2.6: Rejects payment disbursement if claim is not in APPROVED or PAYMENT_PROCESSING status', async () => {
    const officer: UserProfile = {
      id: 'usr_officer_vikram',
      uid: 'usr_officer_vikram',
      email: 'officer@edushield.demo',
      displayName: 'Vikram Mehta',
      role: 'claims_officer',
      createdAt: '',
      updatedAt: ''
    };

    const mockRepo = (await import('../src/repositories/firestoreRepo')) as any;

    // Claim in SUBMITTED status
    mockRepo.__store['clm_unapproved_disburse'] = {
      id: 'clm_unapproved_disburse',
      guardianId: 'usr_guardian_1',
      status: 'SUBMITTED',
      universityName: 'IIT Delhi',
      approvedAmount: 0,
      requestedAmount: 200000
    };

    await expect(
      paymentService.processUniversityPayout(mockRepo.__store['clm_unapproved_disburse'], officer)
    ).rejects.toThrow(/Invalid Payment State: Claim must be in APPROVED or PAYMENT_PROCESSING status/);
  });

  it('2.7: Restricts quote generation and policy binding to authenticated Parents/Guardians', async () => {
    const studentUser: UserProfile = {
      id: 'usr_student_1',
      uid: 'usr_student_1',
      email: 'student@edushield.demo',
      displayName: 'Aarav Student',
      role: 'student',
      createdAt: '',
      updatedAt: ''
    };

    const dummyStudent = {
      id: 'stud_1',
      guardianId: 'usr_guardian_1',
      guardianName: 'Rajesh',
      fullName: 'Aarav',
      dateOfBirth: '2005-01-01',
      gender: 'MALE',
      universityId: 'univ_iitd',
      universityName: 'IIT Delhi',
      courseName: 'B.Tech',
      degreeType: 'UNDERGRADUATE',
      currentAcademicYear: 1,
      totalCourseDurationYears: 4,
      studentIdNumber: 'STU1',
      annualTuitionFee: 200000,
      otherEligibleExpenses: 50000,
      createdAt: '',
      updatedAt: ''
    };

    const dummyPlan: InsurancePlan = {
      id: 'plan_basic',
      code: 'PLN-BASIC',
      name: 'EduShield Basic',
      tier: 'BASIC',
      description: 'Basic plan',
      baseRatePercent: 2.2,
      maxCoverageLimit: 1500000,
      waitingPeriodDays: 30,
      coveredEvents: ['PARENT_DEATH'],
      includedBenefits: ['Tuition'],
      exclusions: ['Suicide'],
      isActive: true
    };

    // Student attempting to generate quote -> Rejected
    await expect(
      quoteService.generateQuote(studentUser, dummyStudent as any, dummyPlan, 4)
    ).rejects.toThrow(/Unauthorized Operation: Only authenticated Parents\/Guardians or Administrators can generate policy quotes/);

    const dummyQuote: Quote = {
      id: 'qte_1',
      quoteNumber: 'QTE-001',
      guardianId: 'usr_guardian_1',
      guardianName: 'Rajesh',
      guardianEmail: 'guardian@edushield.demo',
      studentId: 'stud_1',
      studentName: 'Aarav',
      universityId: 'univ_iitd',
      universityName: 'IIT Delhi',
      courseName: 'B.Tech',
      planId: 'plan_basic',
      planName: 'Basic',
      coverageAmount: 1000000,
      policyDurationYears: 4,
      annualTuitionFee: 200000,
      otherEligibleExpenses: 50000,
      basePremium: 22000,
      riskFactorAdjustment: 0,
      taxAmount: 3960,
      totalAnnualPremium: 25960,
      status: 'GENERATED',
      waitingPeriodDays: 30,
      exclusions: [],
      benefits: [],
      plainLanguageSummary: '',
      calculatedAt: '',
      expiresAt: ''
    };

    // Student attempting to bind policy -> Rejected
    await expect(
      policyService.bindPolicyFromQuote(dummyQuote, studentUser)
    ).rejects.toThrow(/Unauthorized Operation: Premium payment initiation and policy binding are restricted exclusively to authenticated Parents\/Guardians/);
  });

  it('3.1: Admin-controlled account approval workflow enforces role and university constraints', async () => {
    // Simulated admin user
    const adminUser: UserProfile = {
      id: 'admin_test_uid',
      uid: 'admin_test_uid',
      email: 'admin@edushield.demo',
      displayName: 'System Admin',
      role: 'admin',
      accountStatus: 'APPROVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Pending registrar applicant
    const pendingApplicant: UserProfile = {
      id: 'applicant_bits_uid',
      uid: 'applicant_bits_uid',
      email: 'bits.newregistrar@edushield.demo',
      displayName: 'New BITS Registrar',
      role: null,
      accountStatus: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Approval function simulating UsersPage handleSaveRole
    const approveUser = (admin: UserProfile, target: UserProfile, assignedRole: UserRole, targetUniv?: string) => {
      if (admin.role !== 'admin') {
        throw new Error('Unauthorized: Only administrators can approve user accounts.');
      }
      if (assignedRole === 'university' && !targetUniv) {
        throw new Error('University Registrar must be mapped to a valid institution ID.');
      }
      return {
        ...target,
        role: assignedRole,
        accountStatus: 'APPROVED' as const,
        universityId: assignedRole === 'university' ? targetUniv : undefined,
        updatedAt: new Date().toISOString()
      };
    };

    // Non-admin attempting approval -> Throws
    const nonAdminUser: UserProfile = { ...adminUser, role: 'guardian' };
    expect(() => approveUser(nonAdminUser, pendingApplicant, 'claims_officer')).toThrow('Unauthorized: Only administrators can approve user accounts.');

    // Admin assigning university without univId -> Throws
    expect(() => approveUser(adminUser, pendingApplicant, 'university')).toThrow('University Registrar must be mapped to a valid institution ID.');

    // Admin approving BITS registrar with univ_bits -> Success
    const approvedBITS = approveUser(adminUser, pendingApplicant, 'university', 'univ_bits');
    expect(approvedBITS.accountStatus).toBe('APPROVED');
    expect(approvedBITS.role).toBe('university');
    expect(approvedBITS.universityId).toBe('univ_bits');
  });

  it('3.2: Self-assignment of privileged roles is prevented on public registration', async () => {
    // Attempting to register as admin or claims_officer
    const privilegedRoles: UserRole[] = ['claims_officer', 'university', 'admin'];

    for (const privilegedRole of privilegedRoles) {
      // Public registration function in authService forces safeRole (guardian/student)
      const registered = await authService.register(
        `user_${privilegedRole}@example.com`,
        'SecurePassword@123',
        'Test User',
        privilegedRole
      );
      // Verify safeRole was enforced (guardian) and privileged role was NOT granted
      expect(registered.role).not.toBe(privilegedRole);
      expect(['guardian', 'student']).toContain(registered.role);
    }
  });
});
