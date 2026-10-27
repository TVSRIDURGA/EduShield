import { 
  InsurancePlan, 
  University, 
  UserProfile, 
  Student, 
  Quote, 
  EducationPolicy, 
  EducationClaim, 
  AuditLog, 
  NotificationItem 
} from '../models/insurance';

export const SEED_PLANS: InsurancePlan[] = [
  {
    id: 'plan_foundation',
    code: 'PLN-FOUNDATION',
    name: 'EduShield Foundation',
    tier: 'BASIC',
    description: 'Essential education security covering college tuition in the event of parental death or permanent total disability.',
    baseRatePercent: 2.2, // 2.2% annual rate
    maxCoverageLimit: 1500000, // ₹15 Lakhs
    waitingPeriodDays: 30,
    coveredEvents: ['PARENT_DEATH', 'PARENT_DISABILITY'],
    includedBenefits: [
      '100% Annual College Tuition Protection up to ₹15 Lakhs',
      'Direct disbursement to verified University Registrar account',
      'Single emergency academic continuity grant (₹25,000)',
      'Free AI Policy Assistant & Guidance'
    ],
    exclusions: [
      'Pre-existing critical illnesses diagnosed within 24 months prior',
      'Voluntary withdrawal from university',
      'Disciplinary termination by academic institution',
      'Self-inflicted injuries or reckless negligence'
    ],
    isActive: true,
  },
  {
    id: 'plan_comprehensive',
    code: 'PLN-COMPREHENSIVE',
    name: 'EduShield Comprehensive',
    tier: 'COMPREHENSIVE',
    description: 'Our most popular shield covering full tuition fees, campus hostel & mess charges, and catastrophic medical emergencies.',
    baseRatePercent: 3.1, // 3.1% annual rate
    maxCoverageLimit: 3500000, // ₹35 Lakhs
    waitingPeriodDays: 15,
    coveredEvents: ['PARENT_DEATH', 'PARENT_DISABILITY', 'CRITICAL_ILLNESS'],
    includedBenefits: [
      '100% University Tuition & Mandatory Laboratory Fees up to ₹35 Lakhs',
      'Hostel, Mess and Examination Fee Subsidies (up to ₹1.5L/year)',
      'Critical illness hospitalization coverage for breadwinner parent',
      'Academic semester deferral continuity support',
      'Priority university fee transfer channel within 48 hours of claim approval'
    ],
    exclusions: [
      'Elective non-emergency medical treatments',
      'Failure to maintain minimal academic pass standing (CGPA < 3.0)',
      'Claims without verified university fee demand notes'
    ],
    isActive: true,
  },
  {
    id: 'plan_scholar_elite',
    code: 'PLN-SCHOLAR-ELITE',
    name: 'EduShield Scholar Elite',
    tier: 'PREMIUM',
    description: 'Premier all-inclusive protection with international exchange protection, career cushion, and zero waiting period.',
    baseRatePercent: 4.0, // 4.0% annual rate
    maxCoverageLimit: 7500000, // ₹75 Lakhs
    waitingPeriodDays: 0, // Zero waiting period
    coveredEvents: ['PARENT_DEATH', 'PARENT_DISABILITY', 'CRITICAL_ILLNESS', 'UNEXPECTED_FINANCIAL_HARDSHIP'],
    includedBenefits: [
      'Full Tuition, Campus Accommodation, Laptop & Books up to ₹75 Lakhs',
      'Zero waiting period for accidental mortality and acute emergencies',
      'International study continuity & exchange program insurance rider',
      'Post-graduation career buffer grant (6 months living stipend)',
      'Dedicated Senior Claims Officer and instant AI document triage'
    ],
    exclusions: [
      'Non-accredited institutions or unapproved curriculum',
      'Fraudulent representation or forged academic certificates'
    ],
    isActive: true,
  }
];

