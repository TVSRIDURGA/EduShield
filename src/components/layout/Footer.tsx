import React from 'react';
import { ShieldCheck, Heart, Sparkles, CheckCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 text-white font-bold text-base mb-2">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
              <span>EduShield</span>
              <span className="text-xs px-2 py-0.5 rounded bg-brand-900 text-brand-300 border border-brand-700">
                Final Year B.Tech CSE Project
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              AI-Powered Education Insurance & Continuity Platform designed to protect student higher education 
              against unforeseen breadwinner loss, disability, or acute financial catastrophe. Inspired by Guidewire 
              PolicyCenter & ClaimCenter architecture.
            </p>
          </div>

          <div>
            <h5 className="text-white font-semibold mb-2">Core Workflow</h5>
            <ul className="space-y-1.5 text-xs">
              <li>1. Tuition Quote Calculation</li>
              <li>2. Policy Purchase & Activation</li>
              <li>3. Covered Event Claim Filing</li>
              <li>4. University Direct Verification</li>
              <li>5. Registrar Escrow Payout</li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-semibold mb-2">System Status</h5>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span>Firebase Spark Free-Tier Active</span>
              </div>
              <div className="flex items-center gap-1.5 text-teal-400">
                <Sparkles className="w-4 h-4" />
                <span>Grounded AI Assistant Ready</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Project ID: <code className="text-slate-400">edushield-6de64</code>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} EduShield. Academic Engineering Prototype.</p>
          <p className="mt-2 sm:mt-0 flex items-center gap-1">
            Built with React 18, TypeScript, Tailwind CSS & Firebase
          </p>
        </div>
      </div>
    </footer>
  );
};
