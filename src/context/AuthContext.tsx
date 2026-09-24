import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, UserRole, VerificationStatus } from '../types';
import { firebaseAuthService } from '../services/firebaseAuthService';
import { firestoreService } from '../services/firestoreService';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: any) => Promise<{ user: User; message: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isVerified: boolean;
  role: UserRole | null;
  verificationStatus: VerificationStatus | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Subscribe to Firebase Authentication state
  useEffect(() => {
    const unsubscribe = firebaseAuthService.onAuthStateChange((currentUser, isLoading) => {
      setUser(currentUser);
      setLoading(isLoading);
    });
    return () => unsubscribe();
  }, []);

  const refreshUser = useCallback(async () => {
    const currentFbUser = auth.currentUser;
    if (!currentFbUser) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const u = await firestoreService.getUser(currentFbUser.uid);
      if (u && currentFbUser.email?.toLowerCase() === 'anushri.pb.cse.2025@snsct.org') {
        u.role = 'admin';
        u.verificationStatus = 'verified';
      }
      setUser(u);
    } catch (err) {
      console.warn('Failed to refresh Firestore user profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const loggedInUser = await firebaseAuthService.login(email, password);
      if (email.toLowerCase() === 'anushri.pb.cse.2025@snsct.org') {
        loggedInUser.role = 'admin';
        loggedInUser.verificationStatus = 'verified';
      }
      setUser(loggedInUser);
      return loggedInUser;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: any): Promise<{ user: User; message: string }> => {
    setLoading(true);
    try {
      const res = await firebaseAuthService.register(payload);
      setUser(res.user);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await firebaseAuthService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Synchronize initial root admin state in Firestore and ensure role elevation
  const effectiveUser = useMemo(() => {
    if (!user) return null;
    const isRootAdmin = 
      user.role === 'admin' ||
      user.email?.trim().toLowerCase() === 'anushri.pb.cse.2025@snsct.org' ||
      auth.currentUser?.email?.trim().toLowerCase() === 'anushri.pb.cse.2025@snsct.org';
    if (isRootAdmin) {
      return {
        ...user,
        role: 'admin' as UserRole,
        verificationStatus: 'verified' as VerificationStatus
      };
    }
    return user;
  }, [user]);

  useEffect(() => {
    const currentFbUser = auth.currentUser;
    const isOwner = 
      user?.role === 'admin' ||
      user?.email?.trim().toLowerCase() === 'anushri.pb.cse.2025@snsct.org' || 
      currentFbUser?.email?.trim().toLowerCase() === 'anushri.pb.cse.2025@snsct.org';

    if (user && isOwner) {
      if (user.role !== 'admin' || user.verificationStatus !== 'verified') {
        firestoreService.updateUser(user.id, {
          role: 'admin',
          verificationStatus: 'verified'
        }).catch(err => console.warn('Firestore user admin sync warning:', err));
      }
      const bootstrapRef = doc(db, 'system', 'bootstrap');
      getDoc(bootstrapRef).then(snap => {
        if (!snap.exists()) {
          setDoc(bootstrapRef, {
            adminUid: user.id,
            adminEmail: user.email || currentFbUser?.email || '',
            claimedAt: new Date().toISOString()
          }).catch(() => {});
        } else {
          const bData = snap.data();
          if (bData.adminUid !== user.id && (bData.adminEmail?.toLowerCase() === 'anushri.pb.cse.2025@snsct.org' || user.email?.toLowerCase() === 'anushri.pb.cse.2025@snsct.org')) {
            setDoc(bootstrapRef, { adminUid: user.id }, { merge: true }).catch(() => {});
          }
        }
      }).catch(() => {});
    }
  }, [user]);

  const isVerified = effectiveUser?.verificationStatus === 'verified';
  const role = effectiveUser?.role || null;
  const verificationStatus = effectiveUser?.verificationStatus || null;

  return (
    <AuthContext.Provider
      value={{
        user: effectiveUser,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!effectiveUser,
        isVerified,
        role,
        verificationStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
