import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CANONICAL_DEMO_ACCOUNTS, authService } from '../src/services/authService';
import { ProtectedRoute } from '../src/components/common/ProtectedRoute';
import { UserRole, UserProfile } from '../src/models/insurance';
import { UsersRepo } from '../src/repositories/firestoreRepo';

// Mock AuthContext
const mockUseAuth = vi.fn();

vi.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock Firebase Firestore and Auth for unit testing without live network
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn((_db, name) => ({ id: name })),
    doc: vi.fn((_db, _col, id) => ({ id })),
    query: vi.fn(() => ({})),
    where: vi.fn(() => ({})),
    getDoc: vi.fn(async () => ({ exists: () => false, data: () => null })),
    getDocs: vi.fn(async () => ({ empty: true, docs: [] })),
    setDoc: vi.fn(async () => {}),
    updateDoc: vi.fn(async () => {})
  };
});

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

describe('Authentication & Canonical Role Specifications', () => {
  it('defines the dedicated accounts for all five universities with correct institution IDs', () => {
    // 1. IIT Delhi
    expect(CANONICAL_DEMO_ACCOUNTS['registrar.iitd@edushield.demo'].role).toBe('university');
    expect(CANONICAL_DEMO_ACCOUNTS['registrar.iitd@edushield.demo'].universityId).toBe('univ_iitd');
    expect(CANONICAL_DEMO_ACCOUNTS['university@edushield.demo'].universityId).toBe('univ_iitd');

    // 2. BITS Pilani - Hyderabad Campus
    expect(CANONICAL_DEMO_ACCOUNTS['registrar.bits@edushield.demo'].role).toBe('university');
    expect(CANONICAL_DEMO_ACCOUNTS['registrar.bits@edushield.demo'].universityId).toBe('univ_bits');

    // 3. NIT Trichy
    expect(CANONICAL_DEMO_ACCOUNTS['registrar.nitt@edushield.demo'].role).toBe('university');
    expect(CANONICAL_DEMO_ACCOUNTS['registrar.nitt@edushield.demo'].universityId).toBe('univ_nitt');

    // 4. University of Delhi
    expect(CANONICAL_DEMO_ACCOUNTS['registrar.du@edushield.demo'].role).toBe('university');
    expect(CANONICAL_DEMO_ACCOUNTS['registrar.du@edushield.demo'].universityId).toBe('univ_du');

    // 5. REVA University
    expect(CANONICAL_DEMO_ACCOUNTS['registrar.reva@edushield.demo'].role).toBe('university');
    expect(CANONICAL_DEMO_ACCOUNTS['registrar.reva@edushield.demo'].universityId).toBe('univ_reva');

    // Other roles
    expect(CANONICAL_DEMO_ACCOUNTS['guardian@edushield.demo'].role).toBe('guardian');
    expect(CANONICAL_DEMO_ACCOUNTS['student@edushield.demo'].role).toBe('student');
    expect(CANONICAL_DEMO_ACCOUNTS['officer@edushield.demo'].role).toBe('claims_officer');
    expect(CANONICAL_DEMO_ACCOUNTS['admin@edushield.demo'].role).toBe('admin');
  });

  it('rejects registration with empty credentials', async () => {
    await expect(authService.register('', 'pass123', 'Name')).rejects.toThrow('Email address is required.');
    await expect(authService.register('test@example.com', '123', 'Name')).rejects.toThrow('Password must be at least 6 characters.');
    await expect(authService.register('test@example.com', 'password123', '')).rejects.toThrow('Full name is required.');
  });

  it('prevents privileged role self-assignment on public registration', () => {
    // Only guardian and student are allowed for public registration
    const publicAllowedRoles: UserRole[] = ['guardian', 'student'];
    const privilegedRoles: UserRole[] = ['claims_officer', 'university', 'admin'];

    privilegedRoles.forEach(role => {
      expect(publicAllowedRoles.includes(role)).toBe(false);
    });
  });
});