export const SEED_UNIVERSITIES: University[] = [
  {
    id: 'univ_iitd',
    name: 'Indian Institute of Technology Delhi (IIT Delhi)',
    code: 'IITD-NDLS',
    city: 'New Delhi',
    state: 'Delhi',
    accreditationGrade: 'NIRF Rank 2 / NAAC A++',
    contactEmail: 'registrar.fees@iitd.ac.in',
    contactPhone: '+91 11 2659 7135',
    bankDetails: {
      accountName: 'IIT Delhi Registrar Fee Collection Account',
      accountNumberMasked: '•••• •••• •••• 9821',
      ifscCode: 'SBIN0001077',
      bankName: 'State Bank of India'
    },
    verifiedStatus: true,
  },
  {
    id: 'univ_bits',
    name: 'BITS Pilani - Hyderabad Campus',
    code: 'BITS-HYD',
    city: 'Hyderabad',
    state: 'Telangana',
    accreditationGrade: 'NAAC A (CGPA 3.45)',
    contactEmail: 'accounts@hyderabad.bits-pilani.ac.in',
    contactPhone: '+91 40 6630 3999',
    bankDetails: {
      accountName: 'Birla Institute of Technology and Science Fee Escrow',
      accountNumberMasked: '•••• •••• •••• 4412',
      ifscCode: 'ICIC0000008',
      bankName: 'ICICI Bank Ltd'
    },
    verifiedStatus: true,
  },
  {
    id: 'univ_nitt',
    name: 'National Institute of Technology Tiruchirappalli (NIT Trichy)',
    code: 'NITT-TN',
    city: 'Tiruchirappalli',
    state: 'Tamil Nadu',
    accreditationGrade: 'NIRF Rank 8 (Engineering)',
    contactEmail: 'academic.accounts@nitt.edu',
    contactPhone: '+91 431 2503000',
    bankDetails: {
      accountName: 'NIT Tiruchirappalli Institute Fee Account',
      accountNumberMasked: '•••• •••• •••• 3024',
      ifscCode: 'SBIN0001617',
      bankName: 'State Bank of India'
    },
    verifiedStatus: true,
  },
  {
    id: 'univ_du',
    name: 'University of Delhi (Cluster Innovation Centre / Faculty of Tech)',
    code: 'DU-DELHI',
    city: 'New Delhi',
    state: 'Delhi',
    accreditationGrade: 'NAAC A+ Accredited',
    contactEmail: 'finance.officer@du.ac.in',
    contactPhone: '+91 11 2766 7011',
    bankDetails: {
      accountName: 'University of Delhi General Fee Account',
      accountNumberMasked: '•••• •••• •••• 1159',
      ifscCode: 'CANB0002845',
      bankName: 'Canara Bank'
    },
    verifiedStatus: true,
  }
];

export const DEMO_USERS: UserProfile[] = [
  {
    id: 'usr_guardian_1',
    uid: 'demo_guardian_uid',
    email: 'guardian@edushield.demo',
    displayName: 'Rajesh Sharma',
    role: 'guardian',
    phoneNumber: '+91 98112 34567',
    createdAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-01-15T09:00:00Z',
  },
  {
    id: 'usr_student_1',
    uid: 'demo_student_uid',
    email: 'student@edushield.demo',
    displayName: 'Aarav Sharma',
    role: 'student',
    phoneNumber: '+91 98112 34568',
    createdAt: '2026-01-15T09:30:00Z',
    updatedAt: '2026-01-15T09:30:00Z',
  },
  {
    id: 'usr_officer_1',
    uid: 'demo_officer_uid',
    email: 'officer@edushield.demo',
    displayName: 'Vikram Mehta (Senior Claims Adjuster)',
    role: 'claims_officer',
    phoneNumber: '+91 97110 55432',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'usr_univ_rep_1',
    uid: 'demo_univ_uid',
    email: 'university@edushield.demo',
    displayName: 'Dr. Sunita Deshmukh (Registrar Accounts)',
    role: 'university',
    universityId: 'univ_iitd',
    phoneNumber: '+91 11 2659 7000',
    createdAt: '2026-01-12T10:00:00Z',
    updatedAt: '2026-01-12T10:00:00Z',
  },
  {
    id: 'usr_admin_1',
    uid: 'demo_admin_uid',
    email: 'admin@edushield.demo',
    displayName: 'Priya Nambiar (System Administrator)',
    role: 'admin',
    phoneNumber: '+91 98888 77777',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  }
];

export const SEED_STUDENTS: Student[] = [
  {
    id: 'stud_aarav_1',
    guardianId: 'usr_guardian_1',
    guardianName: 'Rajesh Sharma',
    fullName: 'Aarav Sharma',
    dateOfBirth: '2005-04-12',
    gender: 'MALE',
    universityId: 'univ_iitd',
    universityName: 'Indian Institute of Technology Delhi (IIT Delhi)',
    courseName: 'B.Tech in Computer Science & Engineering',
    degreeType: 'UNDERGRADUATE',
    currentAcademicYear: 2,
    totalCourseDurationYears: 4,
    studentIdNumber: '2023CS10482',
    annualTuitionFee: 220000,
    otherEligibleExpenses: 80000,
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'stud_ananya_2',
    guardianId: 'usr_guardian_1',
    guardianName: 'Rajesh Sharma',
    fullName: 'Ananya Sharma',
    dateOfBirth: '2007-09-20',
    gender: 'FEMALE',
    universityId: 'univ_bits',
    universityName: 'BITS Pilani - Hyderabad Campus',
    courseName: 'B.E. in Electronics & Communication',
    degreeType: 'UNDERGRADUATE',
    currentAcademicYear: 1,
    totalCourseDurationYears: 4,
    studentIdNumber: '2024A7PS0192H',
    annualTuitionFee: 495000,
    otherEligibleExpenses: 110000,
    createdAt: '2026-02-01T11:00:00Z',
    updatedAt: '2026-02-01T11:00:00Z',
  }
];

