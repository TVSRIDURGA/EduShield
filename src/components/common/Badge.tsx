import React from 'react';
import { ClaimStatus, PolicyStatus, PaymentStatus, UserRole } from '../../models/insurance';

interface BadgeProps {
  status?: ClaimStatus | PolicyStatus | PaymentStatus | string;
  role?: UserRole;
  variant?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'slate';
  children?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, role, variant, children, className = '' }) => {
  let color = 'bg-slate-100 text-slate-700 border-slate-200';
  let text = children || '';

  // Determine variant based on status or role
  if (role) {
    switch (role) {
      case 'guardian':
        color = 'bg-blue-50 text-blue-700 border-blue-200';
        text = text || 'Guardian';
        break;
      case 'student':
        color = 'bg-teal-50 text-teal-700 border-teal-200';
        text = text || 'Student';
        break;
      case 'claims_officer':
        color = 'bg-purple-50 text-purple-700 border-purple-200';
        text = text || 'Claims Officer';
        break;
      case 'university':
        color = 'bg-amber-50 text-amber-700 border-amber-200';
        text = text || 'University Rep';
        break;
      case 'admin':
        color = 'bg-rose-50 text-rose-700 border-rose-200';
        text = text || 'Administrator';
        break;
    }
  } else if (status) {
    text = text || status;
    switch (status) {
      case 'ACTIVE':
      case 'APPROVED':
      case 'COMPLETED':
      case 'PAID':
      case 'VERIFIED':
        color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
      case 'ASSESSMENT':
      case 'PAYMENT_PROCESSING':
      case 'GENERATED':
        color = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'DOCUMENTS_REQUIRED':
      case 'UNIVERSITY_VERIFICATION_PENDING':
      case 'RENEWAL_DUE':
      case 'PENDING':
        color = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'REJECTED':
      case 'FAILED':
      case 'CANCELLED':
      case 'EXPIRED':
        color = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
      case 'DRAFT':
      case 'CLOSED':
      default:
        color = 'bg-slate-100 text-slate-600 border-slate-200';
        break;
    }
  } else if (variant) {
    const variantMap = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      amber: 'bg-amber-50 text-amber-700 border-amber-200',
      red: 'bg-rose-50 text-rose-700 border-rose-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      slate: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    color = variantMap[variant];
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${color} ${className}`}>
      {text}
    </span>
  );
};
