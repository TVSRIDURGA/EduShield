import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendPasswordResetEmail,
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile, UserRole } from '../models/insurance';
import { DEMO_USERS } from '../utils/seedData';
import { auditService } from './auditService';

export const CANONICAL_DEMO_ACCOUNTS: { [email: string]: Partial<UserProfile> } = {
  'guardian@edushield.demo': {
    displayName: 'Rajesh Sharma',
    role: 'guardian',
    phoneNumber: '+91 98112 34567'
  },
  'student@edushield.demo': {
    displayName: 'Aarav Sharma',
    role: 'student',
    phoneNumber: '+91 98112 34568'
  },
  'officer@edushield.demo': {
    displayName: 'Vikram Mehta (Senior Claims Adjuster)',
    role: 'claims_officer',
    phoneNumber: '+91 97110 55432'
  },
  'university@edushield.demo': {
    displayName: 'Dr. Sunita Deshmukh (Registrar Accounts)',
    role: 'university',
    universityId: 'univ_iitd',
    phoneNumber: '+91 11 2659 7000'
  },
  'admin@edushield.demo': {
    displayName: 'Priya Nambiar (System Administrator)',
    role: 'admin',
    phoneNumber: '+91 98888 77777'
  }
};

export const authService = {
  /**
   * Listen to Firebase Auth state changes and sync profile from Firestore
   */
  onAuthStateChangedListener(callback: (user: UserProfile | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (!firebaseUser) {
        callback(null);
        return;
      }

      try {
        const profile = await authService.getUserProfile(firebaseUser.uid, firebaseUser.email || '');
        callback(profile);
      } catch (err) {
        console.error('Failed to load user profile on auth state change:', err);
        // Fallback minimal authenticated profile if firestore read is delayed
        callback({
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Authenticated User',
          role: 'guardian',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });
  },

  /**
   * Fetch user profile from Firestore /users/{uid}
   */
  async getUserProfile(uid: string, email: string = ''): Promise<UserProfile> {
    try {
      const userDocRef = doc(db, 'users', uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
    } catch (err) {
      console.warn('Firestore getUserProfile read warning:', err);
    }

    // Check if canonical demo account configuration applies
    const normalizedEmail = email.toLowerCase();
    const demoConfig = CANONICAL_DEMO_ACCOUNTS[normalizedEmail];
    const initialRole: UserRole = demoConfig?.role || 'guardian';
    const initialName = demoConfig?.displayName || (email ? email.split('@')[0] : 'EduShield User');
    const universityId = demoConfig?.universityId;

    const newProfile: UserProfile = {
      id: uid,
      uid,
      email,
      displayName: initialName,
      role: initialRole,
      universityId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', uid), newProfile);
    } catch (writeErr) {
      console.warn('Firestore getUserProfile write warning:', writeErr);
    }

    return newProfile;
  },

  /**
   * Genuine login with Firebase Authentication (email & password)
   */
  async login(email: string, pass: string): Promise<UserProfile> {
    const cleanEmail = email.trim();
    if (!cleanEmail || !pass) {
      throw new Error('Please enter both email address and password.');
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const profile = await this.getUserProfile(cred.user.uid, cred.user.email || cleanEmail);
      
      // Audit log of successful login
      try {
        await auditService.log(
          'USER_LOGIN_SUCCESS',
          'USER',
          profile.id,
          { id: profile.id, name: profile.displayName, role: profile.role },
          `User ${profile.displayName} (${profile.email}) logged in with verified role [${profile.role}].`
        );
      } catch {
        // Non-blocking audit log
      }

      return profile;
    } catch (err: any) {
      const code = err.code || '';
      
      // Auto-provision canonical demo accounts if not yet registered in Firebase Auth
      const normalized = cleanEmail.toLowerCase();
      if ((code === 'auth/user-not-found' || code === 'auth/invalid-credential') && CANONICAL_DEMO_ACCOUNTS[normalized]) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
          const demoInfo = CANONICAL_DEMO_ACCOUNTS[normalized];
          if (demoInfo.displayName) {
            await updateProfile(cred.user, { displayName: demoInfo.displayName });
          }
          const profile = await this.getUserProfile(cred.user.uid, cleanEmail);
          return profile;
        } catch (provisionErr: any) {
          console.warn('Auto-provisioning demo account failed:', provisionErr);
        }
      }

      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        throw new Error('Invalid email address or password. Please verify your credentials.');
      } else if (code === 'auth/too-many-requests') {
        throw new Error('Access temporarily blocked due to multiple failed login attempts. Please reset your password or try again later.');
      } else if (code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else if (code === 'auth/user-disabled') {
        throw new Error('This user account has been disabled. Please contact the administrator.');
      }
      throw new Error(err.message || 'Login failed. Please verify credentials.');
    }
  },

  /**
   * Genuine user registration with Firebase Authentication
   */
  async register(
    email: string, 
    pass: string, 
    displayName: string, 
    requestedRole: UserRole = 'guardian',
    extraDetails?: Partial<UserProfile>
  ): Promise<UserProfile> {
    const cleanEmail = email.trim();
    if (!cleanEmail) throw new Error('Email address is required.');
    if (!pass || pass.length < 6) throw new Error('Password must be at least 6 characters.');
    if (!displayName || !displayName.trim()) throw new Error('Full name is required.');

    // Public registration only permits 'guardian' or 'student'
    // Privileged roles ('claims_officer', 'university', 'admin') CANNOT be self-selected
    const safeRole: UserRole = (requestedRole === 'student') ? 'student' : 'guardian';

    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      await updateProfile(cred.user, { displayName: displayName.trim() });

      const newProfile: UserProfile = {
        id: cred.user.uid,
        uid: cred.user.uid,
        email: cleanEmail,
        displayName: displayName.trim(),
        role: safeRole,
        universityId: extraDetails?.universityId,
        phoneNumber: extraDetails?.phoneNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'users', cred.user.uid), newProfile);
      } catch (dbErr) {
        console.warn('Error saving user profile to Firestore:', dbErr);
      }

      try {
        await auditService.log(
          'USER_REGISTRATION',
          'USER',
          newProfile.id,
          { id: newProfile.id, name: newProfile.displayName, role: newProfile.role },
          `New user registered: ${newProfile.displayName} (${newProfile.email}) with role [${newProfile.role}].`
        );
      } catch {
        // Non-blocking
      }

      return newProfile;
    } catch (err: any) {
      const code = err.code || '';
      if (code === 'auth/email-already-in-use') {
        throw new Error('An account with this email address already exists. Please sign in or use password reset.');
      } else if (code === 'auth/weak-password') {
        throw new Error('The password is too weak. Please use at least 6 characters with mixed numbers and symbols.');
      } else if (code === 'auth/invalid-email') {
        throw new Error('Please provide a valid email address.');
      }
      throw new Error(err.message || 'Registration failed.');
    }
  },

  /**
   * Password reset via Firebase Authentication
   */
  async sendPasswordReset(email: string): Promise<void> {
    const cleanEmail = email.trim();
    if (!cleanEmail) throw new Error('Please enter your email address to reset password.');
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
    } catch (err: any) {
      const code = err.code || '';
      if (code === 'auth/user-not-found') {
        throw new Error('No registered account was found with that email address.');
      } else if (code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      }
      throw new Error(err.message || 'Password reset request failed.');
    }
  },

  /**
   * Genuine sign out from Firebase Authentication
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Sign out warning:', err);
    }
    // Clean up local session keys
    if (typeof window !== 'undefined') {
      localStorage.removeItem('edushield_active_user');
      localStorage.removeItem('edushield_current_active_role');
    }
  }
};
