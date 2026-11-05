import { 
  InsuranceProduct, 
  PolicyVersion 
} from '../models/insurance';

export const SEED_ENTERPRISE_PRODUCTS: InsuranceProduct[] = [
  {
    id: 'prod_foundation',
    code: 'EDUSH-FND-2026',
    name: 'EduShield Foundation Shield',
    tier: 'BASIC',
    category: 'FOUNDATION',
    shortDescription: 'Essential college tuition fee security covering accidental death or total permanent disability of the parent/guardian.',
    detailedDescription: 'EduShield Foundation Shield provides structured, verified education tuition protection for undergraduate and diploma students. Direct disbursement to verified university fee escrow accounts guarantees academic continuation without diversion of funds.',
    policyPurpose: 'Guaranteed university tuition fee continuation for enrolled students upon untimely demise or permanent total disablement of the primary earning parent or legal guardian.',
    targetCustomerSegment: 'Undergraduate engineering, sciences, and commerce students in recognized Indian partner institutions.',
    eligibleStudentCategories: ['Regular Full-Time', 'Merit Scholar', 'State Quota'],
    applicableInstitutions: ['ALL'],
    applicableAcademicProgrammes: [
      'B.Tech / B.E. (Engineering)',
      'B.Sc / BCA (Computer Applications)',
      'B.Com / BBA (Business & Commerce)',
      'Diploma in Engineering / PolyTech'
    ],
    applicableAdmissionCategories: ['Merit / Entrance Exam', 'Direct / General', 'Lateral Entry'],
    policyDurationYearsOptions: [1, 2, 3, 4],
    currentVersion: '1.0.0',
    status: 'PUBLISHED',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    expiryDate: '2027-12-31T23:59:59.000Z',

    eligibilityCriteria: {
      minAge: 16,
      maxAge: 26,
      allowedAdmissionStatuses: ['ADMITTED', 'CONFIRMED', 'PROVISIONAL'],
      requireActiveEnrollment: true,
      allowedDegreeTypes: ['UNDERGRADUATE', 'DIPLOMA'],
      allowedCourseDurationsYears: [1, 2, 3, 4],
      allowedAcademicYears: [1, 2, 3, 4],
      eligibleInstitutionIds: ['univ_iitd', 'univ_bits', 'univ_nitt', 'univ_du', 'univ_reva'],
      allowedResidencies: ['RESIDENT_INDIAN', 'OCI'],
      allowedStates: ['ALL_INDIA'],
      requireStudentIdProof: true,
      requireParentIdProof: true,
      requireRelationshipProof: true,
      requireAdmissionLetter: true,
      requireEnrollmentCertificate: true,
      requireUniversityVerification: true,
      ruleRequirementLevel: {
        minAge: 'MANDATORY',
        maxAge: 'MANDATORY',
        activeEnrollment: 'MANDATORY',
        degreeType: 'MANDATORY',
        institutionEligibility: 'MANDATORY',
        idProof: 'MANDATORY',
        universityVerification: 'MANDATORY',
      }
    },

    coverageBenefits: [
      {
        id: 'cov_fnd_death',
        category: 'PARENT_DEATH',
        name: 'Parental Death Tuition Continuation',
        description: 'Disburses 100% of verified outstanding annual semester tuition fees directly to the accredited partner institution fee account.',
        benefitAmount: 1500000,
        maxBenefitAmount: 1500000,
        perEventLimit: 1500000,
        annualLimit: 500000,
        aggregateLimit: 1500000,
        waitingPeriodDays: 30,
        requiredClaimDocuments: ['DEATH_CERTIFICATE', 'IDENTITY_PROOF', 'FEE_DEMAND_STATEMENT'],
        geographicRestrictions: ['INDIA'],
        benefitRecipient: 'UNIVERSITY_DIRECT',
        isOptionalAddon: false,
        addonPremium: 0
      },
      {
        id: 'cov_fnd_disability',
        category: 'PARENT_DISABILITY',
        name: 'Parental Permanent Total Disability (>50%)',
        description: 'Full tuition fee protection certified by District Medical Board resulting in irreversible loss of earning capacity.',
        benefitAmount: 1500000,
        maxBenefitAmount: 1500000,
        perEventLimit: 1500000,
        annualLimit: 500000,
        aggregateLimit: 1500000,
        waitingPeriodDays: 30,
        requiredClaimDocuments: ['DISABILITY_CERTIFICATE', 'IDENTITY_PROOF', 'FEE_DEMAND_STATEMENT'],
        geographicRestrictions: ['INDIA'],
        benefitRecipient: 'UNIVERSITY_DIRECT',
        isOptionalAddon: false,
        addonPremium: 0
      },
      {
        id: 'cov_fnd_grant',
        category: 'TUITION_PROTECTION',
        name: 'Emergency Academic Continuity Grant',
        description: 'Single-event immediate academic grant for semester examination fees, course books, and lab instruments.',
        benefitAmount: 25000,
        maxBenefitAmount: 25000,
        perEventLimit: 25000,
        annualLimit: 25000,
        aggregateLimit: 25000,
        waitingPeriodDays: 0,
        requiredClaimDocuments: ['IDENTITY_PROOF', 'FEE_DEMAND_STATEMENT'],
        geographicRestrictions: ['INDIA'],
        benefitRecipient: 'STUDENT',
        isOptionalAddon: false,
        addonPremium: 0
      },
      {
        id: 'cov_fnd_addon_med',
        category: 'EMERGENCY_MEDICAL',
        name: 'Parent Emergency Hospitalization Shield (Rider)',
        description: 'Emergency inpatient stabilization cover for the breadwinner parent to prevent education savings depletion.',
        benefitAmount: 100000,
        maxBenefitAmount: 100000,
        perEventLimit: 100000,
        annualLimit: 100000,
        aggregateLimit: 100000,
        waitingPeriodDays: 15,
        requiredClaimDocuments: ['MEDICAL_REPORT', 'IDENTITY_PROOF'],
        geographicRestrictions: ['INDIA'],
        benefitRecipient: 'GUARDIAN',
        isOptionalAddon: true,
        addonPremium: 1500
      }
    ],

    exclusions: [
      {
        id: 'ex_fnd_preexisting',
        title: 'Pre-existing Medical Conditions (24 Months)',
        detailedExplanation: 'Illnesses, injuries, or chronic conditions diagnosed or medically treated within 24 months preceding the policy effective date are excluded from mortality and disability coverage.',
        applicableCategory: 'ALL',
        applicableConditions: 'Medical records indicating prior diagnosis within statutory lookback window.',
        exceptions: 'Acute unexpected accidental injuries occurring strictly after policy inception date.',
        effectivePeriod: 'First 24 months of policy duration'
      },
      {
        id: 'ex_fnd_suicide',
        title: 'Intentional Self-Injury and Suicide',
        detailedExplanation: 'Death or disability resulting directly or indirectly from intentional self-inflicted harm or suicide is excluded.',
        applicableCategory: 'PARENT_DEATH',
        applicableConditions: 'Police final report / inquest finding of suicide or self-harm.',
        effectivePeriod: 'Entire policy tenure'
      },
      {
        id: 'ex_fnd_misconduct',
        title: 'Disciplinary Expulsion or Academic Misconduct',
        detailedExplanation: 'Tuition fees will not be disbursed if the student is expelled or suspended due to examination malpractice, ragging, or institutional disciplinary proceedings.',
        applicableCategory: 'TUITION_PROTECTION',
        applicableConditions: 'Formal registrar disciplinary notification.',
        effectivePeriod: 'Entire policy tenure'
      },
      {
        id: 'ex_fnd_fraud',
        title: 'Fraudulent Claims and Falsified Records',
        detailedExplanation: 'Submission of fabricated hospital certificates, manipulated marks memos, or forged fee challans immediately voids the policy and triggers cancellation.',
        applicableCategory: 'ALL',
        applicableConditions: 'Forensic or institutional verification discrepancy.',
        effectivePeriod: 'Entire policy tenure'
      }
    ],

    financialLimits: {
      sumInsured: 1500000,
      maxCoverageLimit: 1500000,
      perEventLimit: 1500000,
      annualClaimLimit: 500000,
      aggregateClaimLimit: 1500000,
      deductibleAmount: 0,
      coPaymentPercent: 0,
      maxPayableBenefit: 1500000,
      minClaimAmount: 10000,
      sublimits: [
        { benefitCategory: 'TUITION_PROTECTION', limitAmount: 500000, description: 'Annual semester tuition ceiling' },
        { benefitCategory: 'EMERGENCY_MEDICAL', limitAmount: 100000, description: 'Medical rider annual cap' }
      ]
    },

    premiumConfig: {
      basePremium: 2500,
      baseRatePercent: 2.2,
      ageBands: [
        { minAge: 16, maxAge: 17, factor: 0.95, description: 'Early-entry student discount (5%)' },
        { minAge: 18, maxAge: 25, factor: 1.00, description: 'Standard college cohort' },
        { minAge: 26, maxAge: 28, factor: 1.05, description: 'Mature student adjustment (+5%)' },
        { minAge: 29, maxAge: 35, factor: 1.15, description: 'Non-traditional age adjustment (+15%)' }
      ],
      durationFactors: [
        { durationYears: 1, factor: 1.00, discountPercent: 0 },
        { durationYears: 2, factor: 0.98, discountPercent: 2 },
        { durationYears: 3, factor: 0.95, discountPercent: 5 },
        { durationYears: 4, factor: 0.90, discountPercent: 10 }
      ],
      taxRatePercent: 18,
      minPremium: 3500,
      maxPremium: 45000,
      availableFrequencies: ['ANNUAL', 'SEMESTER', 'QUARTERLY'],
      frequencyMultipliers: {
        ANNUAL: 1.00,
        SEMESTER: 0.52,
        QUARTERLY: 0.27
      },
      discounts: [
        { code: 'MERIT_10', name: 'Merit Scholar Concession', discountPercent: 10, description: '10% discount for students with >90% qualifying board marks' },
        { code: 'SIBLING_5', name: 'Co-Enrolled Sibling Discount', discountPercent: 5, description: '5% discount when multiple children hold active EduShield policies' }
      ]
    },

    issuanceRequirements: {
      requireAuthentication: true,
      requireEligibilityVerification: true,
      requireInstitutionEligibility: true,
      requireIdentityVerification: true,
      requireEnrollmentProof: true,
      requireMandatoryDeclarations: true,
      requireTermsAcceptance: true,
      requirePremiumPayment: true,
      requireUnderwritingApproval: false
    },

    renewalConditions: {
      isRenewable: true,
      renewalWindowDays: 30,
      gracePeriodDays: 15,
      reinstatementAllowed: true,
      reinstatementPeriodDays: 30,
      requiresReVerification: true,
      renewalDiscountPercent: 5,
      noticeBeforeExpiryDays: 45
    },

    cancellationConditions: {
      allowPolicyholderCancellation: true,
      freeLookPeriodDays: 15,
      noticePeriodDays: 15,
      refundMethod: 'SHORT_PERIOD',
      minRetainedPremiumPercent: 20,
      noRefundIfClaimsMade: true,
      cancellationReasons: [
        'Voluntary withdrawal from university',
        'Transfer to unapproved overseas institution',
        'Acquired alternative corporate education sponsorship',
        'Financial restructuring'
      ]
    },

    termsAndConditions: {
      version: '1.0.0-FND',
      effectiveDate: '2026-01-01',
      policyholderResponsibilities: [
        'Prompt payment of premium installments prior to the expiration of the statutory grace period.',
        'Immediate notification to EduShield within 14 calendar days of any change in academic enrollment status or university withdrawal.',
        'Honest and truthful disclosure of all material medical history and pre-existing diagnoses.'
      ],
      insuredStudentResponsibilities: [
        'Maintaining satisfactory academic progression with minimum pass standing certified by the university registrar.',
        'Refraining from participation in unlawful, prohibited, or disciplinary institutional activities.',
        'Providing verified enrollment receipts and semester fee vouchers upon annual renewal.'
      ],
      disclosureObligations: 'Section 45 Insurance Act: The policyholder is under a strict legal duty of utmost good faith (uberrimae fidei) to disclose all material facts affecting the risk proposed.',
      waitingPeriodClauses: 'A 30-day initial waiting period applies from the inception date for all non-accidental illness claims. Accidental mortality carries zero waiting period.',
      claimNotificationPeriodDays: 14,
      claimSubmissionTimelineDays: 30,
      benefitLimitations: [
        'Total lifetime payout under this policy cannot exceed ₹15,00,000.',
        'Annual fee disbursement is strictly capped at verified outstanding fee demand vouchers.',
        'Payouts disburse strictly to the verified Registrar Fee Escrow Account.'
      ],
      disputeResolutionProcess: 'All disputes shall first be submitted to the EduShield Ombudsman Grievance Cell. Unresolved disputes shall be referred to institutional arbitration in New Delhi under the Arbitration and Conciliation Act, 1996.',
      grievanceContact: {
        name: 'Ombudsman & Grievance Redressal Cell',
        designation: 'Principal Grievance Officer',
        email: 'grievance.officer@edushield.demo',
        phone: '+91 11 2659 7999',
        address: 'EduShield Compliance Desk, IIT Delhi Research Park, Hauz Khas, New Delhi 110016'
      },
      applicableJurisdiction: 'High Court of Delhi at New Delhi, India'
    },

    createdBy: 'usr_admin_1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    publishedAt: '2026-01-02T10:00:00.000Z'
  },

  {
    id: 'prod_comprehensive',
    code: 'EDUSH-CMP-2026',
    name: 'EduShield Comprehensive Campus Shield',
    tier: 'COMPREHENSIVE',
    category: 'COMPREHENSIVE',
    shortDescription: 'Our most comprehensive protection covering tuition, campus hostel accommodation, and parental critical illness.',
    detailedDescription: 'EduShield Comprehensive Campus Shield delivers end-to-end security for university students. It shields tuition dues, campus boarding expenses, and breadwinner hospitalization caused by acute critical illnesses.',
    policyPurpose: 'Holistic education continuity safeguarding tuition, campus boarding charges, and sudden parental critical healthcare emergencies.',
    targetCustomerSegment: 'Residential and out-station college students enrolled in premier universities across India.',
    eligibleStudentCategories: ['Residential Scholar', 'Day Scholar', 'Self-Financed'],
    applicableInstitutions: ['ALL'],
    applicableAcademicProgrammes: [
      'B.Tech / B.E. (Engineering)',
      'M.Tech / M.E. (Postgraduate Engineering)',
      'MBA / PGDM (Management)',
      'B.Sc / M.Sc (Natural Sciences)'
    ],
    applicableAdmissionCategories: ['Merit / Entrance Exam', 'Direct / General', 'Management Quota'],
    policyDurationYearsOptions: [1, 2, 3, 4, 5],
    currentVersion: '1.2.0',
    status: 'PUBLISHED',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    expiryDate: '2027-12-31T23:59:59.000Z',

    eligibilityCriteria: {
      minAge: 16,
      maxAge: 28,
      allowedAdmissionStatuses: ['ADMITTED', 'CONFIRMED'],
      requireActiveEnrollment: true,
      allowedDegreeTypes: ['UNDERGRADUATE', 'POSTGRADUATE', 'DIPLOMA'],
      allowedCourseDurationsYears: [1, 2, 3, 4, 5],
      allowedAcademicYears: [1, 2, 3, 4, 5],
      eligibleInstitutionIds: ['univ_iitd', 'univ_bits', 'univ_nitt', 'univ_du', 'univ_reva'],
      allowedResidencies: ['RESIDENT_INDIAN', 'NRI', 'OCI'],
      allowedStates: ['ALL_INDIA'],
      requireStudentIdProof: true,
      requireParentIdProof: true,
      requireRelationshipProof: true,
      requireAdmissionLetter: true,
      requireEnrollmentCertificate: true,
      requireUniversityVerification: true,
      ruleRequirementLevel: {
        minAge: 'MANDATORY',
        maxAge: 'MANDATORY',
        activeEnrollment: 'MANDATORY',
        degreeType: 'MANDATORY',
        institutionEligibility: 'MANDATORY',
        idProof: 'MANDATORY',
        universityVerification: 'MANDATORY',
      }
    },

    coverageBenefits: [
      {
        id: 'cov_cmp_death',
        category: 'PARENT_DEATH',
        name: 'Parental Death Complete Tuition Coverage',
        description: 'Covers full tuition and institute laboratory expenses directly to university escrow.',
        benefitAmount: 3500000,
        maxBenefitAmount: 3500000,
        perEventLimit: 3500000,
        annualLimit: 1000000,
        aggregateLimit: 3500000,
        waitingPeriodDays: 15,
        requiredClaimDocuments: ['DEATH_CERTIFICATE', 'IDENTITY_PROOF', 'FEE_DEMAND_STATEMENT'],
        geographicRestrictions: ['INDIA'],
        benefitRecipient: 'UNIVERSITY_DIRECT',
        isOptionalAddon: false,
        addonPremium: 0
      },
      {
        id: 'cov_cmp_critical',
        category: 'CRITICAL_ILLNESS',
        name: 'Parent Critical Illness Tuition Continuation',
        description: 'Protection triggered by 15 major critical illnesses (cardiac arrest, stroke, organ failure, cancer) to protect ongoing semester dues.',
        benefitAmount: 3500000,
        maxBenefitAmount: 3500000,
        perEventLimit: 3500000,
        annualLimit: 1000000,
        aggregateLimit: 3500000,
        waitingPeriodDays: 15,
        requiredClaimDocuments: ['MEDICAL_REPORT', 'IDENTITY_PROOF', 'FEE_DEMAND_STATEMENT'],
        geographicRestrictions: ['INDIA'],
        benefitRecipient: 'UNIVERSITY_DIRECT',
        isOptionalAddon: false,
        addonPremium: 0
      },
      {
        id: 'cov_cmp_hostel',
        category: 'HOSTEL_LIVING',
        name: 'Campus Hostel & Mess Subsidy',
        description: 'Living, mess, and hostel room boarding allowance disbursed upon semester verification.',
        benefitAmount: 150000,
        maxBenefitAmount: 150000,
        perEventLimit: 150000,
        annualLimit: 150000,
        aggregateLimit: 600000,
        waitingPeriodDays: 15,
        requiredClaimDocuments: ['FEE_DEMAND_STATEMENT', 'IDENTITY_PROOF'],
        geographicRestrictions: ['INDIA'],
        benefitRecipient: 'STUDENT',
        isOptionalAddon: false,
        addonPremium: 0
      },
      {
        id: 'cov_cmp_laptop',
        category: 'CAREER_CONTINUITY',
        name: 'Technical Equipment & Laptop Shield (Rider)',
        description: 'Coverage against accidental damage or loss of engineering workstation, laptop, or specialized laboratory equipment.',
        benefitAmount: 75000,
        maxBenefitAmount: 75000,
        perEventLimit: 75000,
        annualLimit: 75000,
        aggregateLimit: 75000,
        waitingPeriodDays: 7,
        requiredClaimDocuments: ['IDENTITY_PROOF'],
        geographicRestrictions: ['INDIA'],
        benefitRecipient: 'STUDENT',
        isOptionalAddon: true,
        addonPremium: 2400
      }
    ],

    exclusions: [
      {
        id: 'ex_cmp_elective',
        title: 'Elective and Non-Emergency Treatments',
        detailedExplanation: 'Elective cosmetic surgeries, unapproved alternative remedies, or outpatient general wellness checkups are strictly excluded.',
        applicableCategory: 'CRITICAL_ILLNESS',
        applicableConditions: 'Medical documentation showing non-emergency elective procedure.',
        effectivePeriod: 'Entire policy tenure'
      },
      {
        id: 'ex_cmp_suicide',
        title: 'Self-Inflicted Injury and Suicide',
        detailedExplanation: 'Suicide or attempted self-harm by policyholder.',
        applicableCategory: 'PARENT_DEATH',
        applicableConditions: 'Police inquest records.',
        effectivePeriod: 'Entire tenure'
      },
      {
        id: 'ex_cmp_cgpa',
        title: 'Academic Disqualification (CGPA < 3.0)',
        detailedExplanation: 'Failure to maintain academic standing leading to university de-registration.',
        applicableCategory: 'TUITION_PROTECTION',
        applicableConditions: 'Registrar academic dismissal transcript.',
        effectivePeriod: 'Entire tenure'
      }
    ],

    financialLimits: {
      sumInsured: 3500000,
      maxCoverageLimit: 3500000,
      perEventLimit: 3500000,
      annualClaimLimit: 1200000,
      aggregateClaimLimit: 3500000,
      deductibleAmount: 5000,
      coPaymentPercent: 0,
      maxPayableBenefit: 3500000,
      minClaimAmount: 10000,
      sublimits: [
        { benefitCategory: 'HOSTEL_LIVING', limitAmount: 150000, description: 'Annual campus boarding cap' },
        { benefitCategory: 'CAREER_CONTINUITY', limitAmount: 75000, description: 'Equipment rider cap' }
      ]
    },

    premiumConfig: {
      basePremium: 3800,
      baseRatePercent: 3.1,
      ageBands: [
        { minAge: 16, maxAge: 17, factor: 0.95, description: 'Junior discount (5%)' },
        { minAge: 18, maxAge: 25, factor: 1.00, description: 'Standard age bracket' },
        { minAge: 26, maxAge: 28, factor: 1.05, description: 'Postgraduate adjustment' },
        { minAge: 29, maxAge: 35, factor: 1.12, description: 'Senior student adjustment' }
      ],
      durationFactors: [
        { durationYears: 1, factor: 1.00, discountPercent: 0 },
        { durationYears: 2, factor: 0.97, discountPercent: 3 },
        { durationYears: 3, factor: 0.95, discountPercent: 5 },
        { durationYears: 4, factor: 0.90, discountPercent: 10 },
        { durationYears: 5, factor: 0.88, discountPercent: 12 }
      ],
      taxRatePercent: 18,
      minPremium: 5000,
      maxPremium: 85000,
      availableFrequencies: ['ANNUAL', 'SEMESTER', 'QUARTERLY'],
      frequencyMultipliers: {
        ANNUAL: 1.00,
        SEMESTER: 0.52,
        QUARTERLY: 0.27
      },
      discounts: [
        { code: 'MERIT_10', name: 'Academic Merit Concession', discountPercent: 10, description: '10% concession for students with verified academic merit' },
        { code: 'LOYALTY_5', name: 'Consecutive Enrollment Discount', discountPercent: 5, description: '5% discount for renewing EduShield families' },
        { code: 'TOP_RANK_12', name: 'NIRF Top 10 Campus Concession', discountPercent: 12, description: '12% discount for premier NIRF Top 10 institutions (IITD, BITS, NITT)' }
      ]
    },

    issuanceRequirements: {
      requireAuthentication: true,
      requireEligibilityVerification: true,
      requireInstitutionEligibility: true,
      requireIdentityVerification: true,
      requireEnrollmentProof: true,
      requireMandatoryDeclarations: true,
      requireTermsAcceptance: true,
      requirePremiumPayment: true,
      requireUnderwritingApproval: false
    },

    renewalConditions: {
      isRenewable: true,
      renewalWindowDays: 30,
      gracePeriodDays: 15,
      reinstatementAllowed: true,
      reinstatementPeriodDays: 30,
      requiresReVerification: true,
      renewalDiscountPercent: 5,
      noticeBeforeExpiryDays: 45
    },

    cancellationConditions: {
      allowPolicyholderCancellation: true,
      freeLookPeriodDays: 15,
      noticePeriodDays: 15,
      refundMethod: 'SHORT_PERIOD',
      minRetainedPremiumPercent: 20,
      noRefundIfClaimsMade: true,
      cancellationReasons: [
        'Voluntary withdrawal from campus',
        'Corporate fellowship award',
        'Change of financial guarantor'
      ]
    },

    termsAndConditions: {
      version: '1.2.0-CMP',
      effectiveDate: '2026-01-01',
      policyholderResponsibilities: [
        'Furnishing complete diagnostic discharge reports for any critical illness claims within 21 days of discharge.',
        'Submitting verified university fee demand challans for tuition escrow routing.',
        'Maintaining prompt payment of renewal premiums.'
      ],
      insuredStudentResponsibilities: [
        'Active campus enrollment in good standing with university registrar.',
        'Immediate reporting of any disciplinary suspension.'
      ],
      disclosureObligations: 'Full medical disclosure of existing cardiovascular, oncological, and neurological history is mandatory under Indian Insurance Act.',
      waitingPeriodClauses: '15-day statutory waiting period from effective date for critical illness claims. Accidental mortality carries zero waiting period.',
      claimNotificationPeriodDays: 14,
      claimSubmissionTimelineDays: 30,
      benefitLimitations: [
        'Maximum cumulative benefits capped at ₹35,00,000.',
        'Hostel room and mess allowance requires official hostel warden certification.'
      ],
      disputeResolutionProcess: 'Mandatory mediation via EduShield Ombudsman, followed by arbitration in New Delhi.',
      grievanceContact: {
        name: 'EduShield Customer Redressal Directorate',
        designation: 'Senior Grievance Officer',
        email: 'grievance.comprehensive@edushield.demo',
        phone: '+91 11 2659 7888',
        address: 'EduShield Claims Desk, Hauz Khas, New Delhi 110016'
      },
      applicableJurisdiction: 'Courts of Delhi, India'
    },

    createdBy: 'usr_admin_1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    publishedAt: '2026-01-02T10:00:00.000Z'
  },

  {
    id: 'prod_scholar_elite',
    code: 'EDUSH-ELT-2026',
    name: 'EduShield Scholar Elite Global Shield',
    tier: 'PREMIUM',
    category: 'SCHOLAR_ELITE',
    shortDescription: 'Premier all-inclusive education security with zero waiting period, international study rider, and career cushion.',
    detailedDescription: 'EduShield Scholar Elite provides the highest tier of education security up to ₹75 Lakhs. Covers international exchange terms, zero waiting period on acute emergencies, and post-graduation transition living stipends.',
    policyPurpose: 'Uncompromised global education continuity for high-achieving scholars and multi-year professional degree candidates.',
    targetCustomerSegment: 'Honors, dual-degree, and international exchange students at premier technical universities.',
    eligibleStudentCategories: ['Honors Scholar', 'Dual Degree Scholar', 'Exchange Student', 'Postgraduate'],
    applicableInstitutions: ['ALL'],
    applicableAcademicProgrammes: [
      'Dual Degree (B.Tech + M.Tech)',
      'B.Tech with International Semester',
      'Integrated Masters & Doctorate',
      'All Accredited Engineering & Sciences'
    ],
    applicableAdmissionCategories: ['Merit Entrance (JEE/BITSAT/GATE)', 'International Exchange', 'Direct Admission'],
    policyDurationYearsOptions: [1, 2, 3, 4, 5],
    currentVersion: '2.0.0',
    status: 'PUBLISHED',
    effectiveDate: '2026-01-01T00:00:00.000Z',
    expiryDate: '2027-12-31T23:59:59.000Z',

    eligibilityCriteria: {
      minAge: 16,
      maxAge: 32,
      allowedAdmissionStatuses: ['ADMITTED', 'CONFIRMED'],
      requireActiveEnrollment: true,
      allowedDegreeTypes: ['UNDERGRADUATE', 'POSTGRADUATE'],
      allowedCourseDurationsYears: [1, 2, 3, 4, 5],
      allowedAcademicYears: [1, 2, 3, 4, 5],
      eligibleInstitutionIds: ['univ_iitd', 'univ_bits', 'univ_nitt', 'univ_du', 'univ_reva'],
      allowedResidencies: ['RESIDENT_INDIAN', 'NRI', 'OCI', 'FOREIGN_NATIONAL'],
      allowedStates: ['ALL_INDIA'],
      requireStudentIdProof: true,
      requireParentIdProof: true,
      requireRelationshipProof: true,
      requireAdmissionLetter: true,
      requireEnrollmentCertificate: true,
      requireUniversityVerification: true,
      ruleRequirementLevel: {
        minAge: 'MANDATORY',
        maxAge: 'MANDATORY',
        activeEnrollment: 'MANDATORY',
        degreeType: 'MANDATORY',
        institutionEligibility: 'MANDATORY',
        idProof: 'MANDATORY',
        universityVerification: 'MANDATORY',
      }
    },

    coverageBenefits: [
      {
        id: 'cov_elt_death_disability',
        category: 'PARENT_DEATH',
        name: 'Full Academic Tuition & Lab Escrow Cover',
        description: 'Complete tuition coverage up to ₹75 Lakhs with zero waiting period.',
        benefitAmount: 7500000,
        maxBenefitAmount: 7500000,
        perEventLimit: 7500000,
        annualLimit: 2000000,
        aggregateLimit: 7500000,
        waitingPeriodDays: 0,
        requiredClaimDocuments: ['DEATH_CERTIFICATE', 'IDENTITY_PROOF', 'FEE_DEMAND_STATEMENT'],
        geographicRestrictions: ['GLOBAL'],
        benefitRecipient: 'UNIVERSITY_DIRECT',
        isOptionalAddon: false,
        addonPremium: 0
      },
      {
        id: 'cov_elt_exchange',
        category: 'EMERGENCY_TRAVEL',
        name: 'International Study Continuity & Exchange Rider',
        description: 'Semester abroad tuition and emergency repatriation allowance for students on verified exchange programs.',
        benefitAmount: 500000,
        maxBenefitAmount: 500000,
        perEventLimit: 500000,
        annualLimit: 500000,
        aggregateLimit: 500000,
        waitingPeriodDays: 0,
        requiredClaimDocuments: ['IDENTITY_PROOF', 'FEE_DEMAND_STATEMENT'],
        geographicRestrictions: ['GLOBAL'],
        benefitRecipient: 'STUDENT',
        isOptionalAddon: false,
        addonPremium: 0
      },
      {
        id: 'cov_elt_career',
        category: 'CAREER_CONTINUITY',
        name: 'Post-Graduation Career Buffer Grant',
        description: 'Provides 6 months living stipend upon graduation if the student faced primary guardian bereavement during the final year.',
        benefitAmount: 120000,
        maxBenefitAmount: 120000,
        perEventLimit: 120000,
        annualLimit: 120000,
        aggregateLimit: 120000,
        waitingPeriodDays: 0,
        requiredClaimDocuments: ['IDENTITY_PROOF', 'ENROLLMENT_LETTER'],
        geographicRestrictions: ['INDIA'],
        benefitRecipient: 'STUDENT',
        isOptionalAddon: false,
        addonPremium: 0
      }
    ],

    exclusions: [
      {
        id: 'ex_elt_unaccredited',
        title: 'Non-Accredited Curriculum or Unapproved Institution',
        detailedExplanation: 'Programs without UGC/AICTE recognition or unaccredited offshore semesters.',
        applicableCategory: 'ALL',
        applicableConditions: 'Lack of accreditation.',
        effectivePeriod: 'Entire tenure'
      },
      {
        id: 'ex_elt_fraud',
        title: 'Fraudulent Claims & Falsification',
        detailedExplanation: 'Fabrication of university dues or counterfeit transcripts.',
        applicableCategory: 'ALL',
        applicableConditions: 'Discrepancy found.',
        effectivePeriod: 'Entire tenure'
      }
    ],

    financialLimits: {
      sumInsured: 7500000,
      maxCoverageLimit: 7500000,
      perEventLimit: 7500000,
      annualClaimLimit: 2500000,
      aggregateClaimLimit: 7500000,
      deductibleAmount: 0,
      coPaymentPercent: 0,
      maxPayableBenefit: 7500000,
      minClaimAmount: 10000,
      sublimits: [
        { benefitCategory: 'EMERGENCY_TRAVEL', limitAmount: 500000, description: 'International exchange cap' },
        { benefitCategory: 'CAREER_CONTINUITY', limitAmount: 120000, description: 'Career buffer stipend' }
      ]
    },

    premiumConfig: {
      basePremium: 5000,
      baseRatePercent: 4.0,
      ageBands: [
        { minAge: 16, maxAge: 25, factor: 1.00, description: 'Standard Scholar' },
        { minAge: 26, maxAge: 32, factor: 1.08, description: 'Doctoral / Advanced Scholar' }
      ],
      durationFactors: [
        { durationYears: 1, factor: 1.00, discountPercent: 0 },
        { durationYears: 2, factor: 0.96, discountPercent: 4 },
        { durationYears: 3, factor: 0.94, discountPercent: 6 },
        { durationYears: 4, factor: 0.90, discountPercent: 10 },
        { durationYears: 5, factor: 0.85, discountPercent: 15 }
      ],
      taxRatePercent: 18,
      minPremium: 8000,
      maxPremium: 150000,
      availableFrequencies: ['ANNUAL', 'SEMESTER'],
      frequencyMultipliers: {
        ANNUAL: 1.00,
        SEMESTER: 0.52,
        QUARTERLY: 0.27
      },
      discounts: [
        { code: 'GLOBAL_SCHOLAR', name: 'Global Honors Scholar', discountPercent: 8, description: '8% discount for verified scholarship holders' }
      ]
    },

    issuanceRequirements: {
      requireAuthentication: true,
      requireEligibilityVerification: true,
      requireInstitutionEligibility: true,
      requireIdentityVerification: true,
      requireEnrollmentProof: true,
      requireMandatoryDeclarations: true,
      requireTermsAcceptance: true,
      requirePremiumPayment: true,
      requireUnderwritingApproval: false
    },

    renewalConditions: {
      isRenewable: true,
      renewalWindowDays: 45,
      gracePeriodDays: 30,
      reinstatementAllowed: true,
      reinstatementPeriodDays: 45,
      requiresReVerification: true,
      renewalDiscountPercent: 8,
      noticeBeforeExpiryDays: 60
    },

    cancellationConditions: {
      allowPolicyholderCancellation: true,
      freeLookPeriodDays: 30,
      noticePeriodDays: 15,
      refundMethod: 'PRO_RATA',
      minRetainedPremiumPercent: 10,
      noRefundIfClaimsMade: true,
      cancellationReasons: [
        'Graduation / early course completion',
        'Direct institutional endowment award'
      ]
    },

    termsAndConditions: {
      version: '2.0.0-ELT',
      effectiveDate: '2026-01-01',
      policyholderResponsibilities: [
        'Immediate reporting of foreign exchange semester arrangements.',
        'Maintaining premium payments on schedule.'
      ],
      insuredStudentResponsibilities: [
        'Full time enrollment at approved institution.',
        'Notification of course progression changes.'
      ],
      disclosureObligations: 'Full disclosure of all existing insurances and academic funding.',
      waitingPeriodClauses: 'Zero waiting period for accidental mortality and acute emergencies.',
      claimNotificationPeriodDays: 30,
      claimSubmissionTimelineDays: 60,
      benefitLimitations: ['Aggregate cap ₹75,00,000.'],
      disputeResolutionProcess: 'Ombudsman arbitration in New Delhi.',
      grievanceContact: {
        name: 'Scholar Elite Executive Desk',
        designation: 'Vice President - Policyholder Governance',
        email: 'elite.desk@edushield.demo',
        phone: '+91 11 2659 7111',
        address: 'EduShield Elite Directorate, Hauz Khas, New Delhi 110016'
      },
      applicableJurisdiction: 'High Court of Delhi, New Delhi, India'
    },

    createdBy: 'usr_admin_1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    publishedAt: '2026-01-02T10:00:00.000Z'
  }
];

export const SEED_ENTERPRISE_VERSIONS: PolicyVersion[] = SEED_ENTERPRISE_PRODUCTS.map((prod) => ({
  id: `ver_${prod.id}_${prod.currentVersion.replace(/\./g, '_')}`,
  productId: prod.id,
  productCode: prod.code,
  versionNumber: prod.currentVersion,
  status: prod.status,
  effectiveDate: prod.effectiveDate,
  expiryDate: prod.expiryDate,
  changeNotes: `Initial baseline release of ${prod.name} version ${prod.currentVersion}. Validated under Guidewire policy administration model.`,
  productSnapshot: prod,
  approvedBy: 'usr_admin_1',
  approvedAt: prod.publishedAt,
  createdAt: prod.createdAt
}));