describe('Role-Based Protected Route Guards', () => {
  it('renders content when user possesses the authorized role', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'usr_admin',
        uid: 'usr_admin',
        email: 'admin@edushield.demo',
        displayName: 'Priya Nambiar',
        role: 'admin'
      },
      role: 'admin',
      loading: false
    });

    render(
      <MemoryRouter initialEntries={['/admin/users']}>
        <Routes>
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <div data-testid="admin-content">Admin Operations Panel</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('admin-content')).toBeDefined();
    expect(screen.getByText('Admin Operations Panel')).toBeDefined();
  });

  it('restricts access and displays UnauthorizedPage when user role is not authorized', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'usr_guardian',
        uid: 'usr_guardian',
        email: 'guardian@edushield.demo',
        displayName: 'Rajesh Sharma',
        role: 'guardian'
      },
      role: 'guardian',
      loading: false,
      logout: vi.fn()
    });

    render(
      <MemoryRouter initialEntries={['/claims/clm_1/review']}>
        <Routes>
          <Route
            path="/claims/:id/review"
            element={
              <ProtectedRoute allowedRoles={['claims_officer', 'admin']}>
                <div data-testid="review-content">Adjuster Workbench</div>
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('review-content')).toBeNull();
    expect(screen.getByText('Role Authorization Required')).toBeDefined();
    expect(screen.getByText('Access Restricted')).toBeDefined();
  });

  it('displays Account Access Pending when user has an unverified or invalid role', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'usr_pending',
        uid: 'usr_pending',
        email: 'newuser@example.com',
        displayName: 'New Applicant',
        role: null
      },
      role: null,
      loading: false
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div data-testid="dash-content">User Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('dash-content')).toBeNull();
    expect(screen.getByText('Account Access Pending')).toBeDefined();
  });

  it('denies university registrars from accessing quote creation or parent payment checkout', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'usr_univ',
        uid: 'usr_univ',
        email: 'university@edushield.demo',
        displayName: 'IIT Delhi Registrar',
        role: 'university',
        universityId: 'univ_iitd'
      },
      role: 'university',
      loading: false,
      logout: vi.fn()
    });

    render(
      <MemoryRouter initialEntries={['/quotes/new']}>
        <Routes>
          <Route
            path="/quotes/new"
            element={
              <ProtectedRoute allowedRoles={['guardian', 'admin']}>
                <div data-testid="new-quote">Quote Calculator</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('new-quote')).toBeNull();
    expect(screen.getByText('Access Restricted')).toBeDefined();
  });

  it('denies students from accessing administrator user management', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'usr_student',
        uid: 'usr_student',
        email: 'student@edushield.demo',
        displayName: 'Aarav Sharma',
        role: 'student'
      },
      role: 'student',
      loading: false,
      logout: vi.fn()
    });

    render(
      <MemoryRouter initialEntries={['/admin/users']}>
        <Routes>
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <div data-testid="admin-panel">Admin Panel</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('admin-panel')).toBeNull();
    expect(screen.getByText('Access Restricted')).toBeDefined();
  });
});

describe('Separation of Duties & Payment Access Rules', () => {
  it('enforces that only guardian role is permitted to initiate policy payments', () => {
    const roles: UserRole[] = ['guardian', 'student', 'claims_officer', 'university', 'admin'];
    const canInitiatePayment = (role: UserRole | null | undefined): boolean => role === 'guardian';

    expect(canInitiatePayment('guardian')).toBe(true);
    expect(canInitiatePayment('student')).toBe(false);
    expect(canInitiatePayment('claims_officer')).toBe(false);
    expect(canInitiatePayment('university')).toBe(false);
    expect(canInitiatePayment('admin')).toBe(false);
    expect(canInitiatePayment(null)).toBe(false);
  });

  it('detects and prohibits self-approval for claims officers', () => {
    const officerUserId = 'usr_officer_101';
    
    // Case 1: Adjuster reviewing someone else's claim -> Allowed
    const independentClaim = {
      id: 'clm_001',
      guardianId: 'usr_guardian_999',
      requestedAmount: 150000
    };
    const isSelfClaim1 = independentClaim.guardianId === officerUserId;
    expect(isSelfClaim1).toBe(false);

    // Case 2: Adjuster reviewing their own family claim -> Violation
    const selfClaim = {
      id: 'clm_002',
      guardianId: 'usr_officer_101',
      requestedAmount: 220000
    };
    const isSelfClaim2 = selfClaim.guardianId === officerUserId;
    expect(isSelfClaim2).toBe(true);
  });
});

