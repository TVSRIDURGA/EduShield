import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  GraduationCap, 
  FileText, 
  PlusCircle, 
  Clock, 
  Layers,
  HeartHandshake
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Student, 
  University, 
  InsuranceProduct, 
  EducationPolicy, 
  EducationClaim, 
  PaymentFrequency,
  Quote 
} from '../../models/insurance';
import { 
  ProductsRepo, 
  StudentsRepo, 
  UniversitiesRepo 
} from '../../repositories/firestoreRepo';
import { quoteService } from '../../services/quoteService';
import { formatINR } from '../../utils/businessRules';

// Subcomponents
import { ParentHeroBanner } from './ParentHeroBanner';
import { EducationProtectionCalculator, CalculatorFormData } from './EducationProtectionCalculator';
import { PersonalDetailsModal, PersonalDetailsFormData } from './PersonalDetailsModal';
import { ContinuityDetailsModal, ContinuityDetailsFormData } from './ContinuityDetailsModal';
import { PolicyCustomizationStudio } from './PolicyCustomizationStudio';
import { ExistingPoliciesSummary } from './ExistingPoliciesSummary';

interface ParentInsuranceExperienceProps {
  policies: EducationPolicy[];
  claims: EducationClaim[];
  students: Student[];
  universities: University[];
  onRegisterChild: () => void;
  onRefreshData?: () => void;
}