export const SEED_POLICIES: EducationPolicy[] = [
  {
    id: 'pol_active_aarav',
    policyNumber: 'EDU-2026-881924',
    quoteId: 'qte_init_1',
    guardianId: 'usr_guardian_1',
    guardianName: 'Rajesh Sharma',
    guardianEmail: 'guardian@edushield.demo',
    studentId: 'stud_aarav_1',
    studentName: 'Aarav Sharma',
    universityId: 'univ_iitd',
    universityName: 'Indian Institute of Technology Delhi (IIT Delhi)',
    planId: 'plan_comprehensive',
    planName: 'EduShield Comprehensive',
    coverageAmount: 1200000,
    totalAnnualPremium: 32900,
    effectiveDate: '2026-01-20T00:00:00Z',
    expiryDate: '2027-01-19T23:59:59Z',
    renewalDueDate: '2026-12-20T00:00:00Z',
    waitingPeriodDays: 15,
    waitingPeriodEndsAt: '2026-02-04T00:00:00Z',
    status: 'ACTIVE',
    benefits: [
      {
        benefitCode: 'TUIT-COV',
        name: 'Direct College Tuition Fee Cover',
        description: 'Covers annual semester tuition fees paid directly to IIT Delhi.',
        coverageLimit: 900000,
        deductible: 0
      },
      {
        benefitCode: 'HOSTEL-COV',
        name: 'Hostel & Campus Mess Allowance',
        description: 'Living and boarding stipend disbursed upon semester verification.',
        coverageLimit: 300000,
        deductible: 5000
      }
    ],
    exclusions: [
      'Pre-existing conditions diagnosed prior to inception',
      'Voluntary withdrawal or drop out',
      'Termination due to academic misconduct'
    ],
    paymentReference: 'SIM-TXN-20260120-8849',
    createdAt: '2026-01-20T00:00:00Z',
    updatedAt: '2026-01-20T00:00:00Z'
  }
];

export const SEED_CLAIMS: EducationClaim[] = [
  {
    id: 'clm_active_1',
    claimNumber: 'CLM-2026-402911',
    policyId: 'pol_active_aarav',
    policyNumber: 'EDU-2026-881924',
    guardianId: 'usr_guardian_1',
    guardianName: 'Rajesh Sharma',
    studentId: 'stud_aarav_1',
    studentName: 'Aarav Sharma',
    universityId: 'univ_iitd',
    universityName: 'Indian Institute of Technology Delhi (IIT Delhi)',
    claimType: 'CRITICAL_ILLNESS',
    incidentDate: '2026-03-10T00:00:00Z',
    description: 'Primary earning guardian suffered severe cardiac emergency requiring emergency bypass surgery and prolonged critical care hospitalization, rendering inability to meet upcoming semester college tuition deadlines.',
    requestedAmount: 220000,
    eligibleAmount: 220000,
    approvedAmount: 220000,
    status: 'UNDER_REVIEW',
    readinessScore: 83,
    readinessChecklist: [
      { item: 'Policy Active at time of incident', isCompleted: true, reason: 'Policy valid until Jan 2027' },
      { item: 'Policy waiting period elapsed', isCompleted: true, reason: 'Incident date Mar 10 > Feb 4' },
      { item: 'Government Identity Proof of Guardian & Student', isCompleted: true, reason: 'Aadhaar Card uploaded' },
      { item: 'Hospital Discharge Summary & Specialist Medical Reports', isCompleted: true, reason: 'Max Hospital Cardiology report attached' },
      { item: 'Official University Fee Demand Notice / Ledger Statement', isCompleted: true, reason: 'IIT Delhi Spring 2026 Fee challan attached' },
      { item: 'University Registrar Enrollment & Fee Balance Verification', isCompleted: false, reason: 'Pending IIT Delhi Registrar verification' }
    ],
    aiPreliminaryAssessment: {
      summary: 'Grounded Assessment: Incident occurred well after 15-day waiting period. Medical discharge summary confirms covered acute cardiac emergency. Requested amount matches Spring Semester fee voucher exactly.',
      flaggedRisks: ['No duplicate claim detected for semester 2026-Spring'],
      missingItems: ['Institutional registrar fee verification still pending from IIT Delhi portal'],
      suggestedNextSteps: [
        'University officer to verify outstanding fees against student roll no 2023CS10482',
        'Senior claims adjuster Vikram Mehta to finalize approval upon ledger confirmation'
      ],
      generatedAt: '2026-03-12T14:30:00Z'
    },
    documents: [
      {
        id: 'doc_1',
        claimId: 'clm_active_1',
        documentType: 'IDENTITY_PROOF',
        fileName: 'Aadhaar_Guardian_Rajesh_Sharma.pdf',
        fileSize: 420000,
        fileUrl: '#',
        uploadedAt: '2026-03-11T10:00:00Z',
        verifiedByOfficer: true,
        aiVerificationNotes: 'Name matches policyholder Rajesh Sharma. Valid UIDAI document.'
      },
      {
        id: 'doc_2',
        claimId: 'clm_active_1',
        documentType: 'MEDICAL_REPORT',
        fileName: 'Max_Healthcare_Cardiac_Discharge_Summary.pdf',
        fileSize: 1850000,
        fileUrl: '#',
        uploadedAt: '2026-03-11T10:05:00Z',
        verifiedByOfficer: true,
        aiVerificationNotes: 'Emergency coronary artery bypass grafting (CABG). Matches critical illness rider criteria.'
      },
      {
        id: 'doc_3',
        claimId: 'clm_active_1',
        documentType: 'FEE_DEMAND_STATEMENT',
        fileName: 'IIT_Delhi_Semester_4_Fee_Challan.pdf',
        fileSize: 310000,
        fileUrl: '#',
        uploadedAt: '2026-03-11T10:10:00Z',
        verifiedByOfficer: false,
        aiVerificationNotes: 'Fee challan for 2023CS10482: Total ₹2,20,000 due by 30th March 2026.'
      }
    ],
    reviews: [],
    createdAt: '2026-03-11T10:15:00Z',
    updatedAt: '2026-03-12T14:30:00Z'
  }
];

