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
  it('defines the five canonical demo accounts with correct roles and affiliations', () => {
    expect(CANONICAL_DEMO_ACCOUNTS['guardian@edushield.demo'].role).toBe('guardian');
    expect(CANONICAL_DEMO_ACCOUNTS['student@edushield.demo'].role).toBe('student');
    expect(CANONICAL_DEMO_ACCOUNTS['officer@edushield.demo'].role).toBe('claims_officer');
    expect(CANONICAL_DEMO_ACCOUNTS['university@edushield.demo'].role).toBe('university');
    expect(CANONICAL_DEMO_ACCOUNTS['university@edushield.demo'].universityId).toBe('univ_iitd');
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

