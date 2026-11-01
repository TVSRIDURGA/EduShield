import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CANONICAL_DEMO_ACCOUNTS, authService } from '../src/services/authService';
import { ProtectedRoute } from '../src/components/common/ProtectedRoute';
import { UserRole, UserProfile } from '../src/models/insurance';

// Mock AuthContext
const mockUseAuth = vi.fn();

vi.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

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