export const SEED_AUDITS: AuditLog[] = [
  {
    id: 'aud_1',
    action: 'POLICY_ISSUED',
    entityType: 'POLICY',
    entityId: 'pol_active_aarav',
    performedByUserId: 'usr_guardian_1',
    performedByUserName: 'Rajesh Sharma',
    performedByUserRole: 'guardian',
    details: 'Policy EDU-2026-881924 bound successfully after simulated netbanking premium receipt of ₹32,900.',
    timestamp: '2026-01-20T00:00:00Z'
  },
  {
    id: 'aud_2',
    action: 'CLAIM_SUBMITTED',
    entityType: 'CLAIM',
    entityId: 'clm_active_1',
    performedByUserId: 'usr_guardian_1',
    performedByUserName: 'Rajesh Sharma',
    performedByUserRole: 'guardian',
    details: 'Claim CLM-2026-402911 filed for Critical Illness covering ₹2,20,000 college tuition.',
    timestamp: '2026-03-11T10:15:00Z'
  },
  {
    id: 'aud_3',
    action: 'AI_ASSESSMENT_TRIAGE',
    entityType: 'CLAIM',
    entityId: 'clm_active_1',
    performedByUserId: 'system_ai',
    performedByUserName: 'EduShield AI Engine',
    performedByUserRole: 'admin',
    details: 'AI Readiness Analysis scored 83%. Documents summarized and verified against policy terms.',
    timestamp: '2026-03-12T14:30:00Z'
  }
];

export const SEED_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    userId: 'usr_guardian_1',
    title: 'Claim Under Review',
    message: 'Your claim CLM-2026-402911 for Aarav Sharma is undergoing university verification with IIT Delhi.',
    type: 'INFO',
    read: false,
    linkUrl: '/claims/clm_active_1',
    createdAt: '2026-03-12T14:35:00Z'
  },
  {
    id: 'notif_2',
    userId: 'usr_officer_1',
    title: 'New Claim Awaiting Adjudication',
    message: 'Claim CLM-2026-402911 (Aarav Sharma - IIT Delhi) readiness score 83%. Ready for review.',
    type: 'WARNING',
    read: false,
    linkUrl: '/claims/clm_active_1/review',
    createdAt: '2026-03-12T14:31:00Z'
  },
  {
    id: 'notif_3',
    userId: 'usr_univ_rep_1',
    title: 'Fee Verification Requested',
    message: 'Please verify tuition ledger for student Aarav Sharma (Roll No: 2023CS10482).',
    type: 'INFO',
    read: false,
    linkUrl: '/university/verification',
    createdAt: '2026-03-12T14:32:00Z'
  }
];
