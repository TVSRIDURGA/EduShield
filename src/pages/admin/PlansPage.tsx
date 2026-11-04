import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  PlusCircle, 
  Edit3, 
  Copy, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  X,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ProductsRepo, PolicyVersionsRepo, UniversitiesRepo } from '../../repositories/firestoreRepo';
import { 
  InsuranceProduct, 
  PolicyVersion, 
  ProductStatus, 
  CoverageCategory,
  University,
  CoverageBenefitConfig,
  PolicyExclusionConfig
} from '../../models/insurance';
import { formatINR } from '../../utils/businessRules';
import { policyEngine } from '../../services/policyEngine';

export const PlansPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<InsuranceProduct[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modal / Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [versionModalProduct, setVersionModalProduct] = useState<InsuranceProduct | null>(null);
  const [versionsList, setVersionsList] = useState<PolicyVersion[]>([]);

  // Form State for Structured Product Configuration
  const [formData, setFormData] = useState<Partial<InsuranceProduct>>({
    name: '',
    code: '',
    tier: 'COMPREHENSIVE',
    category: 'COMPREHENSIVE',
    shortDescription: '',
    detailedDescription: '',
    policyPurpose: '',
    targetCustomerSegment: '',
    eligibleStudentCategories: ['Regular Full-Time'],
    applicableInstitutions: ['ALL'],
    applicableAcademicProgrammes: ['B.Tech / B.E.', 'M.Tech / M.E.'],
    applicableAdmissionCategories: ['Merit Entrance', 'Direct Admission'],
    policyDurationYearsOptions: [1, 2, 3, 4],
    currentVersion: '1.0.0',
    status: 'DRAFT',
    effectiveDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],

    eligibilityCriteria: {
      minAge: 16,
      maxAge: 26,
      allowedAdmissionStatuses: ['ADMITTED', 'CONFIRMED'],
      requireActiveEnrollment: true,
      allowedDegreeTypes: ['UNDERGRADUATE', 'POSTGRADUATE'],
      allowedCourseDurationsYears: [1, 2, 3, 4],
      allowedAcademicYears: [1, 2, 3, 4],
      eligibleInstitutionIds: [],
      allowedResidencies: ['RESIDENT_INDIAN'],
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
        institutionEligibility: 'MANDATORY'
      }
    },

    coverageBenefits: [
      {
        id: 'cov_tuit_1',
        category: 'PARENT_DEATH',
        name: 'Tuition Fee Protection on Parental Death',
        description: 'Disburses 100% of verified tuition fees directly to university registrar fee escrow.',
        benefitAmount: 2000000,
        maxBenefitAmount: 2000000,
        perEventLimit: 2000000,
        annualLimit: 500000,
        aggregateLimit: 2000000,
        waitingPeriodDays: 30,
        requiredClaimDocuments: ['DEATH_CERTIFICATE', 'IDENTITY_PROOF', 'FEE_DEMAND_STATEMENT'],
        geographicRestrictions: ['INDIA'],
        benefitRecipient: 'UNIVERSITY_DIRECT',
        isOptionalAddon: false,
        addonPremium: 0
      }
    ],

    exclusions: [
      {
        id: 'ex_1',
        title: 'Pre-existing Conditions (24 Months)',
        detailedExplanation: 'Conditions diagnosed within 24 months preceding policy inception are excluded.',
        applicableCategory: 'ALL',
        applicableConditions: 'Prior diagnosis recorded in medical history.',
        effectivePeriod: 'First 24 months'
      },
      {
        id: 'ex_2',
        title: 'Fraudulent Claims & Manipulated Documents',
        detailedExplanation: 'Falsified marks memos or forged hospital certificates void the policy immediately.',
        applicableCategory: 'ALL',
        applicableConditions: 'Verification mismatch.',
        effectivePeriod: 'Entire tenure'
      }
    ],

    financialLimits: {
      sumInsured: 2000000,
      maxCoverageLimit: 2000000,
      perEventLimit: 2000000,
      annualClaimLimit: 600000,
      aggregateClaimLimit: 2000000,
      deductibleAmount: 0,
      coPaymentPercent: 0,
      maxPayableBenefit: 2000000,
      minClaimAmount: 10000,
      sublimits: []
    },

    premiumConfig: {
      basePremium: 3000,
      baseRatePercent: 2.8,
      ageBands: [
        { minAge: 16, maxAge: 25, factor: 1.0 },
        { minAge: 26, maxAge: 32, factor: 1.1 }
      ],
      durationFactors: [
        { durationYears: 1, factor: 1.0, discountPercent: 0 },
        { durationYears: 2, factor: 0.98, discountPercent: 2 },
        { durationYears: 3, factor: 0.95, discountPercent: 5 },
        { durationYears: 4, factor: 0.90, discountPercent: 10 }
      ],
      taxRatePercent: 18,
      minPremium: 4000,
      maxPremium: 60000,
      availableFrequencies: ['ANNUAL', 'SEMESTER'],
      frequencyMultipliers: { ANNUAL: 1.0, SEMESTER: 0.52, QUARTERLY: 0.27 },
      discounts: []
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
      cancellationReasons: ['Voluntary withdrawal', 'Institution transfer']
    },

    termsAndConditions: {
      version: '1.0.0',
      effectiveDate: new Date().toISOString().split('T')[0],
      policyholderResponsibilities: [
        'Payment of premiums prior to grace period expiration.',
        'Immediate reporting of academic status changes within 14 days.'
      ],
      insuredStudentResponsibilities: [
        'Maintaining satisfactory academic passing grade.',
        'Refraining from disciplinary infractions.'
      ],
      disclosureObligations: 'Strict duty of utmost good faith (Section 45 Insurance Act).',
      waitingPeriodClauses: 'Standard 30-day waiting period on illness claims. Accidental mortality has zero waiting period.',
      claimNotificationPeriodDays: 14,
      claimSubmissionTimelineDays: 30,
      benefitLimitations: ['Disbursement routed strictly to verified university fee account.'],
      disputeResolutionProcess: 'Ombudsman mediation followed by institutional arbitration in New Delhi.',
      grievanceContact: {
        name: 'EduShield Grievance Directorate',
        designation: 'Principal Grievance Officer',
        email: 'grievance@edushield.demo',
        phone: '+91 11 2659 7135',
        address: 'Hauz Khas, New Delhi 110016'
      },
      applicableJurisdiction: 'High Court of Delhi, New Delhi, India'
    }
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const [allProds, allUnivs] = await Promise.all([
        ProductsRepo.getAll(),
        UniversitiesRepo.getAll()
      ]);
      setProducts(allProds);
      setUniversities(allUnivs);
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenNewWizard = () => {
    setEditingProductId(null);
    setActiveStep(1);
    setErrorMsg(null);
    setSuccessMsg(null);
    setFormData({
      name: '',
      code: `EDUSH-${Date.now().toString().slice(-4)}`,
      tier: 'COMPREHENSIVE',
      category: 'COMPREHENSIVE',
      shortDescription: '',
      detailedDescription: '',
      policyPurpose: '',
      targetCustomerSegment: '',
      eligibleStudentCategories: ['Regular Full-Time'],
      applicableInstitutions: ['ALL'],
      applicableAcademicProgrammes: ['B.Tech / B.E.', 'M.Tech / M.E.'],
      applicableAdmissionCategories: ['Merit Entrance', 'Direct Admission'],
      policyDurationYearsOptions: [1, 2, 3, 4],
      currentVersion: '1.0.0',
      status: 'DRAFT',
      effectiveDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      eligibilityCriteria: {
        minAge: 16,
        maxAge: 26,
        allowedAdmissionStatuses: ['ADMITTED', 'CONFIRMED'],
        requireActiveEnrollment: true,
        allowedDegreeTypes: ['UNDERGRADUATE', 'POSTGRADUATE'],
        allowedCourseDurationsYears: [1, 2, 3, 4],
        allowedAcademicYears: [1, 2, 3, 4],
        eligibleInstitutionIds: [],
        allowedResidencies: ['RESIDENT_INDIAN'],
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
          institutionEligibility: 'MANDATORY'
        }
      },
      coverageBenefits: [
        {
          id: 'cov_' + Date.now(),
          category: 'PARENT_DEATH',
          name: 'Tuition Fee Protection on Parental Death',
          description: 'Disburses 100% of verified tuition fees directly to university fee escrow.',
          benefitAmount: 2000000,
          maxBenefitAmount: 2000000,
          perEventLimit: 2000000,
          annualLimit: 500000,
          aggregateLimit: 2000000,
          waitingPeriodDays: 30,
          requiredClaimDocuments: ['DEATH_CERTIFICATE', 'IDENTITY_PROOF', 'FEE_DEMAND_STATEMENT'],
          geographicRestrictions: ['INDIA'],
          benefitRecipient: 'UNIVERSITY_DIRECT',
          isOptionalAddon: false,
          addonPremium: 0
        }
      ],
      exclusions: [
        {
          id: 'ex_1',
          title: 'Pre-existing Conditions (24 Months)',
          detailedExplanation: 'Conditions diagnosed within 24 months preceding policy inception are excluded.',
          applicableCategory: 'ALL',
          applicableConditions: 'Prior diagnosis recorded in medical history.',
          effectivePeriod: 'First 24 months'
        }
      ],
      financialLimits: {
        sumInsured: 2000000,
        maxCoverageLimit: 2000000,
        perEventLimit: 2000000,
        annualClaimLimit: 600000,
        aggregateClaimLimit: 2000000,
        deductibleAmount: 0,
        coPaymentPercent: 0,
        maxPayableBenefit: 2000000,
        minClaimAmount: 10000,
        sublimits: []
      },
      premiumConfig: {
        basePremium: 3000,
        baseRatePercent: 2.8,
        ageBands: [
          { minAge: 16, maxAge: 25, factor: 1.0 },
          { minAge: 26, maxAge: 32, factor: 1.1 }
        ],
        durationFactors: [
          { durationYears: 1, factor: 1.0, discountPercent: 0 },
          { durationYears: 2, factor: 0.98, discountPercent: 2 },
          { durationYears: 3, factor: 0.95, discountPercent: 5 },
          { durationYears: 4, factor: 0.90, discountPercent: 10 }
        ],
        taxRatePercent: 18,
        minPremium: 4000,
        maxPremium: 60000,
        availableFrequencies: ['ANNUAL', 'SEMESTER'],
        frequencyMultipliers: { ANNUAL: 1.0, SEMESTER: 0.52, QUARTERLY: 0.27 },
        discounts: []
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
        cancellationReasons: ['Voluntary withdrawal', 'Institution transfer']
      },
      termsAndConditions: {
        version: '1.0.0',
        effectiveDate: new Date().toISOString().split('T')[0],
        policyholderResponsibilities: ['Prompt payment of premiums.'],
        insuredStudentResponsibilities: ['Full time attendance.'],
        disclosureObligations: 'Utmost good faith disclosure.',
        waitingPeriodClauses: '30-day waiting period on illness claims.',
        claimNotificationPeriodDays: 14,
        claimSubmissionTimelineDays: 30,
        benefitLimitations: ['Disbursed to university escrow.'],
        disputeResolutionProcess: 'Ombudsman mediation.',
        grievanceContact: {
          name: 'EduShield Grievance Officer',
          designation: 'Principal Grievance Officer',
          email: 'grievance@edushield.demo',
          phone: '+91 11 2659 7135',
          address: 'Hauz Khas, New Delhi 110016'
        },
        applicableJurisdiction: 'High Court of Delhi, New Delhi, India'
      }
    });
    setWizardOpen(true);
  };

  const handleEditProduct = (prod: InsuranceProduct) => {
    setEditingProductId(prod.id);
    setFormData(JSON.parse(JSON.stringify(prod)));
    setActiveStep(1);
    setErrorMsg(null);
    setSuccessMsg(null);
    setWizardOpen(true);
  };

  const handleDuplicate = async (prod: InsuranceProduct) => {
    if (!user) return;
    try {
      await policyEngine.duplicateProduct(prod.id, user);
      await loadProducts();
      setSuccessMsg(`Successfully duplicated ${prod.name} into a new DRAFT product.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to duplicate product.');
    }
  };

  const handleTransitionStatus = async (prod: InsuranceProduct, newStatus: ProductStatus) => {
    if (!user) return;
    try {
      await policyEngine.transitionProductStatus(
        prod.id,
        newStatus,
        user,
        `Status updated to ${newStatus} from Policy Administration Console`
      );
      await loadProducts();
      setSuccessMsg(`Product ${prod.code} transitioned to ${newStatus}.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update status.');
    }
  };

  const handleSaveProduct = async (asPublished: boolean = false) => {
    if (!user) return;
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const dataToSave: any = {
        ...formData,
        status: asPublished ? 'PUBLISHED' : (formData.status || 'DRAFT')
      };

      if (editingProductId) {
        await policyEngine.updateProductTemplate(
          editingProductId,
          dataToSave,
          user,
          `Configured via Policy Administration Console`
        );
        setSuccessMsg(`Successfully updated product template: ${dataToSave.name}`);
      } else {
        await policyEngine.createProductTemplate(dataToSave, user);
        setSuccessMsg(`Successfully created product template: ${dataToSave.name}`);
      }

      setWizardOpen(false);
      await loadProducts();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save product template.');
    } finally {
      setSaving(false);
    }
  };

  const handleViewVersions = async (prod: InsuranceProduct) => {
    setVersionModalProduct(prod);
    try {
      const allVers = await PolicyVersionsRepo.getAll();
      const matched = allVers.filter(v => v.productId === prod.id || v.productCode === prod.code);
      setVersionsList(matched);
    } catch (err) {
      console.error('Error loading versions:', err);
    }
  };

  // Add / Remove Benefit in Wizard
  const addBenefit = () => {
    const newB: CoverageBenefitConfig = {
      id: 'cov_' + Date.now(),
      category: 'OTHER',
      name: 'New Custom Coverage Benefit',
      description: 'Benefit description...',
      benefitAmount: 100000,
      maxBenefitAmount: 100000,
      perEventLimit: 100000,
      annualLimit: 100000,
      aggregateLimit: 100000,
      waitingPeriodDays: 15,
      requiredClaimDocuments: ['IDENTITY_PROOF', 'FEE_DEMAND_STATEMENT'],
      geographicRestrictions: ['INDIA'],
      benefitRecipient: 'UNIVERSITY_DIRECT',
      isOptionalAddon: false,
      addonPremium: 0
    };
    setFormData(prev => ({
      ...prev,
      coverageBenefits: [...(prev.coverageBenefits || []), newB]
    }));
  };

  const removeBenefit = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      coverageBenefits: prev.coverageBenefits?.filter((_, i) => i !== idx)
    }));
  };

  // Add / Remove Exclusion in Wizard
  const addExclusion = () => {
    const newEx: PolicyExclusionConfig = {
      id: 'ex_' + Date.now(),
      title: 'New Excluded Condition',
      detailedExplanation: 'Detailed description of circumstances where coverage does not apply...',
      applicableCategory: 'ALL',
      applicableConditions: 'Exclusion conditions...',
      effectivePeriod: 'Entire policy tenure'
    };
    setFormData(prev => ({
      ...prev,
      exclusions: [...(prev.exclusions || []), newEx]
    }));
  };

  const removeExclusion = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      exclusions: prev.exclusions?.filter((_, i) => i !== idx)
    }));
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.tier.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>PolicyCenter Product Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Insurance Policy Configuration & Version Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create, configure, validate, and publish version-controlled education insurance products with actuarial rules.
          </p>
        </div>

        <button
          onClick={handleOpenNewWizard}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Configure New Policy Product</span>
        </button>
      </div>

      {/* Status Messages */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search policies by name, unique code, or tier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
        >
          <option value="ALL">All Policy Statuses</option>
          <option value="DRAFT">DRAFT</option>
          <option value="UNDER_REVIEW">UNDER_REVIEW</option>
          <option value="APPROVED">APPROVED</option>
          <option value="PUBLISHED">PUBLISHED</option>
          <option value="SUSPENDED">SUSPENDED</option>
          <option value="WITHDRAWN">WITHDRAWN</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
        >
          <option value="ALL">All Categories</option>
          <option value="FOUNDATION">FOUNDATION</option>
          <option value="COMPREHENSIVE">COMPREHENSIVE</option>
          <option value="SCHOLAR_ELITE">SCHOLAR_ELITE</option>
          <option value="SPECIALIZED">SPECIALIZED</option>
        </select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredProducts.map(p => (
          <div
            key={p.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded uppercase">
                  {p.tier} TIER • v{p.currentVersion}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  p.status === 'PUBLISHED' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : p.status === 'DRAFT'
                      ? 'bg-slate-100 text-slate-700'
                      : p.status === 'UNDER_REVIEW'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                }`}>
                  {p.status}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mt-2">{p.name}</h3>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">Code: {p.code}</div>
              <p className="text-xs text-slate-600 mt-2 line-clamp-2">{p.shortDescription || p.detailedDescription}</p>

              {/* Key Actuarial Metrics */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Base Premium Rate:</span>
                  <span className="font-bold text-slate-900">{p.premiumConfig?.baseRatePercent ?? 2.5}% / yr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Maximum Coverage Cap:</span>
                  <span className="font-bold text-brand-700">{formatINR(p.financialLimits?.maxCoverageLimit ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Statutory Waiting Period:</span>
                  <span className="font-medium text-slate-800">
                    {p.coverageBenefits?.[0]?.waitingPeriodDays ?? 0} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Covered Risks Configured:</span>
                  <span className="font-semibold text-slate-800">{p.coverageBenefits?.length || 0} Benefits</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Defined Exclusions:</span>
                  <span className="font-semibold text-slate-800">{p.exclusions?.length || 0} Clauses</span>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <button
                  onClick={() => handleEditProduct(p)}
                  className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Configure</span>
                </button>
                <button
                  onClick={() => handleViewVersions(p)}
                  className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-slate-800"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Versions</span>
                </button>
                <button
                  onClick={() => handleDuplicate(p)}
                  className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-slate-800"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate</span>
                </button>
              </div>

              {/* Status Transition Control */}
              <div className="pt-2 border-t border-slate-50 flex items-center justify-between gap-1">
                {p.status === 'DRAFT' && (
                  <button
                    onClick={() => handleTransitionStatus(p, 'UNDER_REVIEW')}
                    className="w-full py-1 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-[11px] border border-amber-200"
                  >
                    Submit for Review
                  </button>
                )}
                {p.status === 'UNDER_REVIEW' && (
                  <button
                    onClick={() => handleTransitionStatus(p, 'APPROVED')}
                    className="w-full py-1 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold text-[11px] border border-blue-200"
                  >
                    Approve Product
                  </button>
                )}
                {p.status === 'APPROVED' && (
                  <button
                    onClick={() => handleTransitionStatus(p, 'PUBLISHED')}
                    className="w-full py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs"
                  >
                    Publish to Catalogue
                  </button>
                )}
                {p.status === 'PUBLISHED' && (
                  <button
                    onClick={() => handleTransitionStatus(p, 'SUSPENDED')}
                    className="w-full py-1 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] border border-rose-200"
                  >
                    Suspend Product
                  </button>
                )}
                {p.status === 'SUSPENDED' && (
                  <button
                    onClick={() => handleTransitionStatus(p, 'PUBLISHED')}
                    className="w-full py-1 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-[11px] border border-emerald-200"
                  >
                    Re-Publish
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MULTI-STEP POLICY CONFIGURATION MODAL */}
      {wizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingProductId ? `Edit Policy Template: ${formData.name}` : 'Configure New Insurance Policy Product'}
                </h3>
                <p className="text-xs text-slate-500">
                  Step {activeStep} of 7: Enterprise PolicyCenter Configuration
                </p>
              </div>
              <button
                onClick={() => setWizardOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Tabs */}
            <div className="px-5 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center gap-1 overflow-x-auto text-xs">
              {[
                { step: 1, label: '1. Basic Info' },
                { step: 2, label: '2. Eligibility' },
                { step: 3, label: '3. Coverage Benefits' },
                { step: 4, label: '4. Exclusions' },
                { step: 5, label: '5. Premium Engine' },
                { step: 6, label: '6. Limits & Terms' },
                { step: 7, label: '7. Review & Publish' }
              ].map(s => (
                <button
                  key={s.step}
                  onClick={() => setActiveStep(s.step)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
                    activeStep === s.step
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
              {/* STEP 1: BASIC POLICY INFORMATION */}
              {activeStep === 1 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-slate-900 border-b pb-2">
                    Module 1: Basic Policy Information
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase mb-1">Policy Product Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. EduShield Scholar Elite Shield"
                        className="w-full px-3 py-2 border rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase mb-1">Unique Policy Code *</label>
                      <input
                        type="text"
                        required
                        value={formData.code || ''}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="e.g. EDUSH-ELT-2026"
                        className="w-full px-3 py-2 border rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase mb-1">Plan Tier</label>
                      <select
                        value={formData.tier || 'COMPREHENSIVE'}
                        onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
                        className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                      >
                        <option value="BASIC">BASIC</option>
                        <option value="COMPREHENSIVE">COMPREHENSIVE</option>
                        <option value="PREMIUM">PREMIUM</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 uppercase mb-1">Category</label>
                      <select
                        value={formData.category || 'COMPREHENSIVE'}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                        className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                      >
                        <option value="FOUNDATION">FOUNDATION</option>
                        <option value="COMPREHENSIVE">COMPREHENSIVE</option>
                        <option value="SCHOLAR_ELITE">SCHOLAR_ELITE</option>
                        <option value="SPECIALIZED">SPECIALIZED</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 uppercase mb-1">Initial Version</label>
                      <input
                        type="text"
                        value={formData.currentVersion || '1.0.0'}
                        onChange={(e) => setFormData({ ...formData, currentVersion: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 uppercase mb-1">Short Description *</label>
                    <input
                      type="text"
                      value={formData.shortDescription || ''}
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                      placeholder="Brief overview displayed on policy cards..."
                      className="w-full px-3 py-2 border rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 uppercase mb-1">Detailed Description & Purpose</label>
                    <textarea
                      rows={3}
                      value={formData.detailedDescription || ''}
                      onChange={(e) => setFormData({ ...formData, detailedDescription: e.target.value })}
                      placeholder="Comprehensive explanation of risks covered, purpose, and target segment..."
                      className="w-full px-3 py-2 border rounded-lg text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase mb-1">Target Customer Segment</label>
                      <input
                        type="text"
                        value={formData.targetCustomerSegment || ''}
                        onChange={(e) => setFormData({ ...formData, targetCustomerSegment: e.target.value })}
                        placeholder="e.g. Undergraduate engineering students"
                        className="w-full px-3 py-2 border rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase mb-1">Supported Durations (Years)</label>
                      <div className="flex items-center gap-2 pt-1">
                        {[1, 2, 3, 4, 5].map(yr => (
                          <label key={yr} className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.policyDurationYearsOptions?.includes(yr)}
                              onChange={(e) => {
                                const current = formData.policyDurationYearsOptions || [];
                                const updated = e.target.checked
                                  ? [...current, yr]
                                  : current.filter(y => y !== yr);
                                setFormData({ ...formData, policyDurationYearsOptions: updated });
                              }}
                            />
                            <span>{yr}Y</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: ELIGIBILITY CRITERIA */}
              {activeStep === 2 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-slate-900 border-b pb-2">
                    Module 2: Centralized Eligibility Criteria
                  </h4>
                  <p className="text-slate-500">
                    Define strict pre-conditions that must be satisfied before policy purchase is permitted.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase mb-1">Minimum Eligible Age</label>
                      <input
                        type="number"
                        min={14}
                        max={30}
                        value={formData.eligibilityCriteria?.minAge || 16}
                        onChange={(e) => setFormData({
                          ...formData,
                          eligibilityCriteria: { ...formData.eligibilityCriteria!, minAge: Number(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase mb-1">Maximum Eligible Age</label>
                      <input
                        type="number"
                        min={18}
                        max={40}
                        value={formData.eligibilityCriteria?.maxAge || 28}
                        onChange={(e) => setFormData({
                          ...formData,
                          eligibilityCriteria: { ...formData.eligibilityCriteria!, maxAge: Number(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 uppercase mb-1">Eligible Degree Types</label>
                    <div className="flex gap-4 pt-1">
                      {['UNDERGRADUATE', 'POSTGRADUATE', 'DIPLOMA'].map(deg => (
                        <label key={deg} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.eligibilityCriteria?.allowedDegreeTypes?.includes(deg as any)}
                            onChange={(e) => {
                              const current = formData.eligibilityCriteria?.allowedDegreeTypes || [];
                              const updated = e.target.checked
                                ? [...current, deg as any]
                                : current.filter(d => d !== deg);
                              setFormData({
                                ...formData,
                                eligibilityCriteria: { ...formData.eligibilityCriteria!, allowedDegreeTypes: updated }
                              });
                            }}
                          />
                          <span>{deg}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 uppercase mb-1">Eligible Partner Institutions</label>
                    <div className="p-3 border rounded-lg bg-slate-50 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer font-bold">
                        <input
                          type="checkbox"
                          checked={formData.applicableInstitutions?.includes('ALL')}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              applicableInstitutions: e.target.checked ? ['ALL'] : []
                            });
                          }}
                        />
                        <span>All Verified EduShield Partner Institutions</span>
                      </label>
                      {!formData.applicableInstitutions?.includes('ALL') && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                          {universities.map(u => (
                            <label key={u.id} className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.applicableInstitutions?.includes(u.id)}
                                onChange={(e) => {
                                  const cur = formData.applicableInstitutions || [];
                                  const upd = e.target.checked ? [...cur, u.id] : cur.filter(id => id !== u.id);
                                  setFormData({ ...formData, applicableInstitutions: upd });
                                }}
                              />
                              <span>{u.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 uppercase mb-1">Mandatory Document Verification</label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.eligibilityCriteria?.requireStudentIdProof}
                          onChange={(e) => setFormData({
                            ...formData,
                            eligibilityCriteria: { ...formData.eligibilityCriteria!, requireStudentIdProof: e.target.checked }
                          })}
                        />
                        <span>Require Student Government ID Proof</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.eligibilityCriteria?.requireEnrollmentCertificate}
                          onChange={(e) => setFormData({
                            ...formData,
                            eligibilityCriteria: { ...formData.eligibilityCriteria!, requireEnrollmentCertificate: e.target.checked }
                          })}
                        />
                        <span>Require University Enrollment Certificate</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.eligibilityCriteria?.requireAdmissionLetter}
                          onChange={(e) => setFormData({
                            ...formData,
                            eligibilityCriteria: { ...formData.eligibilityCriteria!, requireAdmissionLetter: e.target.checked }
                          })}
                        />
                        <span>Require University Admission Letter</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.eligibilityCriteria?.requireUniversityVerification}
                          onChange={(e) => setFormData({
                            ...formData,
                            eligibilityCriteria: { ...formData.eligibilityCriteria!, requireUniversityVerification: e.target.checked }
                          })}
                        />
                        <span>Require University Registrar Fee Certification</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: COVERED RISKS & BENEFITS */}
              {activeStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-bold text-sm text-slate-900">
                      Module 3: Covered Risks & Included Benefits ({formData.coverageBenefits?.length || 0})
                    </h4>
                    <button
                      type="button"
                      onClick={addBenefit}
                      className="px-3 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold rounded-lg text-xs border border-brand-200 flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Add Benefit</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.coverageBenefits?.map((b, idx) => (
                      <div key={b.id || idx} className="p-4 rounded-xl border bg-slate-50 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">Benefit #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeBenefit(idx)}
                            className="text-rose-600 hover:text-rose-800 text-xs flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 uppercase">Benefit Name</label>
                            <input
                              type="text"
                              value={b.name}
                              onChange={(e) => {
                                const updated = [...(formData.coverageBenefits || [])];
                                updated[idx].name = e.target.value;
                                setFormData({ ...formData, coverageBenefits: updated });
                              }}
                              className="w-full px-2.5 py-1.5 border rounded-lg text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 uppercase">Coverage Category</label>
                            <select
                              value={b.category}
                              onChange={(e) => {
                                const updated = [...(formData.coverageBenefits || [])];
                                updated[idx].category = e.target.value as CoverageCategory;
                                setFormData({ ...formData, coverageBenefits: updated });
                              }}
                              className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white"
                            >
                              <option value="PARENT_DEATH">PARENT_DEATH</option>
                              <option value="PARENT_DISABILITY">PARENT_DISABILITY</option>
                              <option value="CRITICAL_ILLNESS">CRITICAL_ILLNESS</option>
                              <option value="TUITION_PROTECTION">TUITION_PROTECTION</option>
                              <option value="EMERGENCY_MEDICAL">EMERGENCY_MEDICAL</option>
                              <option value="EMERGENCY_TRAVEL">EMERGENCY_TRAVEL</option>
                              <option value="HOSTEL_LIVING">HOSTEL_LIVING</option>
                              <option value="CAREER_CONTINUITY">CAREER_CONTINUITY</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 uppercase">Max Benefit Cap (₹)</label>
                            <input
                              type="number"
                              value={b.benefitAmount}
                              onChange={(e) => {
                                const updated = [...(formData.coverageBenefits || [])];
                                updated[idx].benefitAmount = Number(e.target.value);
                                updated[idx].maxBenefitAmount = Number(e.target.value);
                                setFormData({ ...formData, coverageBenefits: updated });
                              }}
                              className="w-full px-2.5 py-1.5 border rounded-lg text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 uppercase">Waiting Period (Days)</label>
                            <input
                              type="number"
                              value={b.waitingPeriodDays}
                              onChange={(e) => {
                                const updated = [...(formData.coverageBenefits || [])];
                                updated[idx].waitingPeriodDays = Number(e.target.value);
                                setFormData({ ...formData, coverageBenefits: updated });
                              }}
                              className="w-full px-2.5 py-1.5 border rounded-lg text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 uppercase">Benefit Recipient</label>
                            <select
                              value={b.benefitRecipient}
                              onChange={(e) => {
                                const updated = [...(formData.coverageBenefits || [])];
                                updated[idx].benefitRecipient = e.target.value as any;
                                setFormData({ ...formData, coverageBenefits: updated });
                              }}
                              className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white"
                            >
                              <option value="UNIVERSITY_DIRECT">UNIVERSITY_DIRECT (Escrow)</option>
                              <option value="STUDENT">STUDENT</option>
                              <option value="GUARDIAN">GUARDIAN</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2 pt-4">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={b.isOptionalAddon}
                                onChange={(e) => {
                                  const updated = [...(formData.coverageBenefits || [])];
                                  updated[idx].isOptionalAddon = e.target.checked;
                                  setFormData({ ...formData, coverageBenefits: updated });
                                }}
                              />
                              <span>Is Optional Add-on Rider?</span>
                            </label>
                            {b.isOptionalAddon && (
                              <input
                                type="number"
                                placeholder="Addon ₹"
                                value={b.addonPremium || ''}
                                onChange={(e) => {
                                  const updated = [...(formData.coverageBenefits || [])];
                                  updated[idx].addonPremium = Number(e.target.value);
                                  setFormData({ ...formData, coverageBenefits: updated });
                                }}
                                className="w-24 px-2 py-1 border rounded text-xs"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: EXCLUSIONS */}
              {activeStep === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-bold text-sm text-slate-900">
                      Module 4: Explicit Policy Exclusions ({formData.exclusions?.length || 0})
                    </h4>
                    <button
                      type="button"
                      onClick={addExclusion}
                      className="px-3 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold rounded-lg text-xs border border-brand-200 flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Add Exclusion</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.exclusions?.map((ex, idx) => (
                      <div key={ex.id || idx} className="p-4 rounded-xl border bg-slate-50 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">Exclusion #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeExclusion(idx)}
                            className="text-rose-600 hover:text-rose-800 text-xs flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 uppercase">Exclusion Title</label>
                            <input
                              type="text"
                              value={ex.title}
                              onChange={(e) => {
                                const updated = [...(formData.exclusions || [])];
                                updated[idx].title = e.target.value;
                                setFormData({ ...formData, exclusions: updated });
                              }}
                              className="w-full px-2.5 py-1.5 border rounded-lg text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 uppercase">Applicable Category</label>
                            <select
                              value={ex.applicableCategory}
                              onChange={(e) => {
                                const updated = [...(formData.exclusions || [])];
                                updated[idx].applicableCategory = e.target.value as any;
                                setFormData({ ...formData, exclusions: updated });
                              }}
                              className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white"
                            >
                              <option value="ALL">ALL (Entire Policy)</option>
                              <option value="PARENT_DEATH">PARENT_DEATH</option>
                              <option value="PARENT_DISABILITY">PARENT_DISABILITY</option>
                              <option value="CRITICAL_ILLNESS">CRITICAL_ILLNESS</option>
                              <option value="TUITION_PROTECTION">TUITION_PROTECTION</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 uppercase">Detailed Explanation</label>
                          <textarea
                            rows={2}
                            value={ex.detailedExplanation}
                            onChange={(e) => {
                              const updated = [...(formData.exclusions || [])];
                              updated[idx].detailedExplanation = e.target.value;
                              setFormData({ ...formData, exclusions: updated });
                            }}
                            className="w-full px-2.5 py-1.5 border rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 5: PREMIUM CALCULATION ENGINE */}
              {activeStep === 5 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-slate-900 border-b pb-2">
                    Module 5: Actuarial Premium Calculation Configuration
                  </h4>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase mb-1">Base Rate Percent (%) *</label>
                      <input
                        type="number"
                        step={0.1}
                        min={0.5}
                        max={10.0}
                        value={formData.premiumConfig?.baseRatePercent || 2.5}
                        onChange={(e) => setFormData({
                          ...formData,
                          premiumConfig: { ...formData.premiumConfig!, baseRatePercent: Number(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border rounded-lg text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 uppercase mb-1">Base Policy Fee (₹)</label>
                      <input
                        type="number"
                        step={500}
                        value={formData.premiumConfig?.basePremium || 2500}
                        onChange={(e) => setFormData({
                          ...formData,
                          premiumConfig: { ...formData.premiumConfig!, basePremium: Number(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 uppercase mb-1">Statutory GST (%)</label>
                      <input
                        type="number"
                        value={formData.premiumConfig?.taxRatePercent || 18}
                        onChange={(e) => setFormData({
                          ...formData,
                          premiumConfig: { ...formData.premiumConfig!, taxRatePercent: Number(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase mb-1">Minimum Payable Premium (₹)</label>
                      <input
                        type="number"
                        value={formData.premiumConfig?.minPremium || 3500}
                        onChange={(e) => setFormData({
                          ...formData,
                          premiumConfig: { ...formData.premiumConfig!, minPremium: Number(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 uppercase mb-1">Maximum Payable Cap (₹)</label>
                      <input
                        type="number"
                        value={formData.premiumConfig?.maxPremium || 75000}
                        onChange={(e) => setFormData({
                          ...formData,
                          premiumConfig: { ...formData.premiumConfig!, maxPremium: Number(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 uppercase mb-1">Supported Payment Frequencies</label>
                    <div className="flex gap-4 pt-1">
                      {['ANNUAL', 'SEMESTER', 'QUARTERLY'].map(freq => (
                        <label key={freq} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.premiumConfig?.availableFrequencies?.includes(freq as any)}
                            onChange={(e) => {
                              const cur = formData.premiumConfig?.availableFrequencies || [];
                              const upd = e.target.checked ? [...cur, freq as any] : cur.filter(f => f !== freq);
                              setFormData({
                                ...formData,
                                premiumConfig: { ...formData.premiumConfig!, availableFrequencies: upd }
                              });
                            }}
                          />
                          <span>{freq}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: FINANCIAL LIMITS & TERMS */}
              {activeStep === 6 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-slate-900 border-b pb-2">
                    Module 6: Financial Limits, Deductibles & Contractual Conditions
                  </h4>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase mb-1">Maximum Coverage Cap (₹) *</label>
                      <input
                        type="number"
                        value={formData.financialLimits?.maxCoverageLimit || 2000000}
                        onChange={(e) => setFormData({
                          ...formData,
                          financialLimits: { 
                            ...formData.financialLimits!, 
                            maxCoverageLimit: Number(e.target.value),
                            sumInsured: Number(e.target.value),
                            aggregateClaimLimit: Number(e.target.value),
                            perEventLimit: Number(e.target.value)
                          }
                        })}
                        className="w-full px-3 py-2 border rounded-lg text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 uppercase mb-1">Standard Deductible (₹)</label>
                      <input
                        type="number"
                        value={formData.financialLimits?.deductibleAmount || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          financialLimits: { ...formData.financialLimits!, deductibleAmount: Number(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 uppercase mb-1">Co-Payment (%)</label>
                      <input
                        type="number"
                        value={formData.financialLimits?.coPaymentPercent || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          financialLimits: { ...formData.financialLimits!, coPaymentPercent: Number(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 uppercase mb-1">Free-Look Period (Days)</label>
                      <input
                        type="number"
                        value={formData.cancellationConditions?.freeLookPeriodDays || 15}
                        onChange={(e) => setFormData({
                          ...formData,
                          cancellationConditions: { ...formData.cancellationConditions!, freeLookPeriodDays: Number(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 uppercase mb-1">Renewal Discount Concession (%)</label>
                      <input
                        type="number"
                        value={formData.renewalConditions?.renewalDiscountPercent || 5}
                        onChange={(e) => setFormData({
                          ...formData,
                          renewalConditions: { ...formData.renewalConditions!, renewalDiscountPercent: Number(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 7: REVIEW & PUBLISH */}
              {activeStep === 7 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-slate-900 border-b pb-2">
                    Module 7: Policy Template Preview & Validation Summary
                  </h4>

                  <div className="p-4 rounded-xl bg-slate-50 border space-y-3">
                    <div className="flex justify-between">
                      <span className="font-bold text-sm text-slate-900">{formData.name}</span>
                      <span className="font-mono text-xs font-semibold bg-brand-50 text-brand-700 px-2 py-0.5 rounded">
                        {formData.code} • v{formData.currentVersion}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-2 border-t text-slate-600">
                      <div>Tier: <strong className="text-slate-900">{formData.tier}</strong></div>
                      <div>Base Rate: <strong className="text-slate-900">{formData.premiumConfig?.baseRatePercent}%</strong></div>
                      <div>Max Cap: <strong className="text-brand-700">{formatINR(formData.financialLimits?.maxCoverageLimit || 0)}</strong></div>
                    </div>

                    <div className="pt-2 border-t text-slate-600">
                      <span className="font-semibold text-slate-800">Covered Risks:</span> {formData.coverageBenefits?.map(b => b.name).join(', ')}
                    </div>

                    <div className="pt-1 text-slate-600">
                      <span className="font-semibold text-slate-800">Exclusions:</span> {formData.exclusions?.map(e => e.title).join(', ')}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer / Navigation */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                {activeStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setActiveStep(activeStep - 1)}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold border bg-white hover:bg-slate-100"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWizardOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveProduct(false)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-700 hover:bg-slate-800 text-white"
                >
                  Save as Draft
                </button>
                {activeStep < 7 ? (
                  <button
                    type="button"
                    onClick={() => setActiveStep(activeStep + 1)}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSaveProduct(true)}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Publish Policy Product</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VERSION HISTORY MODAL */}
      {versionModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Version History: {versionModalProduct.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">Code: {versionModalProduct.code}</p>
              </div>
              <button
                onClick={() => setVersionModalProduct(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto text-xs">
              {versionsList.length === 0 ? (
                <p className="text-slate-400 text-center py-6">No historical versions recorded for this product template.</p>
              ) : (
                versionsList.map(v => (
                  <div key={v.id} className="p-3.5 rounded-xl border bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Version {v.versionNumber}</span>
                      <span className="text-[10px] bg-brand-50 text-brand-700 font-bold px-2 py-0.5 rounded uppercase">
                        {v.status}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{v.changeNotes}</p>
                    <div className="text-[10px] text-slate-400 flex justify-between pt-1 border-t">
                      <span>Effective: {new Date(v.effectiveDate).toLocaleDateString('en-IN')}</span>
                      <span>Approved By: {v.approvedBy || 'System Administrator'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setVersionModalProduct(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
