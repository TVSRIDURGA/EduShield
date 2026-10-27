import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  SEED_PLANS, 
  SEED_UNIVERSITIES, 
  SEED_STUDENTS, 
  SEED_POLICIES, 
  SEED_CLAIMS, 
  SEED_AUDITS, 
  SEED_NOTIFICATIONS, 
  DEMO_USERS 
} from '../utils/seedData';
import { 
  Quote, 
  EducationPolicy, 
  EducationClaim, 
  Student, 
  University, 
  InsurancePlan, 
  AuditLog, 
  NotificationItem, 
  UserProfile 
} from '../models/insurance';

const STORAGE_KEYS = {
  PLANS: 'edushield_plans',
  UNIVERSITIES: 'edushield_universities',
  STUDENTS: 'edushield_students',
  QUOTES: 'edushield_quotes',
  POLICIES: 'edushield_policies',
  CLAIMS: 'edushield_claims',
  AUDITS: 'edushield_audits',
  NOTIFICATIONS: 'edushield_notifications',
  USERS: 'edushield_users',
};

// Initialize local storage seeds if not yet populated
function ensureLocalSeed() {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(STORAGE_KEYS.PLANS)) {
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(SEED_PLANS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.UNIVERSITIES)) {
    localStorage.setItem(STORAGE_KEYS.UNIVERSITIES, JSON.stringify(SEED_UNIVERSITIES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(SEED_STUDENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.POLICIES)) {
    localStorage.setItem(STORAGE_KEYS.POLICIES, JSON.stringify(SEED_POLICIES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CLAIMS)) {
    localStorage.setItem(STORAGE_KEYS.CLAIMS, JSON.stringify(SEED_CLAIMS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.AUDITS)) {
    localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(SEED_AUDITS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(SEED_NOTIFICATIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEMO_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.QUOTES)) {
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify([]));
  }
}

ensureLocalSeed();

export class Repository<T extends { id: string }> {
  private collectionName: string;
  private storageKey: string;

  constructor(collectionName: string, storageKey: string) {
    this.collectionName = collectionName;
    this.storageKey = storageKey;
  }

  private getLocal(): T[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private setLocal(items: T[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch (e) {
      console.warn(`Local storage write failed for ${this.storageKey}`, e);
    }
  }

  async getAll(): Promise<T[]> {
    try {
      const colRef = collection(db, this.collectionName);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        const items = snapshot.docs.map((d: any) => ({ ...d.data(), id: d.id } as T));
        this.setLocal(items);
        return items;
      }
    } catch (err) {
      console.warn(`Firestore read fallback to local cache for ${this.collectionName}:`, err);
    }
    return this.getLocal();
  }

  async getById(id: string): Promise<T | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { ...snap.data(), id: snap.id } as T;
      }
    } catch (err) {
      console.warn(`Firestore getById fallback for ${this.collectionName}/${id}:`, err);
    }
    const local = this.getLocal();
    return local.find(i => i.id === id) || null;
  }

  async create(item: T): Promise<T> {
    const local = this.getLocal();
    const existingIndex = local.findIndex(i => i.id === item.id);
    if (existingIndex >= 0) {
      local[existingIndex] = item;
    } else {
      local.unshift(item);
    }
    this.setLocal(local);

    try {
      const docRef = doc(db, this.collectionName, item.id);
      await setDoc(docRef, item);
    } catch (err) {
      console.warn(`Firestore write warning for ${this.collectionName}:`, err);
    }
    return item;
  }

  async update(id: string, updates: Partial<T>): Promise<T | null> {
    const local = this.getLocal();
    const index = local.findIndex(i => i.id === id);
    if (index === -1) return null;

    const updated = { ...local[index], ...updates };
    local[index] = updated;
    this.setLocal(local);

    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, updates as any);
    } catch (err) {
      console.warn(`Firestore update warning for ${this.collectionName}/${id}:`, err);
    }
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const local = this.getLocal();
    const filtered = local.filter(i => i.id !== id);
    this.setLocal(filtered);

    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn(`Firestore delete warning for ${this.collectionName}/${id}:`, err);
    }
    return true;
  }

  async findBy(field: keyof T, value: any): Promise<T[]> {
    const local = this.getLocal();
    return local.filter(item => item[field] === value);
  }
}

// Export Singleton Repositories
export const PlansRepo = new Repository<InsurancePlan>('insurancePlans', STORAGE_KEYS.PLANS);
export const UniversitiesRepo = new Repository<University>('universities', STORAGE_KEYS.UNIVERSITIES);
export const StudentsRepo = new Repository<Student>('students', STORAGE_KEYS.STUDENTS);
export const QuotesRepo = new Repository<Quote>('quotes', STORAGE_KEYS.QUOTES);
export const PoliciesRepo = new Repository<EducationPolicy>('educationPolicies', STORAGE_KEYS.POLICIES);
export const ClaimsRepo = new Repository<EducationClaim>('educationClaims', STORAGE_KEYS.CLAIMS);
export const AuditsRepo = new Repository<AuditLog>('auditLogs', STORAGE_KEYS.AUDITS);
export const NotificationsRepo = new Repository<NotificationItem>('notifications', STORAGE_KEYS.NOTIFICATIONS);
export const UsersRepo = new Repository<UserProfile>('users', STORAGE_KEYS.USERS);
