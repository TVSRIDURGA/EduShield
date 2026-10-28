import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { UnauthorizedPage } from './pages/auth/UnauthorizedPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { NewQuotePage } from './pages/quotes/NewQuotePage';
import { QuoteDetailPage } from './pages/quotes/QuoteDetailPage';
import { PolicyListPage } from './pages/policies/PolicyListPage';
import { PolicyDetailPage } from './pages/policies/PolicyDetailPage';
import { ClaimListPage } from './pages/claims/ClaimListPage';
import { NewClaimPage } from './pages/claims/NewClaimPage';
import { ClaimDetailPage } from './pages/claims/ClaimDetailPage';
import { ClaimReviewPage } from './pages/claims/ClaimReviewPage';
import { ContinuityPage } from './pages/continuity/ContinuityPage';
import { AIAssistantPage } from './pages/ai/AIAssistantPage';
import { UniversityVerificationPage } from './pages/university/UniversityVerificationPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { UsersPage } from './pages/admin/UsersPage';
import { PlansPage } from './pages/admin/PlansPage';
import { RulesPage } from './pages/admin/RulesPage';

// Layout wrapper for authenticated and general pages
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Authentication routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<AppLayout><UnauthorizedPage /></AppLayout>} />

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Role-Aware Dashboard */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <AppLayout><DashboardPage /></AppLayout>
                </ProtectedRoute>
              } 
            />

            {/* Quotes (Guards: Guardian & Admin) */}
            <Route path="/quotes" element={<Navigate to="/quotes/new" replace />} />
            <Route 
              path="/quotes/new" 
              element={
                <ProtectedRoute allowedRoles={['guardian', 'admin']}>
                  <AppLayout><NewQuotePage /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/quotes/:id" 
              element={
                <ProtectedRoute allowedRoles={['guardian', 'claims_officer', 'admin']}>
                  <AppLayout><QuoteDetailPage /></AppLayout>
                </ProtectedRoute>
              } 
            />

            {/* Policies (All authenticated users scoped to their authorization) */}
            <Route 
              path="/policies" 
              element={
                <ProtectedRoute>
                  <AppLayout><PolicyListPage /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/policies/:id" 
              element={
                <ProtectedRoute>
                  <AppLayout><PolicyDetailPage /></AppLayout>
                </ProtectedRoute>
              } 
            />

            {/* Claims */}
            <Route 
              path="/claims" 
              element={
                <ProtectedRoute>
                  <AppLayout><ClaimListPage /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/claims/new" 
              element={
                <ProtectedRoute allowedRoles={['guardian', 'admin']}>
                  <AppLayout><NewClaimPage /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/claims/:id" 
              element={
                <ProtectedRoute>
                  <AppLayout><ClaimDetailPage /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/claims/:id/review" 
              element={
                <ProtectedRoute allowedRoles={['claims_officer', 'admin']}>
                  <AppLayout><ClaimReviewPage /></AppLayout>
                </ProtectedRoute>
              } 
            />

            {/* EduShield Continuity Intelligence */}
            <Route 
              path="/continuity" 
              element={
                <ProtectedRoute allowedRoles={['guardian', 'student', 'admin']}>
                  <AppLayout><ContinuityPage /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ai-assistant" 
              element={
                <ProtectedRoute>
                  <AppLayout><AIAssistantPage /></AppLayout>
                </ProtectedRoute>
              } 
            />

            {/* University Verification (Guards: University Registrar & Admin) */}
            <Route 
              path="/university/verification" 
              element={
                <ProtectedRoute allowedRoles={['university', 'admin']}>
                  <AppLayout><UniversityVerificationPage /></AppLayout>
                </ProtectedRoute>
              } 
            />

            {/* Operational Reports (Staff: Claims Officer, University, Admin) */}
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute allowedRoles={['claims_officer', 'university', 'admin']}>
                  <AppLayout><ReportsPage /></AppLayout>
                </ProtectedRoute>
              } 
            />

            {/* Administration Console (Guards: Strict Admin only) */}
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout><UsersPage /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/plans" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout><PlansPage /></AppLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/rules" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout><RulesPage /></AppLayout>
                </ProtectedRoute>
              } 
            />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
