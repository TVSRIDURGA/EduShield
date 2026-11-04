import { QuotesRepo, ProductsRepo } from '../repositories/firestoreRepo';
import { Quote, Student, InsurancePlan, InsuranceProduct, UserProfile, PaymentFrequency, CoverageBenefitConfig } from '../models/insurance';
import { calculatePremium, generateQuoteNumber } from '../utils/businessRules';
import { auditService } from './auditService';
import { policyEngine } from './policyEngine';

export const quoteService = {
  async generateQuote(
    guardian: UserProfile,
    student: Student,
    plan: InsurancePlan | InsuranceProduct,
    policyDurationYears: number,
    options?: {
      selectedAddonIds?: string[];
      frequency?: PaymentFrequency;
      discountCode?: string;
    }
  ): Promise<Quote> {
    if (guardian.role !== 'guardian' && guardian.role !== 'admin') {
      throw new Error('Unauthorized Operation: Only authenticated Parents/Guardians or Administrators can generate policy quotes.');
    }

    const birthDate = new Date(student.dateOfBirth);
    const now = new Date();
    let studentAge = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
      studentAge--;
    }

    // Check if plan is an InsuranceProduct or matches one in ProductsRepo
    const allProducts = await ProductsRepo.getAll();
    const matchedProduct = allProducts.find(
      p => p.id === plan.id || p.code === (plan as any).code
    );

    const quoteNumber = generateQuoteNumber();
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30); // 30-day quote guarantee

    if (matchedProduct) {
      // Validate eligibility first
      const eligibility = policyEngine.validateStudentEligibility(student, matchedProduct, guardian);
      if (!eligibility.isEligible) {
        throw new Error(`Student Ineligible: ${eligibility.reasons.join(' ')}`);
      }

      // Calculate enterprise premium
      const calc = policyEngine.calculateEnterprisePremium({
        annualTuitionFee: student.annualTuitionFee,
        otherEligibleExpenses: student.otherEligibleExpenses,
        policyDurationYears,
        product: matchedProduct,
        studentAge,
        selectedAddonIds: options?.selectedAddonIds,
        frequency: options?.frequency || 'ANNUAL',
        discountCode: options?.discountCode
      });

      const benefits = matchedProduct.coverageBenefits.map(b => ({
        benefitCode: b.id,
        name: b.name,
        description: b.description,
        coverageLimit: b.benefitAmount,
        deductible: matchedProduct.financialLimits.deductibleAmount || 0
      }));

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
        planId: matchedProduct.id,
        planName: matchedProduct.name,
        productId: matchedProduct.id,
        productCode: matchedProduct.code,
        policyVersion: matchedProduct.currentVersion,
        coverageAmount: calc.coverageAmount,
        policyDurationYears,
        annualTuitionFee: student.annualTuitionFee,
        otherEligibleExpenses: student.otherEligibleExpenses,

        basePremium: calc.basePremium + calc.baseRateComponent,
        riskFactorAdjustment: calc.ageAdjustment - calc.durationDiscountAmount,
        taxAmount: calc.taxAmount,
        totalAnnualPremium: calc.totalAnnualPremium,

        selectedAddons: calc.selectedAddons,
        addonPremiumTotal: calc.addonPremiumTotal,
        frequency: calc.frequency,
        frequencyPayableAmount: calc.frequencyInstallmentAmount,

        status: 'GENERATED',
        waitingPeriodDays: matchedProduct.coverageBenefits[0]?.waitingPeriodDays ?? 15,
        exclusions: matchedProduct.exclusions.map(e => `${e.title}: ${e.detailedExplanation}`),
        benefits,
        plainLanguageSummary: `Provides ${calc.coverageAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} total education security for ${student.fullName} at ${student.universityName} over ${policyDurationYears} academic years under ${matchedProduct.name} (v${matchedProduct.currentVersion}).`,
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
    }

    // Classic InsurancePlan path for backward compatibility
    const classicPlan = plan as InsurancePlan;
    const calc = calculatePremium({
      annualTuitionFee: student.annualTuitionFee,
      otherEligibleExpenses: student.otherEligibleExpenses,
      policyDurationYears,
      plan: classicPlan,
      studentAge
    });

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
      planId: classicPlan.id,
      planName: classicPlan.name,
      coverageAmount: calc.coverageAmount,
      policyDurationYears,
      annualTuitionFee: student.annualTuitionFee,
      otherEligibleExpenses: student.otherEligibleExpenses,
      
      basePremium: calc.basePremium,
      riskFactorAdjustment: calc.riskFactorAdjustment,
      taxAmount: calc.taxAmount,
      totalAnnualPremium: calc.totalAnnualPremium,
      
      status: 'GENERATED',
      waitingPeriodDays: classicPlan.waitingPeriodDays,
      exclusions: classicPlan.exclusions,
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
      plainLanguageSummary: `Provides ${calc.coverageAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} total protection for ${student.fullName} at ${student.universityName} over ${policyDurationYears} academic years under the ${classicPlan.name} plan.`,
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
