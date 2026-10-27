import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, LogIn, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../models/insurance';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = async (role: UserRole) => {
    setIsSubmitting(true);
    try {
      await switchRole(role);
      navigate('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-700 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
            <ShieldCheck className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Sign in to EduShield
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          AI-Powered Education Insurance & Continuity Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="guardian@edushield.demo"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Login Buttons for Evaluators */}
          <div className="mt-6 border-t border-slate-200 pt-5">
            <div className="flex items-center gap-1 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Instant Evaluator Demo Logins</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo('guardian')}
                className="p-2 border border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 rounded-lg text-blue-800 font-medium text-left transition"
              >
                👨‍👦 <strong>Guardian</strong>
                <span className="block text-[10px] text-blue-600">Rajesh Sharma</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('claims_officer')}
                className="p-2 border border-purple-200 bg-purple-50/70 hover:bg-purple-100/80 rounded-lg text-purple-800 font-medium text-left transition"
              >
                ⚖️ <strong>Claims Officer</strong>
                <span className="block text-[10px] text-purple-600">Vikram Mehta</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('university')}
                className="p-2 border border-amber-200 bg-amber-50/70 hover:bg-amber-100/80 rounded-lg text-amber-800 font-medium text-left transition"
              >
                🏛️ <strong>University</strong>
                <span className="block text-[10px] text-amber-600">IIT Delhi Registrar</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="p-2 border border-rose-200 bg-rose-50/70 hover:bg-rose-100/80 rounded-lg text-rose-800 font-medium text-left transition"
              >
                🛡️ <strong>Administrator</strong>
                <span className="block text-[10px] text-rose-600">Priya Nambiar</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-500">
              Register as Guardian
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
