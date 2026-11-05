import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { EducationProtectionCalculator } from '../src/components/guardian/EducationProtectionCalculator';
import { PersonalDetailsModal } from '../src/components/guardian/PersonalDetailsModal';
import { ContinuityDetailsModal } from '../src/components/guardian/ContinuityDetailsModal';
import { PolicyCustomizationStudio } from '../src/components/guardian/PolicyCustomizationStudio';
import { ExistingPoliciesSummary } from '../src/components/guardian/ExistingPoliciesSummary';
import { ParentHeroBanner } from '../src/components/guardian/ParentHeroBanner';
import { Student, InsuranceProduct, EducationPolicy, EducationClaim } from '../src/models/insurance';
import { SEED_ENTERPRISE_PRODUCTS } from '../src/utils/enterpriseSeedData';

describe('EduShield Premium Parent/Guardian Insurance Experience', () => {
  const mockStudent: Student = {
    id: 'stu_aarav',
    guardianId: 'usr_guardian_1',
    guardianName: 'Rajesh Sharma',
    fullName: 'Aarav Sharma',
    gender: 'MALE',
    dateOfBirth: '2005-04-12',
    universityId: 'univ_iitd',
    universityName: 'Indian Institute of Technology Delhi',
    courseName: 'B.Tech in Computer Science',
    degreeType: 'UNDERGRADUATE',
    currentAcademicYear: 1,
    totalCourseDurationYears: 4,
    studentIdNumber: 'STU-2026-IITD-082',
    annualTuitionFee: 300000,
    otherEligibleExpenses: 80000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const sampleProduct: InsuranceProduct = JSON.parse(JSON.stringify(SEED_ENTERPRISE_PRODUCTS[1])); // Comprehensive Shield

  // ========================================================
  // TEST 1: Hero Banner rendering with personalized welcome & CTA
  // ========================================================
  it('1. Renders personalized welcome, covered children status, and primary action buttons in ParentHeroBanner', () => {
    const handleStart = vi.fn();
    const handleRegister = vi.fn();
    const handleView = vi.fn();

    render(
      <ParentHeroBanner
        parentName="Rajesh Sharma"
        coveredChildrenCount={1}
        totalActiveCover={2000000}
        primaryChildName="Aarav Sharma"
        primaryUniversityName="Indian Institute of Technology Delhi"
        onStartCalculator={handleStart}
        onRegisterChild={handleRegister}
        onViewPolicies={handleView}
      />
    );

    expect(screen.getByText(/Protect Aarav Sharma's Higher Education/i)).toBeDefined();
    expect(screen.getByText(/Welcome back,/i)).toBeDefined();
    expect(screen.getByText('Rajesh Sharma')).toBeDefined();
    expect(screen.getByText("Protect Your Child's Education")).toBeDefined();

    // Verify campus pills
    expect(screen.getByText('IIT Delhi')).toBeDefined();
    expect(screen.getByText('BITS Pilani')).toBeDefined();

    // Click CTA
    fireEvent.click(screen.getByText("Protect Your Child's Education"));
    expect(handleStart).toHaveBeenCalled();
  });

  // ========================================================
  // TEST 2: Education Protection Calculator (Image 4 & Image 5)
  // ========================================================
  it('2. Calculates real-time age badge, segmented NRI/Income controls, spam badge and child selection in Calculator (Image 4)', () => {
    const handleCalc = vi.fn();

    render(
      <EducationProtectionCalculator
        initialParentName="Rajesh Sharma"
        initialMobile="+91 9876543210"
        students={[mockStudent]}
        onCalculate={handleCalc}
        activeQuoteSummary={{
          studentName: 'Aarav Sharma',
          coverageAmount: 2000000,
          installmentAmount: 1120,
          stepIndex: 2,
          onContinue: vi.fn()
        }}
      />
    );

    // Image 5: Horizontal Tracker
    expect(screen.getByText(/Rajesh Sharma, Continue Aarav Sharma's Education Policy/i)).toBeDefined();
    expect(screen.getByText('Protection Calculated')).toBeDefined();
    expect(screen.getByText('Quote Created')).toBeDefined();

    // Image 4: Form fields
    expect(screen.getByText('Education Protection Calculator')).toBeDefined();
    expect(screen.getByText(/As per your Aadhaar or passport ID proof/i)).toBeDefined();
    expect(screen.getByText(/We Don't Spam • Verified University Fee Updates Only/i)).toBeDefined();

    // Live age badge inside the input
    expect(screen.getByText(/\d+ Years/)).toBeDefined();

    // Income segments: <5, 5-7, 7-10, 10-20, >20
    expect(screen.getByText('<5')).toBeDefined();
    expect(screen.getByText('5-7')).toBeDefined();
    expect(screen.getByText('7-10')).toBeDefined();
    expect(screen.getByText('10-20')).toBeDefined();
    expect(screen.getByText('>20')).toBeDefined();

    // Select different income bracket
    fireEvent.click(screen.getByText('10-20'));

    // Select NRI Yes
    fireEvent.click(screen.getByText('Yes'));

    // Submit calculator
    fireEvent.click(screen.getByText('Calculate Now'));
    expect(handleCalc).toHaveBeenCalledWith(
      expect.objectContaining({
        parentFullName: 'Rajesh Sharma',
        isNri: true,
        incomeBracket: '10-20',
        selectedStudentId: mockStudent.id
      })
    );
  });

  // ========================================================
  // TEST 3: Personal Details Modal (Image 3)
  // ========================================================
  it('3. Renders Image 3 modal with handle bar, gender discount, merit concession, language pills, 2x2 occupation cards and education options', () => {
    const handleProceed = vi.fn();
    const handleClose = vi.fn();

    render(
      <PersonalDetailsModal
        isOpen={true}
        onClose={handleClose}
        onProceed={handleProceed}
        studentName="Aarav Sharma"
      />
    );

    expect(screen.getByText('Required below details for your coverage')).toBeDefined();
    expect(screen.getByText(/15% Lesser Premium/i)).toBeDefined();
    expect(screen.getByText(/10% Merit Discount/i)).toBeDefined();

    // Languages
    expect(screen.getByText('Hindi')).toBeDefined();
    expect(screen.getByText('English')).toBeDefined();
    expect(screen.getByText('Tamil')).toBeDefined();

    // 2x2 Occupation grid
    expect(screen.getByText('Salaried')).toBeDefined();
    expect(screen.getByText('15% Discount')).toBeDefined();
    expect(screen.getByText('Self-employed / Business')).toBeDefined();
    expect(screen.getByText('Housewife / Homemaker')).toBeDefined();
    expect(screen.getByText('Academic / Professional')).toBeDefined();

    // Education
    expect(screen.getByText('Graduate & Above')).toBeDefined();
    expect(screen.getByText('12th Pass')).toBeDefined();
    expect(screen.getByText('10th Pass')).toBeDefined();

    // Click Proceed
    fireEvent.click(screen.getByText('Proceed'));
    expect(handleProceed).toHaveBeenCalledWith(
      expect.objectContaining({
        parentGender: 'Female',
        admissionCategory: 'Merit',
        parentOccupation: 'Salaried',
        parentEducation: 'Graduate & Above'
      })
    );
  });

  // ========================================================
  // TEST 4: Continuity & Health Details Modal (Image 2)
  // ========================================================
  it('4. Renders Image 2 modal with back button, health questions, single parent marital status, and direct university escrow routing', () => {
    const handleCheckCoverage = vi.fn();
    const handleBack = vi.fn();
    const handleClose = vi.fn();

    render(
      <ContinuityDetailsModal
        isOpen={true}
        onBack={handleBack}
        onClose={handleClose}
        onCheckCoverage={handleCheckCoverage}
      />
    );

    expect(screen.getByText('Required below details for your coverage')).toBeDefined();
    expect(screen.getByText(/Any Chronic or Critical Pre-existing Illness in Breadwinner\?/i)).toBeDefined();
    expect(screen.getByText('Marital Status')).toBeDefined();
    expect(screen.getByText(/In case of 'Widow\(er\) or Divorced', select “Single” as the option/i)).toBeDefined();
    expect(screen.getByText('Direct to University')).toBeDefined();
    expect(screen.getByText('Recommended Escrow')).toBeDefined();

    // Test back button
    fireEvent.click(screen.getByTitle('Go back'));
    expect(handleBack).toHaveBeenCalled();

    // Test Check Coverage button
    fireEvent.click(screen.getByText('Check Coverage'));
    expect(handleCheckCoverage).toHaveBeenCalledWith(
      expect.objectContaining({
        hasCriticalIllness: false,
        maritalStatus: 'Single',
        escrowPreference: 'DIRECT_UNIVERSITY'
      })
    );
  });

  // ========================================================
  // TEST 5: Policy Customization Studio (Image 1 & Image 5)
  // ========================================================
  it('5. Renders Image 1 customization studio with duration tabs, cover limits, green Free-Look card, breakdown and genuine trust stats', () => {
    const handleLock = vi.fn();
    const handleEdit = vi.fn();

    render(
      <PolicyCustomizationStudio
        parentName="Rajesh Sharma"
        student={mockStudent}
        product={sampleProduct}
        initialCoverageAmount={2000000}
        initialDurationYears={4}
        initialFrequency="ANNUAL"
        hasMeritDiscount={true}
        hasGenderDiscount={true}
        onEditInfo={handleEdit}
        onLockQuote={handleLock}
      />
    );

    // Step Header (Image 1 Top)
    expect(screen.getByText(/Step 1\/4: Plan Customization/i)).toBeDefined();
    expect(screen.getByText(/Rajesh Sharma, customize Aarav Sharma's Education Protection Plan/i)).toBeDefined();
    expect(screen.getByText('Edit Info')).toBeDefined();

    // Cover options & Payment terms
    expect(screen.getByText('Education Cover')).toBeDefined();
    expect(screen.getByText('Premium Payment Term')).toBeDefined();
    expect(screen.getByText(/Save up to 10% by paying annually/i)).toBeDefined();

    // Image 1 Duration Tabs with live prices
    expect(screen.getByText('Cover Duration / Academic Term')).toBeDefined();
    expect(screen.getByText('4 Years')).toBeDefined();
    expect(screen.getByText('3 Years')).toBeDefined();
    expect(screen.getByText('2 Years')).toBeDefined();
    expect(screen.getByText('1 Year')).toBeDefined();

    // Image 1 Green Highlight Box
    expect(screen.getByText(/Free of Cost:/i)).toBeDefined();
    expect(screen.getByText(/Option to exit the plan and get your/i)).toBeDefined();
    expect(screen.getByText(/100% premium refund/i)).toBeDefined();
    expect(screen.getByText(/15-day statutory Free-Look period/i)).toBeDefined();

    // Image 1 Bottom Trust Stats (Genuine EduShield Data)
    expect(screen.getByText('Total Education Covered')).toBeDefined();
    expect(screen.getByText('₹ 42.8 Cr')).toBeDefined();
    expect(screen.getByText('Semester Fees Escrowed')).toBeDefined();
    expect(screen.getByText('₹ 6.42 Cr')).toBeDefined();
    expect(screen.getByText('Students Safeguarded')).toBeDefined();
    expect(screen.getByText('1,240+')).toBeDefined();
    expect(screen.getByText('Direct Settlement Ratio')).toBeDefined();
    expect(screen.getByText('100%^')).toBeDefined();

    // Premium Breakdown
    expect(screen.getByText('Transparent Premium Breakdown')).toBeDefined();
    expect(screen.getByText(/Student Academic Merit Discount \(10%\):/i)).toBeDefined();
    expect(screen.getByText(/Single Mother \/ Female Parent Concession \(5%\):/i)).toBeDefined();
    expect(screen.getByText(/Statutory GST \(18% in India\):/i)).toBeDefined();

    // Edit Info trigger
    fireEvent.click(screen.getByText('Edit Info'));
    expect(handleEdit).toHaveBeenCalled();

    // Lock In Guaranteed Quote button
    fireEvent.click(screen.getByText(/Lock In Guaranteed Quote & Proceed to Bind/i));
    expect(handleLock).toHaveBeenCalledWith(
      expect.objectContaining({
        coverageAmount: 2000000,
        durationYears: 4,
        frequency: 'ANNUAL'
      })
    );
  });

  // ========================================================
  // TEST 6: Existing Policies Summary (Requirement 7)
  // ========================================================
  it('6. Renders existing active policies, student details, premium status, digital policy link and claim progress', () => {
    const handleNewQuote = vi.fn();

    const mockPolicy: EducationPolicy = {
      id: 'pol_test_1',
      policyNumber: 'EDU-2026-102938',
      quoteId: 'qte_test_1',
      guardianId: 'usr_guardian_1',
      guardianName: 'Rajesh Sharma',
      guardianEmail: 'guardian@edushield.demo',
      studentId: mockStudent.id,
      studentName: mockStudent.fullName,
      universityId: mockStudent.universityId,
      universityName: mockStudent.universityName,
      planId: sampleProduct.id,
      planName: sampleProduct.name,
      coverageAmount: 2000000,
      totalAnnualPremium: 14500,
      effectiveDate: '2026-07-01T00:00:00.000Z',
      expiryDate: '2027-06-30T23:59:59.000Z',
      renewalDueDate: '2027-05-31T00:00:00.000Z',
      waitingPeriodDays: 15,
      waitingPeriodEndsAt: '2026-07-16T00:00:00.000Z',
      status: 'ACTIVE',
      benefits: [],
      exclusions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const mockClaim: EducationClaim = {
      id: 'clm_test_1',
      claimNumber: 'CLM-2026-99001',
      policyId: mockPolicy.id,
      policyNumber: mockPolicy.policyNumber,
      guardianId: 'usr_guardian_1',
      guardianName: 'Rajesh Sharma',
      studentId: mockStudent.id,
      studentName: mockStudent.fullName,
      universityId: mockStudent.universityId,
      universityName: mockStudent.universityName,
      claimType: 'PARENT_DEATH',
      incidentDate: '2026-03-01',
      description: 'Accidental tragedy claim',
      requestedAmount: 300000,
      eligibleAmount: 300000,
      approvedAmount: 0,
      status: 'UNDER_REVIEW',
      documents: [],
      reviews: [],
      readinessScore: 85,
      readinessChecklist: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    render(
      <BrowserRouter>
        <ExistingPoliciesSummary
          policies={[mockPolicy]}
          claims={[mockClaim]}
          students={[mockStudent]}
          onOpenNewQuote={handleNewQuote}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Active Family Policies & Insured Children')).toBeDefined();
    expect(screen.getByText('Aarav Sharma')).toBeDefined();
    expect(screen.getByText(mockPolicy.policyNumber)).toBeDefined();
    expect(screen.getByText(mockStudent.universityName)).toBeDefined();
    expect(screen.getByText(/Active Claim In Adjudication/i)).toBeDefined();
    expect(screen.getByText(/Digital Policy & Terms/i)).toBeDefined();
  });
});
