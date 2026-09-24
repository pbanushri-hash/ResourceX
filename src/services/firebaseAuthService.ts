import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { firestoreService } from './firestoreService';
import { User, UserRole, Business, BusinessVerification } from '../types';

export const firebaseAuthService = {
  /**
   * Register a new user with Firebase Authentication and initialize their
   * profile, business entity record, and compliance verification in Firestore.
   */
  async register(payload: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    companyName: string;
    businessType: string;
    registrationNumber: string;
    gstNumber: string;
    address: string;
    city: string;
    state: string;
    country: string;
    role: UserRole;
    adminPasscode?: string;
    documentName?: string;
    documentDataUrl?: string;
  }): Promise<{ user: User; message: string }> {
    // If attempting to register with Admin intent, validate authorization via server-side check
    if (payload.role === 'admin') {
      try {
        const verifyRes = await fetch('/api/admin/verify-passcode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passcode: payload.adminPasscode || '' })
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) {
          throw new Error(verifyData.error || 'Admin authorization failed. Platform Administrator accounts must be provisioned via Firebase Console.');
        }
      } catch (err: any) {
        throw new Error(err.message || 'Administrator registration is restricted. To assign the Admin role, register a standard account and update role to "admin" in Firebase Console.');
      }
    }

    // 1. Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      payload.email,
      payload.password
    );
    const fbUser = userCredential.user;
    const uid = fbUser.uid;

    const businessId = `biz_${uid}`;
    const verificationId = `verif_${uid}_${Date.now()}`;
    const now = new Date().toISOString();

    // 2. Prepare structured User model
    const newUser: User = {
      id: uid,
      name: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      role: payload.role,
      businessId,
      companyName: payload.companyName,
      businessType: payload.businessType,
      registrationNumber: payload.registrationNumber,
      gstNumber: payload.gstNumber,
      address: payload.address,
      city: payload.city,
      state: payload.state,
      country: payload.country,
      verificationStatus: payload.role === 'admin' ? 'verified' : 'pending',
      createdAt: now
    };

    // 3. Prepare corporate Business entity
    const newBusiness: Business = {
      id: businessId,
      userId: uid,
      companyName: payload.companyName,
      businessType: payload.businessType,
      registrationNumber: payload.registrationNumber,
      gstNumber: payload.gstNumber,
      address: payload.address,
      city: payload.city,
      state: payload.state,
      country: payload.country,
      verificationStatus: payload.role === 'admin' ? 'verified' : 'pending',
      verificationDocName: payload.documentName || 'Incorporation_Certificate.pdf',
      createdAt: now
    };

    // 4. Prepare Regulatory Compliance Verification submission
    const verificationReq: BusinessVerification = {
      id: verificationId,
      businessId,
      userId: uid,
      userRole: payload.role,
      userEmail: payload.email,
      userName: payload.fullName,
      companyName: payload.companyName,
      businessType: payload.businessType,
      registrationNumber: payload.registrationNumber,
      gstNumber: payload.gstNumber,
      address: payload.address,
      city: payload.city,
      state: payload.state,
      country: payload.country,
      documentName: payload.documentName || 'Incorporation_Certificate.pdf',
      documentUrl: payload.documentDataUrl || '',
      status: payload.role === 'admin' ? 'verified' : 'pending',
      submittedAt: now
    };

    // 5. Store atomically into Firestore collections
    await firestoreService.createUser(newUser);
    await firestoreService.createBusiness(newBusiness);
    await firestoreService.createVerification(verificationReq);

    // 6. Send welcoming system notification
    await firestoreService.createNotification({
      id: `notif_${Date.now()}_welcome`,
      userId: uid,
      title: 'Welcome to ResourceX Network',
      message: payload.role === 'admin'
        ? 'Your Administrator command center account has been provisioned and authorized.'
        : `Your corporate account for ${payload.companyName} has been initialized. Compliance verification is currently pending review.`,
      type: 'system',
      read: false,
      createdAt: now,
      link: payload.role === 'admin' ? '/admin/dashboard' : '/profile'
    });

    return {
      user: newUser,
      message: payload.role === 'admin'
        ? 'Admin account created and authorized.'
        : 'Enterprise entity registered. Verification audit submitted for compliance clearance.'
    };
  },

  /**
   * Log in an existing user with Firebase Authentication and retrieve their
   * profile from Firestore.
   */
  async login(email: string, password: string): Promise<User> {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    const userDoc = await firestoreService.getUser(uid);
    if (!userDoc) {
      throw new Error('User profile record not found in Firestore. Please contact support.');
    }
    return userDoc;
  },

  /**
   * Sign out the active session.
   */
  async logout(): Promise<void> {
    await signOut(auth);
  },

  /**
   * Watch auth state changes from Firebase Auth and subscribe in realtime
   * to Firestore profile changes (verification status, role).
   */
  onAuthStateChange(callback: (user: User | null, loading: boolean) => void) {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (!fbUser) {
        callback(null, false);
        return;
      }

      // Initial fast load
      try {
        let initialUser = await firestoreService.getUser(fbUser.uid);

        // Auto-authorize root administrator for authorized owner
        if (fbUser.email?.toLowerCase() === 'anushri.pb.cse.2025@snsct.org') {
          try {
            const bootstrapRef = doc(db, 'system', 'bootstrap');
            const bSnap = await getDoc(bootstrapRef);
            if (!bSnap.exists()) {
              await setDoc(bootstrapRef, {
                adminUid: fbUser.uid,
                adminEmail: fbUser.email,
                claimedAt: new Date().toISOString()
              });
            }

            const userRef = doc(db, 'users', fbUser.uid);
            if (initialUser) {
              if (initialUser.role !== 'admin' || initialUser.verificationStatus !== 'verified') {
                await updateDoc(userRef, {
                  role: 'admin',
                  verificationStatus: 'verified'
                });
              }
              initialUser = {
                ...initialUser,
                role: 'admin',
                verificationStatus: 'verified'
              };
            } else {
              const newAdminDoc: User = {
                id: fbUser.uid,
                email: fbUser.email || 'anushri.pb.cse.2025@snsct.org',
                name: fbUser.displayName || 'Administrator',
                phone: fbUser.phoneNumber || '+91 98765 43210',
                businessId: `biz_${fbUser.uid}`,
                companyName: 'ResourceX Platform Governance',
                businessType: 'Enterprise Platform Authority',
                registrationNumber: 'GOV-IN-ROOT-001',
                gstNumber: '33AAAAA0000A1Z5',
                address: 'Technology Governance Directorate',
                city: 'Coimbatore',
                state: 'Tamil Nadu',
                country: 'India',
                role: 'admin',
                verificationStatus: 'verified',
                createdAt: new Date().toISOString()
              };
              await setDoc(userRef, newAdminDoc);
              initialUser = newAdminDoc;
            }
          } catch (initErr) {
            console.warn('Admin governance bootstrap sync:', initErr);
            if (initialUser) {
              initialUser = {
                ...initialUser,
                role: 'admin',
                verificationStatus: 'verified'
              };
            }
          }
        }

        callback(initialUser, false);
      } catch (err) {
        console.error('Failed to load user from Firestore:', err);
      }

      // Realtime Firestore snapshot listener for instantaneous verification updates
      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        unsubscribeDoc = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data() as User;
            if (fbUser.email?.toLowerCase() === 'anushri.pb.cse.2025@snsct.org') {
              data.role = 'admin';
              data.verificationStatus = 'verified';
            }
            callback(data, false);
          }
        }, (err) => {
          console.warn('Realtime user profile listener warning:', err);
        });
      } catch (err) {
        console.warn('Could not establish user doc snapshot listener:', err);
      }
    });

    return () => {
      if (unsubscribeDoc) unsubscribeDoc();
      unsubscribeAuth();
    };
  }
};
