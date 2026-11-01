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
  },
  {
    id: 'univ_reva',
    name: 'REVA University, Bengaluru',
    code: 'REVA-BLR',
    city: 'Bengaluru',
    state: 'Karnataka',
    accreditationGrade: 'NAAC A+ / UGC Recognized',
    contactEmail: 'registrar@reva.edu.in',
    contactPhone: '+91 80 4696 6966',
    bankDetails: {
      accountName: 'REVA University Fee Collection Account',
      accountNumberMasked: '•••• •••• •••• 7820',
      ifscCode: 'HDFC0000053',
      bankName: 'HDFC Bank'
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
  // Dedicated University Registrar Accounts
  {
    id: 'usr_univ_rep_1',
    uid: 'demo_univ_iitd_uid',
    email: 'registrar.iitd@edushield.demo',
    displayName: 'Dr. Sunita Deshmukh (IIT Delhi Registrar)',
    role: 'university',
    universityId: 'univ_iitd',
    phoneNumber: '+91 11 2659 7000',
    createdAt: '2026-01-12T10:00:00Z',
    updatedAt: '2026-01-12T10:00:00Z',
  },
  {
    id: 'usr_univ_rep_legacy',
    uid: 'demo_univ_legacy_uid',
    email: 'university@edushield.demo',
    displayName: 'Dr. Sunita Deshmukh (IIT Delhi Registrar)',
    role: 'university',
    universityId: 'univ_iitd',
    phoneNumber: '+91 11 2659 7000',
    createdAt: '2026-01-12T10:00:00Z',
    updatedAt: '2026-01-12T10:00:00Z',
  },
  {
    id: 'usr_univ_rep_2',
    uid: 'demo_univ_bits_uid',
    email: 'registrar.bits@edushield.demo',
    displayName: 'Prof. Chandrashekhar Rao (BITS Hyderabad Registrar)',
    role: 'university',
    universityId: 'univ_bits',
    phoneNumber: '+91 40 6630 3999',
    createdAt: '2026-01-12T10:00:00Z',
    updatedAt: '2026-01-12T10:00:00Z',
  },
  {
    id: 'usr_univ_rep_3',
    uid: 'demo_univ_nitt_uid',
    email: 'registrar.nitt@edushield.demo',
    displayName: 'Dr. K. Balasubramanian (NIT Trichy Registrar)',
    role: 'university',
    universityId: 'univ_nitt',
    phoneNumber: '+91 431 2503000',
    createdAt: '2026-01-12T10:00:00Z',
    updatedAt: '2026-01-12T10:00:00Z',
  },
  {
    id: 'usr_univ_rep_4',
    uid: 'demo_univ_du_uid',
    email: 'registrar.du@edushield.demo',
    displayName: 'Dr. Vikas Gupta (University of Delhi Registrar)',
    role: 'university',
    universityId: 'univ_du',
    phoneNumber: '+91 11 2766 7011',
    createdAt: '2026-01-12T10:00:00Z',
    updatedAt: '2026-01-12T10:00:00Z',
  },
  {
    id: 'usr_univ_rep_5',
    uid: 'demo_univ_reva_uid',
    email: 'registrar.reva@edushield.demo',
    displayName: 'Dr. N. Ramesh (REVA University Registrar)',
    role: 'university',
    universityId: 'univ_reva',
    phoneNumber: '+91 80 4696 6966',
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
  },
  {
    id: 'stud_rohit_3',
    guardianId: 'usr_guardian_1',
    guardianName: 'Rajesh Sharma',
    fullName: 'Rohit Nambiar',
    dateOfBirth: '2006-03-14',
    gender: 'MALE',
    universityId: 'univ_nitt',
    universityName: 'National Institute of Technology Tiruchirappalli (NIT Trichy)',
    courseName: 'B.Tech in Mechanical Engineering',
    degreeType: 'UNDERGRADUATE',
    currentAcademicYear: 2,
    totalCourseDurationYears: 4,
    studentIdNumber: '111123048',
    annualTuitionFee: 175000,
    otherEligibleExpenses: 50000,
    createdAt: '2026-02-10T10:00:00Z',
    updatedAt: '2026-02-10T10:00:00Z',
  },
  {
    id: 'stud_priya_4',
    guardianId: 'usr_guardian_1',
    guardianName: 'Rajesh Sharma',
    fullName: 'Priya Verma',
    dateOfBirth: '2006-08-25',
    gender: 'FEMALE',
    universityId: 'univ_du',
    universityName: 'University of Delhi (Cluster Innovation Centre / Faculty of Tech)',
    courseName: 'B.Tech in Information Technology & Mathematical Innovations',
    degreeType: 'UNDERGRADUATE',
    currentAcademicYear: 1,
    totalCourseDurationYears: 4,
    studentIdNumber: '24DUIT1029',
    annualTuitionFee: 110000,
    otherEligibleExpenses: 40000,
    createdAt: '2026-02-15T10:00:00Z',
    updatedAt: '2026-02-15T10:00:00Z',
  },
  {
    id: 'stud_kavya_5',
    guardianId: 'usr_guardian_1',
    guardianName: 'Rajesh Sharma',
    fullName: 'Kavya Gowda',
    dateOfBirth: '2006-11-05',
    gender: 'FEMALE',
    universityId: 'univ_reva',
    universityName: 'REVA University, Bengaluru',
    courseName: 'B.Tech in Robotics & Artificial Intelligence',
    degreeType: 'UNDERGRADUATE',
    currentAcademicYear: 1,
    totalCourseDurationYears: 4,
    studentIdNumber: 'R24AI084',
    annualTuitionFee: 185000,
    otherEligibleExpenses: 65000,
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-02-20T10:00:00Z',
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
  },
  {
    id: 'pol_active_ananya',
    policyNumber: 'EDU-2026-902144',
    quoteId: 'qte_bits_1',
    guardianId: 'usr_guardian_1',
    guardianName: 'Rajesh Sharma',
    guardianEmail: 'guardian@edushield.demo',
    studentId: 'stud_ananya_2',
    studentName: 'Ananya Sharma',
    universityId: 'univ_bits',
    universityName: 'BITS Pilani - Hyderabad Campus',
    planId: 'plan_comprehensive',
    planName: 'EduShield Comprehensive',
    coverageAmount: 2420000,
    totalAnnualPremium: 68500,
    effectiveDate: '2026-02-05T00:00:00Z',
    expiryDate: '2027-02-04T23:59:59Z',
    renewalDueDate: '2027-01-05T00:00:00Z',
    waitingPeriodDays: 15,
    waitingPeriodEndsAt: '2026-02-20T00:00:00Z',
    status: 'ACTIVE',
    benefits: [
      {
        benefitCode: 'TUIT-COV',
        name: 'BITS Semester Tuition Fee Escrow',
        description: 'Semester tuition fees covered directly to BITS Pilani Hyderabad fee escrow.',
        coverageLimit: 1980000,
        deductible: 0
      },
      {
        benefitCode: 'HOSTEL-COV',
        name: 'Campus Hostel & Mess Shield',
        description: 'Hostel and campus living subsidy.',
        coverageLimit: 440000,
        deductible: 5000
      }
    ],
    exclusions: ['Elective non-emergency medical treatments', 'Disciplinary suspension'],
    paymentReference: 'SIM-TXN-20260205-1942',
    createdAt: '2026-02-05T00:00:00Z',
    updatedAt: '2026-02-05T00:00:00Z'
  },
  {
    id: 'pol_active_rohit',
    policyNumber: 'EDU-2026-663102',
    quoteId: 'qte_nitt_1',
    guardianId: 'usr_guardian_1',
    guardianName: 'Rajesh Sharma',
    guardianEmail: 'guardian@edushield.demo',
    studentId: 'stud_rohit_3',
    studentName: 'Rohit Nambiar',
    universityId: 'univ_nitt',
    universityName: 'National Institute of Technology Tiruchirappalli (NIT Trichy)',
    planId: 'plan_foundation',
    planName: 'EduShield Foundation',
    coverageAmount: 900000,
    totalAnnualPremium: 23400,
    effectiveDate: '2026-02-12T00:00:00Z',
    expiryDate: '2027-02-11T23:59:59Z',
    renewalDueDate: '2027-01-12T00:00:00Z',
    waitingPeriodDays: 30,
    waitingPeriodEndsAt: '2026-03-14T00:00:00Z',
    status: 'ACTIVE',
    benefits: [
      {
        benefitCode: 'TUIT-COV',
        name: 'NIT Trichy Tuition Cover',
        description: 'Direct institute fee disbursement.',
        coverageLimit: 700000,
        deductible: 0
      }
    ],
    exclusions: ['Misconduct termination'],
    paymentReference: 'SIM-TXN-20260212-7712',
    createdAt: '2026-02-12T00:00:00Z',
    updatedAt: '2026-02-12T00:00:00Z'
  },
  {
    id: 'pol_active_priya',
    policyNumber: 'EDU-2026-551093',
    quoteId: 'qte_du_1',
    guardianId: 'usr_guardian_1',
    guardianName: 'Rajesh Sharma',
    guardianEmail: 'guardian@edushield.demo',
    studentId: 'stud_priya_4',
    studentName: 'Priya Verma',
    universityId: 'univ_du',
    universityName: 'University of Delhi (Cluster Innovation Centre / Faculty of Tech)',
    planId: 'plan_comprehensive',
    planName: 'EduShield Comprehensive',
    coverageAmount: 600000,
    totalAnnualPremium: 17200,
    effectiveDate: '2026-02-16T00:00:00Z',
    expiryDate: '2027-02-15T23:59:59Z',
    renewalDueDate: '2027-01-16T00:00:00Z',
    waitingPeriodDays: 15,
    waitingPeriodEndsAt: '2026-03-03T00:00:00Z',
    status: 'ACTIVE',
    benefits: [
      {
        benefitCode: 'TUIT-COV',
        name: 'DU Semester Tuition Cover',
        description: 'Direct disbursement to DU fee account.',
        coverageLimit: 450000,
        deductible: 0
      }
    ],
    exclusions: ['Voluntary withdrawal'],
    paymentReference: 'SIM-TXN-20260216-3391',
    createdAt: '2026-02-16T00:00:00Z',
    updatedAt: '2026-02-16T00:00:00Z'
  },
  {
    id: 'pol_active_kavya',
    policyNumber: 'EDU-2026-331822',
    quoteId: 'qte_reva_1',
    guardianId: 'usr_guardian_1',
    guardianName: 'Rajesh Sharma',
    guardianEmail: 'guardian@edushield.demo',
    studentId: 'stud_kavya_5',
    studentName: 'Kavya Gowda',
    universityId: 'univ_reva',
    universityName: 'REVA University, Bengaluru',
    planId: 'plan_comprehensive',
    planName: 'EduShield Comprehensive',
    coverageAmount: 1000000,
    totalAnnualPremium: 28600,
    effectiveDate: '2026-02-22T00:00:00Z',
    expiryDate: '2027-02-21T23:59:59Z',
    renewalDueDate: '2027-01-22T00:00:00Z',
    waitingPeriodDays: 15,
    waitingPeriodEndsAt: '2026-03-09T00:00:00Z',
    status: 'ACTIVE',
    benefits: [
      {
        benefitCode: 'TUIT-COV',
        name: 'REVA University Tuition Cover',
        description: 'Direct tuition fee disbursement to REVA University fee escrow account.',
        coverageLimit: 800000,
        deductible: 0
      }
    ],
    exclusions: ['Voluntary withdrawal', 'Academic misconduct'],
    paymentReference: 'SIM-TXN-20260222-4410',
    createdAt: '2026-02-22T00:00:00Z',
    updatedAt: '2026-02-22T00:00:00Z'
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
    approvedAmount: 0,
    status: 'UNDER_REVIEW',
    readinessScore: 83,
    universityVerification: {
      id: 'uv_iitd_1',
      claimId: 'clm_active_1',
      universityId: 'univ_iitd',
      universityName: 'Indian Institute of Technology Delhi (IIT Delhi)',
      studentName: 'Aarav Sharma',
      studentRollNo: '2023CS10482',
      confirmedAnnualTuition: 220000,
      confirmedOutstandingFee: 220000,
      enrollmentStatusVerified: false,
      status: 'PENDING'
    },
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
  },
  {
    id: 'clm_active_bits',
    claimNumber: 'CLM-2026-883201',
    policyId: 'pol_active_ananya',
    policyNumber: 'EDU-2026-902144',
    guardianId: 'usr_guardian_1',
    guardianName: 'Rajesh Sharma',
    studentId: 'stud_ananya_2',
    studentName: 'Ananya Sharma',
    universityId: 'univ_bits',
    universityName: 'BITS Pilani - Hyderabad Campus',
    claimType: 'CRITICAL_ILLNESS',
    incidentDate: '2026-03-15T00:00:00Z',
    description: 'Parent hospitalized for neurological intervention following sudden health crisis. Urgent tuition continuity required for upcoming semester examination dues.',
    requestedAmount: 247500,
    eligibleAmount: 247500,
    approvedAmount: 0,
    status: 'UNDER_REVIEW',
    readinessScore: 80,
    universityVerification: {
      id: 'uv_bits_1',
      claimId: 'clm_active_bits',
      universityId: 'univ_bits',
      universityName: 'BITS Pilani - Hyderabad Campus',
      studentName: 'Ananya Sharma',
      studentRollNo: '2024A7PS0192H',
      confirmedAnnualTuition: 495000,
      confirmedOutstandingFee: 247500,
      enrollmentStatusVerified: false,
      status: 'PENDING'
    },
    readinessChecklist: [
      { item: 'Policy Active at time of incident', isCompleted: true, reason: 'Policy valid until Feb 2027' },
      { item: 'Policy waiting period elapsed', isCompleted: true, reason: 'Incident Mar 15 > Feb 20' },
      { item: 'Government Identity Proof of Guardian & Student', isCompleted: true, reason: 'Aadhaar Card uploaded' },
      { item: 'Hospital Discharge Summary & Specialist Medical Reports', isCompleted: true, reason: 'Apollo Hospital report uploaded' },
      { item: 'Official University Fee Demand Notice / Ledger Statement', isCompleted: true, reason: 'BITS Semester Fee Challan uploaded' },
      { item: 'University Registrar Enrollment & Fee Balance Verification', isCompleted: false, reason: 'Pending BITS Pilani Registrar verification' }
    ],
    aiPreliminaryAssessment: {
      summary: 'BITS Pilani Critical Illness Claim: Waiting period satisfied. Medical records confirm covered emergency. Requires BITS registrar ledger audit.',
      flaggedRisks: [],
      missingItems: ['Institutional fee ledger verification from BITS Pilani Hyderabad Registrar required'],
      suggestedNextSteps: [
        'BITS registrar to inspect fee dues for student 2024A7PS0192H',
        'Claims adjuster to complete review upon institutional sign-off'
      ],
      generatedAt: '2026-03-16T10:00:00Z'
    },
    documents: [
      {
        id: 'doc_bits_1',
        claimId: 'clm_active_bits',
        documentType: 'IDENTITY_PROOF',
        fileName: 'Guardian_Identity_Proof.pdf',
        fileSize: 380000,
        fileUrl: '#',
        uploadedAt: '2026-03-15T12:00:00Z',
        verifiedByOfficer: true
      },
      {
        id: 'doc_bits_2',
        claimId: 'clm_active_bits',
        documentType: 'MEDICAL_REPORT',
        fileName: 'Apollo_Neurology_Summary.pdf',
        fileSize: 1450000,
        fileUrl: '#',
        uploadedAt: '2026-03-15T12:05:00Z',
        verifiedByOfficer: true
      },
      {
        id: 'doc_bits_3',
        claimId: 'clm_active_bits',
        documentType: 'FEE_DEMAND_STATEMENT',
        fileName: 'BITS_Pilani_Semester_Fee_Demand.pdf',
        fileSize: 290000,
        fileUrl: '#',
        uploadedAt: '2026-03-15T12:10:00Z',
        verifiedByOfficer: false
      }
    ],
    reviews: [],
    createdAt: '2026-03-15T12:15:00Z',
    updatedAt: '2026-03-16T10:00:00Z'
  },
  {
    id: 'clm_active_nitt',
    claimNumber: 'CLM-2026-772910',
    policyId: 'pol_active_rohit',
    policyNumber: 'EDU-2026-663102',
    guardianId: 'usr_guardian_1',
    guardianName: 'Rajesh Sharma',
    studentId: 'stud_rohit_3',
    studentName: 'Rohit Nambiar',
    universityId: 'univ_nitt',
    universityName: 'National Institute of Technology Tiruchirappalli (NIT Trichy)',
    claimType: 'PARENT_DISABILITY',
    incidentDate: '2026-03-20T00:00:00Z',
    description: 'Parent suffered severe workplace accident leading to motor disability certified by District Medical Board. Semester tuition assistance needed for NIT Trichy.',
    requestedAmount: 125000,
    eligibleAmount: 125000,
    approvedAmount: 0,
    status: 'UNDER_REVIEW',
    readinessScore: 80,
    universityVerification: {
      id: 'uv_nitt_1',
      claimId: 'clm_active_nitt',
      universityId: 'univ_nitt',
      universityName: 'National Institute of Technology Tiruchirappalli (NIT Trichy)',
      studentName: 'Rohit Nambiar',
      studentRollNo: '111123048',
      confirmedAnnualTuition: 175000,
      confirmedOutstandingFee: 125000,
      enrollmentStatusVerified: false,
      status: 'PENDING'
    },
    readinessChecklist: [
      { item: 'Policy Active at time of incident', isCompleted: true, reason: 'Policy valid until Feb 2027' },
      { item: 'Policy waiting period elapsed', isCompleted: true, reason: 'Incident Mar 20 > Mar 14' },
      { item: 'Government Identity Proof of Guardian & Student', isCompleted: true, reason: 'Aadhaar uploaded' },
      { item: 'Government Medical Board Disability Certificate (>50%)', isCompleted: true, reason: 'Disability certificate attached' },
      { item: 'Official University Fee Demand Notice / Ledger Statement', isCompleted: true, reason: 'NIT Trichy Semester Fee Voucher attached' },
      { item: 'University Registrar Enrollment & Fee Balance Verification', isCompleted: false, reason: 'Pending NIT Trichy Registrar verification' }
    ],
    documents: [
      {
        id: 'doc_nitt_1',
        claimId: 'clm_active_nitt',
        documentType: 'IDENTITY_PROOF',
        fileName: 'Aadhaar_Document.pdf',
        fileSize: 410000,
        fileUrl: '#',
        uploadedAt: '2026-03-21T09:00:00Z',
        verifiedByOfficer: true
      },
      {
        id: 'doc_nitt_2',
        claimId: 'clm_active_nitt',
        documentType: 'DISABILITY_CERTIFICATE',
        fileName: 'Medical_Board_Disability_Certificate.pdf',
        fileSize: 850000,
        fileUrl: '#',
        uploadedAt: '2026-03-21T09:05:00Z',
        verifiedByOfficer: true
      },
      {
        id: 'doc_nitt_3',
        claimId: 'clm_active_nitt',
        documentType: 'FEE_DEMAND_STATEMENT',
        fileName: 'NIT_Trichy_Tuition_Voucher.pdf',
        fileSize: 210000,
        fileUrl: '#',
        uploadedAt: '2026-03-21T09:10:00Z',
        verifiedByOfficer: false
      }
    ],
    reviews: [],
    createdAt: '2026-03-21T09:15:00Z',
    updatedAt: '2026-03-21T09:15:00Z'
  },
  {
    id: 'clm_active_du',
    claimNumber: 'CLM-2026-551209',
    policyId: 'pol_active_priya',
    policyNumber: 'EDU-2026-551093',
    guardianId: 'usr_guardian_1',
    guardianName: 'Rajesh Sharma',
    studentId: 'stud_priya_4',
    studentName: 'Priya Verma',
    universityId: 'univ_du',
    universityName: 'University of Delhi (Cluster Innovation Centre / Faculty of Tech)',
    claimType: 'CRITICAL_ILLNESS',
    incidentDate: '2026-03-18T00:00:00Z',
    description: 'Breadwinner guardian diagnosed with pulmonary distress necessitating intensive hospital therapy and inability to disburse semester tuition for University of Delhi.',
    requestedAmount: 110000,
    eligibleAmount: 110000,
    approvedAmount: 0,
    status: 'UNDER_REVIEW',
    readinessScore: 80,
    universityVerification: {
      id: 'uv_du_1',
      claimId: 'clm_active_du',
      universityId: 'univ_du',
      universityName: 'University of Delhi (Cluster Innovation Centre / Faculty of Tech)',
      studentName: 'Priya Verma',
      studentRollNo: '24DUIT1029',
      confirmedAnnualTuition: 110000,
      confirmedOutstandingFee: 110000,
      enrollmentStatusVerified: false,
      status: 'PENDING'
    },
    readinessChecklist: [
      { item: 'Policy Active at time of incident', isCompleted: true, reason: 'Policy valid until Feb 2027' },
      { item: 'Policy waiting period elapsed', isCompleted: true, reason: 'Incident Mar 18 > Mar 3' },
      { item: 'Government Identity Proof of Guardian & Student', isCompleted: true, reason: 'ID uploaded' },
      { item: 'Hospital Discharge Summary & Specialist Medical Reports', isCompleted: true, reason: 'Pulmonology report attached' },
      { item: 'Official University Fee Demand Notice / Ledger Statement', isCompleted: true, reason: 'DU Fee Challan attached' },
      { item: 'University Registrar Enrollment & Fee Balance Verification', isCompleted: false, reason: 'Pending DU Registrar verification' }
    ],
    documents: [
      {
        id: 'doc_du_1',
        claimId: 'clm_active_du',
        documentType: 'IDENTITY_PROOF',
        fileName: 'Aadhaar_Document.pdf',
        fileSize: 390000,
        fileUrl: '#',
        uploadedAt: '2026-03-19T11:00:00Z',
        verifiedByOfficer: true
      },
      {
        id: 'doc_du_2',
        claimId: 'clm_active_du',
        documentType: 'MEDICAL_REPORT',
        fileName: 'Fortis_Pulmonology_Discharge.pdf',
        fileSize: 1300000,
        fileUrl: '#',
        uploadedAt: '2026-03-19T11:05:00Z',
        verifiedByOfficer: true
      },
      {
        id: 'doc_du_3',
        claimId: 'clm_active_du',
        documentType: 'FEE_DEMAND_STATEMENT',
        fileName: 'DU_CIC_Fee_Receipt_Dues.pdf',
        fileSize: 220000,
        fileUrl: '#',
        uploadedAt: '2026-03-19T11:10:00Z',
        verifiedByOfficer: false
      }
    ],
    reviews: [],
    createdAt: '2026-03-19T11:15:00Z',
    updatedAt: '2026-03-19T11:15:00Z'
  },
  {
    id: 'clm_active_reva',
    claimNumber: 'CLM-2026-339014',
    policyId: 'pol_active_kavya',
    policyNumber: 'EDU-2026-331822',
    guardianId: 'usr_guardian_1',
    guardianName: 'Rajesh Sharma',
    studentId: 'stud_kavya_5',
    studentName: 'Kavya Gowda',
    universityId: 'univ_reva',
    universityName: 'REVA University, Bengaluru',
    claimType: 'CRITICAL_ILLNESS',
    incidentDate: '2026-03-22T00:00:00Z',
    description: 'Single earning parent hospitalized for urgent surgery. Support required for REVA University engineering semester fee installment.',
    requestedAmount: 185000,
    eligibleAmount: 185000,
    approvedAmount: 0,
    status: 'UNDER_REVIEW',
    readinessScore: 80,
    universityVerification: {
      id: 'uv_reva_1',
      claimId: 'clm_active_reva',
      universityId: 'univ_reva',
      universityName: 'REVA University, Bengaluru',
      studentName: 'Kavya Gowda',
      studentRollNo: 'R24AI084',
      confirmedAnnualTuition: 185000,
      confirmedOutstandingFee: 185000,
      enrollmentStatusVerified: false,
      status: 'PENDING'
    },
    readinessChecklist: [
      { item: 'Policy Active at time of incident', isCompleted: true, reason: 'Policy valid until Feb 2027' },
      { item: 'Policy waiting period elapsed', isCompleted: true, reason: 'Incident Mar 22 > Mar 9' },
      { item: 'Government Identity Proof of Guardian & Student', isCompleted: true, reason: 'Aadhaar uploaded' },
      { item: 'Hospital Discharge Summary & Specialist Medical Reports', isCompleted: true, reason: 'Manipal Hospital report attached' },
      { item: 'Official University Fee Demand Notice / Ledger Statement', isCompleted: true, reason: 'REVA Fee Challan attached' },
      { item: 'University Registrar Enrollment & Fee Balance Verification', isCompleted: false, reason: 'Pending REVA University Registrar verification' }
    ],
    documents: [
      {
        id: 'doc_reva_1',
        claimId: 'clm_active_reva',
        documentType: 'IDENTITY_PROOF',
        fileName: 'Aadhaar_Document.pdf',
        fileSize: 370000,
        fileUrl: '#',
        uploadedAt: '2026-03-23T14:00:00Z',
        verifiedByOfficer: true
      },
      {
        id: 'doc_reva_2',
        claimId: 'clm_active_reva',
        documentType: 'MEDICAL_REPORT',
        fileName: 'Manipal_Hospital_Discharge.pdf',
        fileSize: 1100000,
        fileUrl: '#',
        uploadedAt: '2026-03-23T14:05:00Z',
        verifiedByOfficer: true
      },
      {
        id: 'doc_reva_3',
        claimId: 'clm_active_reva',
        documentType: 'FEE_DEMAND_STATEMENT',
        fileName: 'REVA_University_Semester_Tuition_Challan.pdf',
        fileSize: 340000,
        fileUrl: '#',
        uploadedAt: '2026-03-23T14:10:00Z',
        verifiedByOfficer: false
      }
    ],
    reviews: [],
    createdAt: '2026-03-23T14:15:00Z',
    updatedAt: '2026-03-23T14:15:00Z'
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
