import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
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

// Protected layout wrapper
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
            {/* Public Auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Application pages wrapped in Layout */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<AppLayout><DashboardPage /></AppLayout>} />

            {/* Quotes */}
            <Route path="/quotes" element={<Navigate to="/quotes/new" replace />} />
            <Route path="/quotes/new" element={<AppLayout><NewQuotePage /></AppLayout>} />
            <Route path="/quotes/:id" element={<AppLayout><QuoteDetailPage /></AppLayout>} />

            {/* Policies */}
            <Route path="/policies" element={<AppLayout><PolicyListPage /></AppLayout>} />
            <Route path="/policies/:id" element={<AppLayout><PolicyDetailPage /></AppLayout>} />

            {/* Claims */}
            <Route path="/claims" element={<AppLayout><ClaimListPage /></AppLayout>} />
            <Route path="/claims/new" element={<AppLayout><NewClaimPage /></AppLayout>} />
            <Route path="/claims/:id" element={<AppLayout><ClaimDetailPage /></AppLayout>} />
            <Route path="/claims/:id/review" element={<AppLayout><ClaimReviewPage /></AppLayout>} />

            {/* EduShield Continuity Intelligence */}
            <Route path="/continuity" element={<AppLayout><ContinuityPage /></AppLayout>} />
            <Route path="/ai-assistant" element={<AppLayout><AIAssistantPage /></AppLayout>} />

            {/* University Verification */}
            <Route path="/university/verification" element={<AppLayout><UniversityVerificationPage /></AppLayout>} />

            {/* Reports */}
            <Route path="/reports" element={<AppLayout><ReportsPage /></AppLayout>} />

            {/* Administration */}
            <Route path="/admin/users" element={<AppLayout><UsersPage /></AppLayout>} />
            <Route path="/admin/plans" element={<AppLayout><PlansPage /></AppLayout>} />
            <Route path="/admin/rules" element={<AppLayout><RulesPage /></AppLayout>} />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
