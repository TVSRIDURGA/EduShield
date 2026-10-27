import { describe, it, expect } from 'vitest';
import { 
  calculatePremium, 
  calculateFundingGap, 
  isValidClaimTransition, 
  evaluateClaimReadiness,
  formatINR 
} from '../src/utils/businessRules';
import { SEED_PLANS } from '../src/utils/seedData';

describe('EduShield Business Rules Engine', () => {
  const foundationPlan = SEED_PLANS[0]; // 2.2% base rate, 15L cap
  const comprehensivePlan = SEED_PLANS[1]; // 3.1% base rate, 35L cap

  describe('calculatePremium', () => {
    it('calculates deterministic annual premium with GST accurately', () => {
      const result = calculatePremium({
        annualTuitionFee: 200000,
        otherEligibleExpenses: 50000,
        policyDurationYears: 4,
        plan: foundationPlan,
        studentAge: 20
      });

      // Annual total = 250,000. 4 years = 1,000,000 (below 15L cap).
      expect(result.coverageAmount).toBe(1000000);
      
      // Base annual cover = 250,000. Base rate = 2.2% -> 5,500.
      expect(result.basePremium).toBe(5500);

      // Duration factor 4 years = 0.90 -> 5,500 * 0.9 = 4,950
      // GST 18% on 4,950 = 891
      // Total annual premium = 4,950 + 891 = 5,841
      expect(result.totalAnnualPremium).toBe(5841);
    });

    it('applies volume discount for long duration degrees', () => {
      const fourYearCalc = calculatePremium({
        annualTuitionFee: 200000,
        otherEligibleExpenses: 0,
        policyDurationYears: 4,
        plan: comprehensivePlan,
        studentAge: 20
      });

      const oneYearCalc = calculatePremium({
        annualTuitionFee: 200000,
        otherEligibleExpenses: 0,
        policyDurationYears: 1,
        plan: comprehensivePlan,
        studentAge: 20
      });

      // 4-year plan has a 10% duration discount factor (0.90 vs 1.0)
      expect(fourYearCalc.factors.durationFactor).toBe(0.90);
      expect(oneYearCalc.factors.durationFactor).toBe(1.0);
    });
  });

  describe('calculateFundingGap', () => {
    it('detects optimal status when protection covers full education cost', () => {
      const analysis = calculateFundingGap({
        studentName: 'Aarav Sharma',
        courseName: 'B.Tech CSE',
        currentYear: 2,
        totalCourseYears: 4,
        annualTuition: 200000,
        annualLivingAndHostel: 50000,
        familyAnnualPlannedSavings: 50000,
        activeInsuranceCoverage: 1000000
      });

      // 3 remaining years * 250,000 = 750,000 total cost
      // Protection = 1,000,000 + 150,000 savings = 1,150,000
      expect(analysis.fundingGapAmount).toBe(0);
      expect(analysis.status).toBe('OPTIMAL');
      expect(analysis.protectionCoveragePercentage).toBe(100);
    });

    it('identifies critical gap when protection is severely inadequate', () => {
      const analysis = calculateFundingGap({
        studentName: 'Aarav Sharma',
        courseName: 'MBBS Medical College',
        currentYear: 1,
        totalCourseYears: 5,
        annualTuition: 800000,
        annualLivingAndHostel: 200000,
        familyAnnualPlannedSavings: 50000,
        activeInsuranceCoverage: 500000 // Only 5 Lakhs for a 50 Lakhs degree
      });

      expect(analysis.fundingGapAmount).toBeGreaterThan(3000000);
      expect(analysis.status).toBe('CRITICAL_GAP');
    });
  });

  describe('Guidewire State Transition Machine', () => {
    it('permits valid lifecycle transitions', () => {
      expect(isValidClaimTransition('SUBMITTED', 'UNDER_REVIEW')).toBe(true);
      expect(isValidClaimTransition('UNDER_REVIEW', 'ASSESSMENT')).toBe(true);
      expect(isValidClaimTransition('ASSESSMENT', 'APPROVED')).toBe(true);
      expect(isValidClaimTransition('APPROVED', 'PAYMENT_PROCESSING')).toBe(true);
      expect(isValidClaimTransition('PAYMENT_PROCESSING', 'PAID')).toBe(true);
    });

    it('strictly forbids invalid or illegal state transitions', () => {
      expect(isValidClaimTransition('DRAFT', 'PAID')).toBe(false);
      expect(isValidClaimTransition('REJECTED', 'PAID')).toBe(false);
      expect(isValidClaimTransition('CLOSED', 'SUBMITTED')).toBe(false);
      expect(isValidClaimTransition('SUBMITTED', 'PAID')).toBe(false);
    });
  });

  describe('Claim Readiness Checklist Evaluator', () => {
    it('evaluates 100% readiness when all mandatory documents are present', () => {
      const result = evaluateClaimReadiness(
        'PARENT_DEATH',
        ['IDENTITY_PROOF', 'DEATH_CERTIFICATE', 'FEE_DEMAND_STATEMENT'],
        true, // university verified
        true, // policy active
        true  // waiting period over
      );

      expect(result.readinessScore).toBe(100);
      expect(result.missingDocs.length).toBe(0);
    });

    it('identifies missing death certificate for death claim', () => {
      const result = evaluateClaimReadiness(
        'PARENT_DEATH',
        ['IDENTITY_PROOF', 'FEE_DEMAND_STATEMENT'], // Missing DEATH_CERTIFICATE
        false,
        true,
        true
      );

      expect(result.missingDocs).toContain('DEATH_CERTIFICATE');
      expect(result.readinessScore).toBeLessThan(100);
    });
  });

  describe('formatINR', () => {
    it('formats Indian rupee amounts with proper symbol and formatting', () => {
      const formatted = formatINR(250000);
      expect(formatted).toContain('2,50,000');
    });
  });
});
