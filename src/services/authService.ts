import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendPasswordResetEmail,
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile, UserRole, AccountStatus } from '../models/insurance';
import { DEMO_USERS } from '../utils/seedData';
import { UsersRepo } from '../repositories/firestoreRepo';
import { auditService } from './auditService';

export const CANONICAL_DEMO_ACCOUNTS: { [email: string]: Partial<UserProfile> } = {
  'guardian@edushield.demo': {
    displayName: 'Rajesh Sharma',
    role: 'guardian',
    accountStatus: 'APPROVED',
    phoneNumber: '+91 98112 34567'
  },
  'student@edushield.demo': {
    displayName: 'Aarav Sharma',
    role: 'student',
    accountStatus: 'APPROVED',
    phoneNumber: '+91 98112 34568'
  },
  'officer@edushield.demo': {
    displayName: 'Vikram Mehta (Senior Claims Adjuster)',
    role: 'claims_officer',
    accountStatus: 'APPROVED',
    phoneNumber: '+91 97110 55432'
  },
  // Dedicated University Registrar Accounts (5 Institutions)
  'registrar.iitd@edushield.demo': {
    displayName: 'Dr. Sunita Deshmukh (IIT Delhi Registrar)',
    role: 'university',
    accountStatus: 'APPROVED',
    universityId: 'univ_iitd',
    phoneNumber: '+91 11 2659 7000'
  },
  'university@edushield.demo': {
    displayName: 'Dr. Sunita Deshmukh (IIT Delhi Registrar)',
    role: 'university',
    accountStatus: 'APPROVED',
    universityId: 'univ_iitd',
    phoneNumber: '+91 11 2659 7000'
  },
  'registrar.bits@edushield.demo': {
    displayName: 'Prof. Chandrashekhar Rao (BITS Hyderabad Registrar)',
    role: 'university',
    accountStatus: 'APPROVED',
    universityId: 'univ_bits',
    phoneNumber: '+91 40 6630 3999'
  },
  'registrar.nitt@edushield.demo': {
    displayName: 'Dr. K. Balasubramanian (NIT Trichy Registrar)',
    role: 'university',
    accountStatus: 'APPROVED',
    universityId: 'univ_nitt',
    phoneNumber: '+91 431 2503000'
  },
  'registrar.du@edushield.demo': {
    displayName: 'Dr. Vikas Gupta (University of Delhi Registrar)',
    role: 'university',
    accountStatus: 'APPROVED',
    universityId: 'univ_du',
    phoneNumber: '+91 11 2766 7011'
  },
  'registrar.reva@edushield.demo': {
    displayName: 'Dr. N. Ramesh (REVA University Registrar)',
    role: 'university',
    accountStatus: 'APPROVED',
    universityId: 'univ_reva',
    phoneNumber: '+91 80 4696 6966'
  },
  'admin@edushield.demo': {
    displayName: 'Priya Nambiar (System Administrator)',
    role: 'admin',
    accountStatus: 'APPROVED',
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
        // Fallback minimal authenticated profile with pending verification (Strictly no auto-granted role)
        callback({
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Authenticated User',
          role: null,
          accountStatus: 'PENDING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });
  },

  /**
   * Fetch user profile from Firestore /users/{uid} with fallback to UsersRepo
   */
  async getUserProfile(uid: string, email: string = ''): Promise<UserProfile> {
    const normalizedEmail = email.toLowerCase().trim();
    const demoConfig = CANONICAL_DEMO_ACCOUNTS[normalizedEmail];

    try {
      const userDocRef = doc(db, 'users', uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        let needsUpdate = false;

        // Ensure accountStatus is defined
        if (!data.accountStatus) {
          data.accountStatus = data.role ? 'APPROVED' : 'PENDING';
          needsUpdate = true;
        }

        // Sync canonical role and university mapping if demo user
        if (demoConfig) {
          if (demoConfig.universityId && data.universityId !== demoConfig.universityId) {
            data.universityId = demoConfig.universityId;
            needsUpdate = true;
          }
          if (demoConfig.role && data.role !== demoConfig.role) {
            data.role = demoConfig.role;
            needsUpdate = true;
          }
          if (data.accountStatus !== 'APPROVED') {
            data.accountStatus = 'APPROVED';
            needsUpdate = true;
          }
        }

        if (needsUpdate && demoConfig) {
          try {
            await updateDoc(userDocRef, {
              ...(data.universityId ? { universityId: data.universityId } : {}),
              role: data.role,
              accountStatus: data.accountStatus,
              updatedAt: new Date().toISOString()
            });
          } catch (syncErr) {
            console.warn('Error syncing canonical demo user profile fields:', syncErr);
          }
        }

        // Cache in UsersRepo
        try {
          await UsersRepo.create({ ...data, id: uid, uid });
        } catch {
          // Non-blocking
        }

        return data;
      }
    } catch (err) {
      console.warn('Firestore getUserProfile read warning:', err);
    }

    // Check if an existing profile exists in Firestore by email query
    try {
      if (normalizedEmail) {
        const usersCol = collection(db, 'users');
        const q = query(usersCol, where('email', '==', normalizedEmail));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          const matchedDoc = qSnap.docs[0];
          const matchedData = matchedDoc.data() as UserProfile;
          const status = matchedData.accountStatus || (matchedData.role ? 'APPROVED' : 'PENDING');
          const canonicalProfile: UserProfile = {
            ...matchedData,
            id: uid,
            uid,
            accountStatus: status,
            updatedAt: new Date().toISOString()
          };
          await UsersRepo.create(canonicalProfile);
          try {
            await setDoc(doc(db, 'users', uid), canonicalProfile, { merge: true });
          } catch (setErr) {
            console.warn('Could not persist linked profile to Firestore:', setErr);
          }
          return canonicalProfile;
        }
      }
    } catch (queryErr) {
      console.warn('Firestore query by email warning in getUserProfile:', queryErr);
    }

    // Check if an existing profile exists in UsersRepo matching email or uid (e.g. seeded demo user or admin pre-provisioned/approved)
    try {
      const cachedUsers = await UsersRepo.getAll();
      const existingByEmailOrUid = cachedUsers.find(
        u => (u.email && u.email.toLowerCase().trim() === normalizedEmail) || u.id === uid || u.uid === uid
      );
      if (existingByEmailOrUid) {
        const existingStatus = existingByEmailOrUid.accountStatus || (existingByEmailOrUid.role ? 'APPROVED' : 'PENDING');
        const linkedProfile: UserProfile = {
          ...existingByEmailOrUid,
          id: uid,
          uid,
          accountStatus: existingStatus,
          role: existingByEmailOrUid.role ?? null,
          updatedAt: new Date().toISOString()
        };
        await UsersRepo.create(linkedProfile);
        try {
          await setDoc(doc(db, 'users', uid), linkedProfile, { merge: true });
        } catch (setErr) {
          console.warn('Could not persist linked profile to Firestore:', setErr);
        }
        return linkedProfile;
      }
    } catch (cacheErr) {
      console.warn('UsersRepo check warning in getUserProfile:', cacheErr);
    }

    // Canonical demo accounts mapping
    if (demoConfig) {
      const demoProfile: UserProfile = {
        id: uid,
        uid,
        email,
        displayName: demoConfig.displayName || (email ? email.split('@')[0] : 'EduShield User'),
        role: demoConfig.role || null,
        accountStatus: 'APPROVED',
        universityId: demoConfig.universityId,
        phoneNumber: demoConfig.phoneNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await UsersRepo.create(demoProfile);
      try {
        await setDoc(doc(db, 'users', uid), demoProfile, { merge: true });
      } catch (writeErr) {
        console.warn('Firestore getUserProfile demo write warning:', writeErr);
      }
      return demoProfile;
    }

    // PRIORITY 1 & RULE 2/3: Login must NEVER recreate or reset an existing profile in Firestore.
    // Truly new accounts without any profile anywhere return an in-memory pending applicant object.
    // We intentionally DO NOT call setDoc or UsersRepo.create with pendingProfile during login.
    return {
      id: uid,
      uid,
      email,
      displayName: email ? email.split('@')[0] : 'EduShield Applicant',
      role: null,
      accountStatus: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
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
          `User ${profile.displayName} (${profile.email}) logged in with status [${profile.accountStatus || 'APPROVED'}] and role [${profile.role || 'PENDING'}].`
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

    // Public registration assigns safe role ('guardian' or 'student') with accountStatus: 'PENDING'
    // Users cannot self-promote to privileged roles or approve their own accounts.
    // Privileged roles ('claims_officer', 'university', 'admin') or active access require administrator approval.
    const safeRole: UserRole = (requestedRole === 'student') ? 'student' : 'guardian';

    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      await updateProfile(cred.user, { displayName: displayName.trim() });

      // Check if an existing profile was pre-approved or pre-provisioned by an administrator
      let existingProfile: UserProfile | null = null;
      try {
        const userDocRef = doc(db, 'users', cred.user.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          existingProfile = snap.data() as UserProfile;
        } else {
          const cachedUsers = await UsersRepo.getAll();
          const match = cachedUsers.find(
            u => u.email && u.email.toLowerCase().trim() === cleanEmail.toLowerCase()
          );
          if (match) existingProfile = match;
        }
      } catch (checkErr) {
        console.warn('Pre-check for existing user profile in register:', checkErr);
      }

      // If already pre-approved by administrator, preserve that status and role.
      // Otherwise, newly registered accounts enter the pending verification queue with accountStatus: 'PENDING'.
      const initialStatus: AccountStatus = existingProfile?.accountStatus || 'PENDING';
      const initialRole: UserRole = existingProfile?.role || safeRole;

      const newProfile: UserProfile = {
        id: cred.user.uid,
        uid: cred.user.uid,
        email: cleanEmail,
        displayName: displayName.trim(),
        role: initialRole,
        accountStatus: initialStatus,
        universityId: extraDetails?.universityId || existingProfile?.universityId,
        phoneNumber: extraDetails?.phoneNumber || existingProfile?.phoneNumber,
        createdAt: existingProfile?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Sanitize fields for Firestore to eliminate undefined properties
      const sanitizedDoc: any = {};
      for (const [k, v] of Object.entries(newProfile)) {
        if (v !== undefined) {
          sanitizedDoc[k] = v;
        }
      }
      if (!sanitizedDoc.universityId) {
        sanitizedDoc.universityId = null;
      }

      await UsersRepo.create(newProfile);
      try {
        await setDoc(doc(db, 'users', cred.user.uid), sanitizedDoc, { merge: true });
      } catch (dbErr) {
        console.warn('Error saving user profile to Firestore:', dbErr);
      }

      try {
        await auditService.log(
          'USER_REGISTRATION',
          'USER',
          newProfile.id,
          { id: newProfile.id, name: newProfile.displayName, role: newProfile.role },
          `New user registered: ${newProfile.displayName} (${newProfile.email}) with status [${newProfile.accountStatus}] and role [${newProfile.role || 'PENDING'}].`
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
