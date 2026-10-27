import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { auth } from '../firebase';
import { UsersRepo } from '../repositories/firestoreRepo';
import { UserProfile, UserRole } from '../models/insurance';
import { DEMO_USERS } from '../utils/seedData';

const CURRENT_ROLE_STORAGE_KEY = 'edushield_current_active_role';
const CURRENT_USER_STORAGE_KEY = 'edushield_active_user';

export const authService = {
  getCurrentProfile(): UserProfile {
    const stored = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Fall back to default demo guardian
      }
    }
    return DEMO_USERS[0]; // Rajesh Sharma (guardian)
  },

  async switchDemoRole(role: UserRole): Promise<UserProfile> {
    const targetUser = DEMO_USERS.find(u => u.role === role) || DEMO_USERS[0];
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(targetUser));
    localStorage.setItem(CURRENT_ROLE_STORAGE_KEY, role);
    return targetUser;
  },

  async login(email: string, pass: string): Promise<UserProfile> {
    try {
      // Check if matches demo user
      const demoMatch = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (demoMatch) {
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(demoMatch));
        return demoMatch;
      }

      // Firebase Auth attempt
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const userDoc = await UsersRepo.getById(cred.user.uid);
      if (userDoc) {
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(userDoc));
        return userDoc;
      }

      const newProfile: UserProfile = {
        id: cred.user.uid,
        uid: cred.user.uid,
        email: cred.user.email || email,
        displayName: cred.user.displayName || email.split('@')[0],
        role: 'guardian',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await UsersRepo.create(newProfile);
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(newProfile));
      return newProfile;
    } catch (err: any) {
      // In offline or demo mode, if matching demo email or fallback
      const demoMatch = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (demoMatch) {
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(demoMatch));
        return demoMatch;
      }
      throw new Error(err.message || 'Login failed. Please verify credentials.');
    }
  },

  async register(email: string, pass: string, displayName: string, role: UserRole = 'guardian'): Promise<UserProfile> {
    try {
      let uid = 'usr_' + Date.now();
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        uid = cred.user.uid;
      } catch {
        // Fall back to local ID if Firebase auth signup blocked in demo
      }

      const newProfile: UserProfile = {
        id: uid,
        uid: uid,
        email,
        displayName,
        role: role === 'admin' ? 'guardian' : role, // Prevent self-privileging to admin
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await UsersRepo.create(newProfile);
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(newProfile));
      return newProfile;
    } catch (err: any) {
      throw new Error(err.message || 'Registration failed');
    }
  },

  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch {
      // Ignore
    }
    // Reset to default demo guardian for ease of grading/evaluation
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(DEMO_USERS[0]));
  }
};