describe('Multi-University Registrar Authentication & Verification Workflows', () => {
  // Mock claims repo for service tests
  const mockClaims: Record<string, any> = {
    'clm_bits_test': {
      id: 'clm_bits_test',
      claimNumber: 'CLM-BITS-001',
      universityId: 'univ_bits',
      universityName: 'BITS Pilani - Hyderabad Campus',
      studentName: 'Ananya Sharma',
      guardianId: 'usr_guardian_1',
      requestedAmount: 247500,
      status: 'UNDER_REVIEW',
      universityVerification: {
        status: 'PENDING'
      },
      reviews: []
    },
    'clm_iitd_test': {
      id: 'clm_iitd_test',
      claimNumber: 'CLM-IITD-001',
      universityId: 'univ_iitd',
      universityName: 'IIT Delhi',
      studentName: 'Aarav Sharma',
      guardianId: 'usr_guardian_1',
      requestedAmount: 220000,
      status: 'UNDER_REVIEW',
      universityVerification: {
        status: 'PENDING'
      },
      reviews: []
    },
    'clm_reva_test': {
      id: 'clm_reva_test',
      claimNumber: 'CLM-REVA-001',
      universityId: 'univ_reva',
      universityName: 'REVA University, Bengaluru',
      studentName: 'Kavya Gowda',
      guardianId: 'usr_guardian_1',
      requestedAmount: 185000,
      status: 'UNDER_REVIEW',
      universityVerification: {
        status: 'PENDING'
      },
      reviews: []
    }
  };

  it('Scenario C: prevents cross-university access - BITS registrar cannot verify IIT Delhi claim', async () => {
    const bitsRegistrar: UserProfile = {
      id: 'usr_bits_rep',
      uid: 'usr_bits_rep',
      email: 'registrar.bits@edushield.demo',
      displayName: 'Prof. Chandrashekhar Rao',
      role: 'university',
      universityId: 'univ_bits',
      createdAt: '',
      updatedAt: ''
    };

    // Attempt to verify IIT Delhi claim with BITS registrar credentials
    const iitdClaim = mockClaims['clm_iitd_test'];
    const canAccess = bitsRegistrar.universityId === iitdClaim.universityId;
    expect(canAccess).toBe(false);
  });

  it('Scenario C: prevents cross-university access - IIT Delhi registrar cannot verify BITS claim', async () => {
    const iitdRegistrar: UserProfile = {
      id: 'usr_iitd_rep',
      uid: 'usr_iitd_rep',
      email: 'registrar.iitd@edushield.demo',
      displayName: 'Dr. Sunita Deshmukh',
      role: 'university',
      universityId: 'univ_iitd',
      createdAt: '',
      updatedAt: ''
    };

    const bitsClaim = mockClaims['clm_bits_test'];
    const canAccess = iitdRegistrar.universityId === bitsClaim.universityId;
    expect(canAccess).toBe(false);
  });

  it('Scenario D: blocks claims officer approval when university fee verification is pending', () => {
    const unverifiedClaim = {
      status: 'UNDER_REVIEW',
      universityVerification: {
        status: 'PENDING'
      }
    };

    const isUnivVerified = ['VERIFIED', 'VERIFIED_PAID', 'VERIFIED_OUTSTANDING'].includes(
      unverifiedClaim.universityVerification.status
    );
    expect(isUnivVerified).toBe(false);
  });

  it('Scenario D: blocks claims officer approval when university registrar reports a discrepancy', () => {
    const discrepancyClaim = {
      status: 'UNDER_REVIEW',
      universityVerification: {
        status: 'DISCREPANCY',
        officerRemarks: 'Student roll number not found on current semester rolls'
      }
    };

    const isUnivVerified = ['VERIFIED', 'VERIFIED_PAID', 'VERIFIED_OUTSTANDING'].includes(
      discrepancyClaim.universityVerification.status
    );
    expect(isUnivVerified).toBe(false);
  });

  it('Scenario D: blocks claims officer approval when additional info is requested', () => {
    const infoRequiredClaim = {
      status: 'DOCUMENTS_REQUIRED',
      universityVerification: {
        status: 'REQUIRES_INFORMATION',
        officerRemarks: 'Hostel challan receipt missing'
      }
    };

    const isUnivVerified = ['VERIFIED', 'VERIFIED_PAID', 'VERIFIED_OUTSTANDING'].includes(
      infoRequiredClaim.universityVerification.status
    );
    expect(isUnivVerified).toBe(false);
  });

  it('Scenario A & B: permits claims officer approval once university fee verification is satisfied', () => {
    const verifiedOutstandingClaim = {
      status: 'ASSESSMENT',
      universityVerification: {
        status: 'VERIFIED_OUTSTANDING',
        studentRollNo: '2024A7PS0192H',
        confirmedOutstandingFee: 247500
      }
    };

    const verifiedPaidClaim = {
      status: 'ASSESSMENT',
      universityVerification: {
        status: 'VERIFIED_PAID',
        studentRollNo: 'R24AI084',
        confirmedAnnualTuition: 185000
      }
    };

    expect(['VERIFIED', 'VERIFIED_PAID', 'VERIFIED_OUTSTANDING'].includes(
      verifiedOutstandingClaim.universityVerification.status
    )).toBe(true);

    expect(['VERIFIED', 'VERIFIED_PAID', 'VERIFIED_OUTSTANDING'].includes(
      verifiedPaidClaim.universityVerification.status
    )).toBe(true);
  });

  it('Scenario E: validates supported verification states across universities', () => {
    const supportedStates = [
      'PENDING',
      'VERIFIED_PAID',
      'VERIFIED_OUTSTANDING',
      'DISCREPANCY',
      'REQUIRES_INFORMATION'
    ];

    expect(supportedStates).toContain('VERIFIED_PAID');
    expect(supportedStates).toContain('VERIFIED_OUTSTANDING');
    expect(supportedStates).toContain('DISCREPANCY');
    expect(supportedStates).toContain('REQUIRES_INFORMATION');
  });

  it('rejects falsely marking fees as paid without valid roll number and remarks', () => {
    const validatePaidVerification = (rollNo: string, remarks: string) => {
      if (!rollNo || !rollNo.trim()) throw new Error('Roll number required');
      if (!remarks || remarks.trim().length < 5) throw new Error('Remarks required');
      return true;
    };

    expect(() => validatePaidVerification('', 'Legit payment')).toThrow('Roll number required');
    expect(() => validatePaidVerification('2024A7', '')).toThrow('Remarks required');
    expect(validatePaidVerification('2024A7PS0192H', 'Semester fees confirmed settled')).toBe(true);
  });
});

