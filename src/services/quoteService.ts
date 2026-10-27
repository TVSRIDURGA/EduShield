import { QuotesRepo, PlansRepo } from '../repositories/firestoreRepo';
import { Quote, Student, InsurancePlan, UserProfile } from '../models/insurance';
import { calculatePremium, generateQuoteNumber } from '../utils/businessRules';
import { auditService } from './auditService';

export const quoteService = {
  async generateQuote(
    guardian: UserProfile,
    student: Student,
    plan: InsurancePlan,
    policyDurationYears: number
  ): Promise<Quote> {
    const studentAge = new Date().getFullYear() - new Date(student.dateOfBirth).getFullYear();
    
    const calc = calculatePremium({
      annualTuitionFee: student.annualTuitionFee,
      otherEligibleExpenses: student.otherEligibleExpenses,
      policyDurationYears,
      plan,
      studentAge
    });

    const quoteNumber = generateQuoteNumber();
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30); // 30-day quote guarantee

    const quote: Quote = {
      id: 'qte_' + Date.now(),
      quoteNumber,
      guardianId: guardian.id,
      guardianName: guardian.displayName,
      guardianEmail: guardian.email,
      studentId: student.id,
      studentName: student.fullName,
      universityId: student.universityId,
      universityName: student.universityName,
      courseName: student.courseName,
      planId: plan.id,
      planName: plan.name,
      coverageAmount: calc.coverageAmount,
      policyDurationYears,
      annualTuitionFee: student.annualTuitionFee,
      otherEligibleExpenses: student.otherEligibleExpenses,
      
      basePremium: calc.basePremium,
      riskFactorAdjustment: calc.riskFactorAdjustment,
      taxAmount: calc.taxAmount,
      totalAnnualPremium: calc.totalAnnualPremium,
      
      status: 'GENERATED',
      waitingPeriodDays: plan.waitingPeriodDays,
      exclusions: plan.exclusions,
      benefits: [
        {
          benefitCode: 'TUIT_FULL',
          name: 'Direct University Tuition Protection',
          description: `Direct payout to ${student.universityName} in the event of parental death or disability.`,
          coverageLimit: calc.coverageAmount,
          deductible: 0
        },
        {
          benefitCode: 'ACAD_CONT',
          name: 'Academic Semester Continuity Grant',
          description: 'Emergency allowance for textbooks, lab supplies, and semester examination fees.',
          coverageLimit: Math.round(calc.coverageAmount * 0.15),
          deductible: 2000
        }
      ],
      plainLanguageSummary: `Provides ${calc.coverageAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} total protection for ${student.fullName} at ${student.universityName} over ${policyDurationYears} academic years under the ${plan.name} plan.`,
      calculatedAt: new Date().toISOString(),
      expiresAt: expiry.toISOString()
    };

    await QuotesRepo.create(quote);
    await auditService.log(
      'QUOTE_GENERATED',
      'QUOTE',
      quote.id,
      { id: guardian.id, name: guardian.displayName, role: guardian.role },
      `Generated quote ${quote.quoteNumber} for ₹${quote.coverageAmount.toLocaleString('en-IN')}`
    );

    return quote;
  },

  async getById(id: string): Promise<Quote | null> {
    return QuotesRepo.getById(id);
  },

  async listByGuardian(guardianId: string): Promise<Quote[]> {
    return QuotesRepo.findBy('guardianId', guardianId);
  },

  async getAll(): Promise<Quote[]> {
    return QuotesRepo.getAll();
  }
};