export const ParentInsuranceExperience: React.FC<ParentInsuranceExperienceProps> = ({
  policies,
  claims,
  students,
  universities,
  onRegisterChild,
  onRefreshData
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Tab navigation between Experience and Existing Policies
  const [activeTab, setActiveTab] = useState<'PROTECT' | 'POLICIES'>(
    policies.length > 0 ? 'POLICIES' : 'PROTECT'
  );

  // Products
  const [products, setProducts] = useState<InsuranceProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<InsuranceProduct | null>(null);

  // Step 1: Calculator Form State (Image 4)
  const [calcData, setCalcData] = useState<CalculatorFormData>({
    parentFullName: user?.displayName || 'Rajesh Sharma',
    parentDob: '1981-10-18',
    isNri: false,
    mobile: user?.phoneNumber || '+91 9876543210',
    incomeBracket: '7-10',
    selectedStudentId: students.length > 0 ? students[0].id : ''
  });

  // Step 2: Modal 1 State (Image 3)
  const [personalModalOpen, setPersonalModalOpen] = useState(false);
  const [personalData, setPersonalData] = useState<PersonalDetailsFormData>({
    parentGender: 'Female',
    admissionCategory: 'Merit',
    preferredLanguage: 'English',
    parentOccupation: 'Salaried',
    parentEducation: 'Graduate & Above'
  });

  // Step 3: Modal 2 State (Image 2)
  const [continuityModalOpen, setContinuityModalOpen] = useState(false);
  const [continuityData, setContinuityData] = useState<ContinuityDetailsFormData>({
    hasCriticalIllness: false,
    maritalStatus: 'Single',
    escrowPreference: 'DIRECT_UNIVERSITY'
  });

  // Step 4: Policy Customization Studio Visibility & Values (Image 1 & 5)
  const [customizationActive, setCustomizationActive] = useState(false);
  const [activeQuoteSummary, setActiveQuoteSummary] = useState<{
    studentName: string;
    coverageAmount: number;
    installmentAmount: number;
    stepIndex: number;
    onContinue: () => void;
  } | undefined>(undefined);

  // Loading & Error States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load published insurance products
  useEffect(() => {
    async function fetchProducts() {
      try {
        const prods = await ProductsRepo.getAll();
        const published = prods.filter(p => p.status === 'PUBLISHED');
        setProducts(published);

        // Preselect Comprehensive product
        const comp = published.find(p => p.category === 'COMPREHENSIVE') || published[0];
        if (comp) {
          setSelectedProduct(comp);
        }
      } catch (err) {
        console.error('Failed to load products in Parent Experience:', err);
      }
    }
    fetchProducts();
  }, []);

  // Update default selected child when students prop updates
  useEffect(() => {
    if (students.length > 0 && !calcData.selectedStudentId) {
      setCalcData(prev => ({ ...prev, selectedStudentId: students[0].id }));
    }
  }, [students]);

  // Current targeted student
  const targetedStudent: Student = 
    students.find(s => s.id === calcData.selectedStudentId) || 
    students[0] || {
      id: 'stud_default',
      guardianId: user?.id || 'usr_guardian_1',
      guardianName: user?.displayName || 'Rajesh Sharma',
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

  // Step 1: Calculator Submittal -> Opens Modal 1
  const handleCalculatorSubmit = (formData: CalculatorFormData) => {
    setCalcData(formData);
    setPersonalModalOpen(true);
  };

  // Step 2: Modal 1 Proceed -> Opens Modal 2
  const handlePersonalDetailsProceed = (formData: PersonalDetailsFormData) => {
    setPersonalData(formData);
    setPersonalModalOpen(false);
    setContinuityModalOpen(true);
  };

  // Step 3: Modal 2 Check Coverage -> Activates Image 1 Customization Studio
  const handleContinuityCheckCoverage = (formData: ContinuityDetailsFormData) => {
    setContinuityData(formData);
    setContinuityModalOpen(false);
    setCustomizationActive(true);

    // Initial Quote Summary chip (Image 5)
    setActiveQuoteSummary({
      studentName: targetedStudent.fullName,
      coverageAmount: 2000000,
      installmentAmount: 1120,
      stepIndex: 2,
      onContinue: () => {
        const element = document.getElementById('policy-customization-studio');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });

    // Smooth scroll down to customization studio
    setTimeout(() => {
      const element = document.getElementById('policy-customization-studio');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Step 4: Lock in quote & generate formal contract quote
  const handleLockQuote = async (customization: {
    coverageAmount: number;
    durationYears: number;
    frequency: PaymentFrequency;
    selectedAddonIds: string[];
    totalAnnualPremium: number;
    frequencyInstallmentAmount: number;
    discountAmount: number;
    taxAmount: number;
  }) => {
    if (!user || !selectedProduct) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // Use existing quoteService with enterprise product
      const quote = await quoteService.generateQuote(
        user,
        targetedStudent,
        selectedProduct,
        customization.durationYears,
        {
          selectedAddonIds: customization.selectedAddonIds,
          frequency: customization.frequency,
          discountCode: personalData.admissionCategory === 'Merit' ? 'MERIT_10' : undefined
        }
      );

      // Successfully generated -> Navigate to Quote Detail & Terms Acceptance page
      navigate(`/quotes/${quote.id}`);
    } catch (err: any) {
      console.error('Failed to lock quote:', err);
      setError(err.message || 'Failed to generate quote. Please verify student eligibility.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalActiveCover = policies
    .filter(p => p.status === 'ACTIVE')
    .reduce((sum, p) => sum + p.coverageAmount, 0);

  return (
    <div className="space-y-8">
      {/* ============================================================ */}
      {/* 1. HERO SECTION WITH PERSONALIZED WELCOME                   */}
      {/* ============================================================ */}
      <ParentHeroBanner
        parentName={user?.displayName || 'Parent / Guardian'}
        coveredChildrenCount={students.length}
        totalActiveCover={totalActiveCover}
        primaryChildName={targetedStudent.fullName}
        primaryUniversityName={targetedStudent.universityName}
        onStartCalculator={() => {
          setActiveTab('PROTECT');
          const el = document.getElementById('protection-calculator-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onRegisterChild={onRegisterChild}
        onViewPolicies={() => setActiveTab('POLICIES')}
      />

      {/* Tabs navigation for Parent Portal: Customizer vs Existing Policies */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('PROTECT')}
            className={`pb-3.5 px-3 text-sm font-extrabold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'PROTECT'
                ? 'border-pink-700 text-pink-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Customize Education Protection</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('POLICIES')}
            className={`pb-3.5 px-3 text-sm font-extrabold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'POLICIES'
                ? 'border-pink-700 text-pink-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>My Active Policies &amp; Insured Children ({policies.length})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onRegisterChild}
          className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center gap-1.5 pb-3"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Register New Child</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
          {error}
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. TAB CONTENT A: POLICY CUSTOMIZATION & CALCULATOR FLOW    */}
      {/* ============================================================ */}
      {activeTab === 'PROTECT' && (
        <div className="space-y-10">
          {/* Section A: Calculator (Image 4 & Image 5) */}
          <div id="protection-calculator-section">
            <EducationProtectionCalculator
              initialParentName={user?.displayName || 'Rajesh Sharma'}
              initialMobile={user?.phoneNumber || '+91 9876543210'}
              students={students}
              onCalculate={handleCalculatorSubmit}
              activeQuoteSummary={activeQuoteSummary}
            />
          </div>

          {/* Section B: Policy Customization Studio (Image 1) */}
          {customizationActive && selectedProduct && (
            <div id="policy-customization-studio" className="pt-4 animate-in fade-in duration-300">
              <PolicyCustomizationStudio
                parentName={calcData.parentFullName}
                student={targetedStudent}
                product={selectedProduct}
                initialCoverageAmount={2000000}
                initialDurationYears={targetedStudent.totalCourseDurationYears || 4}
                initialFrequency="ANNUAL"
                hasMeritDiscount={personalData.admissionCategory === 'Merit'}
                hasGenderDiscount={personalData.parentGender === 'Female'}
                onEditInfo={() => setPersonalModalOpen(true)}
                onLockQuote={handleLockQuote}
              />
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. TAB CONTENT B: EXISTING POLICIES & CLAIMS SUMMARY (Req 7) */}
      {/* ============================================================ */}
      {activeTab === 'POLICIES' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <ExistingPoliciesSummary
            policies={policies}
            claims={claims}
            students={students}
            onOpenNewQuote={() => {
              setActiveTab('PROTECT');
              const el = document.getElementById('protection-calculator-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: Personal & Academic Profile (Image 3)               */}
      {/* ============================================================ */}
      <PersonalDetailsModal
        isOpen={personalModalOpen}
        onClose={() => setPersonalModalOpen(false)}
        onProceed={handlePersonalDetailsProceed}
        studentName={targetedStudent.fullName}
      />

      {/* ============================================================ */}
      {/* MODAL 2: Continuity & Health Details (Image 2)               */}
      {/* ============================================================ */}
      <ContinuityDetailsModal
        isOpen={continuityModalOpen}
        onBack={() => {
          setContinuityModalOpen(false);
          setPersonalModalOpen(true);
        }}
        onClose={() => setContinuityModalOpen(false)}
        onCheckCoverage={handleContinuityCheckCoverage}
      />
    </div>
  );
};