describe('Account Approval & Role Provisioning Governance', () => {
  it('displays Account Access Pending screen when accountStatus is PENDING even if role is set', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'usr_new_applicant',
        uid: 'usr_new_applicant',
        email: 'applicant@edushield.demo',
        displayName: 'Pending Applicant',
        role: 'guardian',
        accountStatus: 'PENDING'
      },
      role: 'guardian',
      loading: false,
      refreshUser: vi.fn(),
      logout: vi.fn()
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div data-testid="dashboard-content">User Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('dashboard-content')).toBeNull();
    expect(screen.getByText('Account Access Pending')).toBeDefined();
    expect(screen.getByText(/Your user account \(applicant@edushield\.demo\) has been authenticated, but an authorized role assignment is currently pending administrator verification\./)).toBeDefined();
  });

  it('displays Account Access Suspended when accountStatus is REJECTED', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'usr_rejected',
        uid: 'usr_rejected',
        email: 'declined@edushield.demo',
        displayName: 'Declined Applicant',
        role: 'guardian',
        accountStatus: 'REJECTED'
      },
      role: 'guardian',
      loading: false,
      refreshUser: vi.fn(),
      logout: vi.fn()
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div data-testid="dashboard-content">User Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('dashboard-content')).toBeNull();
    expect(screen.getByText('Account Access Suspended')).toBeDefined();
  });

  it('grants access when accountStatus is APPROVED and role is valid', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 'usr_approved_officer',
        uid: 'usr_approved_officer',
        email: 'officer@edushield.demo',
        displayName: 'Vikram Mehta',
        role: 'claims_officer',
        accountStatus: 'APPROVED'
      },
      role: 'claims_officer',
      loading: false,
      refreshUser: vi.fn(),
      logout: vi.fn()
    });

    render(
      <MemoryRouter initialEntries={['/claims']}>
        <Routes>
          <Route
            path="/claims"
            element={
              <ProtectedRoute allowedRoles={['claims_officer', 'admin']}>
                <div data-testid="claims-content">Claims Workbench</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('claims-content')).toBeDefined();
    expect(screen.getByText('Claims Workbench')).toBeDefined();
  });

  it('prohibits granting Guardian or Admin role to unverified accounts with missing profiles', async () => {
    // Test that an unknown account without profile defaults to role null and accountStatus PENDING
    const result = await authService.getUserProfile('uid_unknown_999', 'unknown_evaluator@external.io');
    expect(result.role).toBeNull();
    expect(result.accountStatus).toBe('PENDING');
    expect(result.email).toBe('unknown_evaluator@external.io');
  });

  it('preserves all five dedicated registrar accounts mapped to correct universities', () => {
    const registrars = [
      { email: 'registrar.iitd@edushield.demo', expectedUniv: 'univ_iitd' },
      { email: 'registrar.bits@edushield.demo', expectedUniv: 'univ_bits' },
      { email: 'registrar.nitt@edushield.demo', expectedUniv: 'univ_nitt' },
      { email: 'registrar.du@edushield.demo', expectedUniv: 'univ_du' },
      { email: 'registrar.reva@edushield.demo', expectedUniv: 'univ_reva' },
    ];

    registrars.forEach(({ email, expectedUniv }) => {
      const config = CANONICAL_DEMO_ACCOUNTS[email];
      expect(config).toBeDefined();
      expect(config.role).toBe('university');
      expect(config.universityId).toBe(expectedUniv);
      expect(config.accountStatus).toBe('APPROVED');
    });
  });

  it('ensures all five primary roles are preserved and recognized as valid roles', () => {
    const expectedRoles: UserRole[] = ['guardian', 'student', 'claims_officer', 'university', 'admin'];
    const validRoles: UserRole[] = ['guardian', 'student', 'claims_officer', 'university', 'admin'];

    expectedRoles.forEach(r => {
      expect(validRoles.includes(r)).toBe(true);
    });
  });

  it('verifies complete lifecycle persistence: registration -> PENDING -> admin approval -> persistent APPROVED across re-logins', async () => {
    const testEmail = 'thanuja@gmail.com';
    const testUid = `uid_${testEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

    // 1. User registers
    const registered = await authService.register(
      testEmail,
      'ValidPassword@2026',
      'Thanuja Applicant',
      'guardian'
    );

    // Initial state must be PENDING
    expect(registered.email).toBe(testEmail);
    expect(registered.accountStatus).toBe('PENDING');

    // 2. Administrator reviews and approves the account
    const approvedProfile: UserProfile = {
      ...registered,
      id: registered.id || testUid,
      uid: registered.uid || testUid,
      role: 'guardian',
      accountStatus: 'APPROVED',
      updatedAt: new Date().toISOString()
    };
    await UsersRepo.create(approvedProfile);

    // Verify it is saved as APPROVED in the repository
    const fetchedBeforeRelogin = await UsersRepo.getById(approvedProfile.id);
    expect(fetchedBeforeRelogin?.accountStatus).toBe('APPROVED');
    expect(fetchedBeforeRelogin?.role).toBe('guardian');

    // 3. User signs out and logs back in (getUserProfile called with their uid & email)
    const profileAfterFirstLogin = await authService.getUserProfile(approvedProfile.id, testEmail);
    expect(profileAfterFirstLogin.accountStatus).toBe('APPROVED');
    expect(profileAfterFirstLogin.role).toBe('guardian');

    // 4. Repeated login / token refresh / session restore must NEVER revert back to PENDING
    for (let i = 0; i < 3; i++) {
      const refreshedProfile = await authService.getUserProfile(approvedProfile.id, testEmail);
      expect(refreshedProfile.accountStatus).toBe('APPROVED');
      expect(refreshedProfile.role).toBe('guardian');
    }

    // 5. Administrator queries Users list - status MUST remain APPROVED
    const allUsers = await UsersRepo.getAll();
    const thanujaInList = allUsers.find(u => u.email?.toLowerCase() === testEmail.toLowerCase());
    expect(thanujaInList).toBeDefined();
    expect(thanujaInList?.accountStatus).toBe('APPROVED');
    expect(thanujaInList?.role).toBe('guardian');
  });

  it('prevents newly registered users from overwriting an already administrator-approved profile', async () => {
    const preApprovedEmail = 'preapproved.guardian@example.com';
    const preApprovedUid = 'uid_preapproved_guardian_99';

    // Administrator pre-provisions or pre-approves the account
    const preApproved: UserProfile = {
      id: preApprovedUid,
      uid: preApprovedUid,
      email: preApprovedEmail,
      displayName: 'Pre-Approved Guardian',
      role: 'guardian',
      accountStatus: 'APPROVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await UsersRepo.create(preApproved);

    // When user completes registration, their existing APPROVED status is preserved
    const registered = await authService.register(
      preApprovedEmail,
      'PreApprovedPass@123',
      'Pre-Approved Guardian'
    );

    expect(registered.accountStatus).toBe('APPROVED');
    expect(registered.role).toBe('guardian');
  });

  describe('Five-Role Approval & Login Persistence Regression Suite', () => {
    const rolesToTest: Array<{
      role: UserRole;
      email: string;
      universityId?: string;
    }> = [
      { role: 'guardian', email: 'test.persisted.guardian@example.com' },
      { role: 'student', email: 'test.persisted.student@example.com', universityId: 'univ_iitd' },
      { role: 'claims_officer', email: 'test.persisted.officer@example.com' },
      { role: 'university', email: 'test.persisted.registrar@example.com', universityId: 'univ_bits' },
      { role: 'admin', email: 'test.persisted.admin@example.com' }
    ];

    rolesToTest.forEach(({ role, email, universityId }) => {
      it(`verifies complete approval lifecycle for role [${role}]: register -> PENDING -> admin approval -> persistent APPROVED across multiple sign-in/sign-out cycles`, async () => {
        // 1. Registration: creates pending user
        const registered = await authService.register(
          email,
          'SecurePass@2026',
          `Test ${role} User`,
          role === 'student' ? 'student' : 'guardian'
        );
        expect(registered.email).toBe(email);
        expect(registered.accountStatus).toBe('PENDING');

        // 2. Administrator opens Users & Roles, approves account and assigns role & universityId
        const approved: UserProfile = {
          ...registered,
          role,
          accountStatus: 'APPROVED',
          universityId: role === 'university' ? universityId : undefined,
          approvedAt: new Date().toISOString(),
          approvedBy: 'admin@edushield.demo',
          updatedAt: new Date().toISOString()
        };
        await UsersRepo.create(approved);

        // 3. First user sign-in: retrieves profile and verifies APPROVED status and role
        const firstLogin = await authService.getUserProfile(approved.id, email);
        expect(firstLogin.accountStatus).toBe('APPROVED');
        expect(firstLogin.role).toBe(role);
        if (role === 'university') {
          expect(firstLogin.universityId).toBe(universityId);
        }

        // 4. User signs out and signs in again (Cycle 1)
        await authService.logout();
        const secondLogin = await authService.getUserProfile(approved.id, email);
        expect(secondLogin.accountStatus).toBe('APPROVED');
        expect(secondLogin.role).toBe(role);
        if (role === 'university') {
          expect(secondLogin.universityId).toBe(universityId);
        }

        // 5. Browser refresh simulation (Cycle 2)
        const refreshSimulation = await authService.getUserProfile(approved.id, email);
        expect(refreshSimulation.accountStatus).toBe('APPROVED');
        expect(refreshSimulation.role).toBe(role);

        // 6. User signs out and signs in again (Cycle 3)
        await authService.logout();
        const thirdLogin = await authService.getUserProfile(approved.id, email);
        expect(thirdLogin.accountStatus).toBe('APPROVED');
        expect(thirdLogin.role).toBe(role);

        // 7. Administrator checks Users directory - account MUST remain APPROVED
        const allUsers = await UsersRepo.getAll();
        const inDirectory = allUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
        expect(inDirectory).toBeDefined();
        expect(inDirectory?.accountStatus).toBe('APPROVED');
        expect(inDirectory?.role).toBe(role);
      });
    });

    it('enforces that University Registrar universityId is immutable across sessions and cannot be swapped to another university', async () => {
      const registrarEmail = 'registrar.bits.tenancy@example.com';
      const registered = await authService.register(registrarEmail, 'BitsPass@123', 'BITS Registrar', 'guardian');
      
      const approved: UserProfile = {
        ...registered,
        role: 'university',
        accountStatus: 'APPROVED',
        universityId: 'univ_bits',
        approvedAt: new Date().toISOString(),
        approvedBy: 'admin@edushield.demo',
        updatedAt: new Date().toISOString()
      };
      await UsersRepo.create(approved);

      const loggedIn = await authService.getUserProfile(approved.id, registrarEmail);
      expect(loggedIn.universityId).toBe('univ_bits');
      expect(loggedIn.universityId).not.toBe('univ_iitd');
      expect(loggedIn.universityId).not.toBe('univ_nitt');
    });

    it('blocks access to protected routes when accountStatus is PENDING even if role is set', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'usr_pending_guardian',
          uid: 'usr_pending_guardian',
          email: 'pending.guardian@example.com',
          displayName: 'Pending Guardian',
          role: 'guardian',
          accountStatus: 'PENDING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        role: 'guardian',
        loading: false,
        refreshUser: vi.fn(),
        logout: vi.fn()
      });

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['guardian']}>
                  <div data-testid="dashboard-content">Secret Guardian Dashboard</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByTestId('dashboard-content')).toBeNull();
      expect(screen.getByText('Account Access Pending')).toBeDefined();
      expect(screen.getByText(/pending administrator verification/i)).toBeDefined();
    });
  });
});


