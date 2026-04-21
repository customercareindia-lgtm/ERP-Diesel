import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { ERPUser } from './types/erp';

interface AuthContextType {
  user: User | null;
  erpUser: ERPUser | null;
  loading: boolean;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  erpUser: null,
  loading: true,
  isAuthReady: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [erpUser, setErpUser] = useState<ERPUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // MOCK USER for "No Login" mode
  const mockErpUser: ERPUser = {
    id: 'demo-user',
    email: 'demo@lubrierp.pro',
    name: 'Demo Administrator',
    role: 'super_admin',
    tenantId: 'system_root',
    active: true
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const unsubProfile = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            setErpUser({ id: snapshot.id, ...snapshot.data() } as ERPUser);
          } else {
            setErpUser(mockErpUser);
          }
          setLoading(false);
          setIsAuthReady(true);
        }, (error) => {
          console.error("Auth profile error:", error);
          setErpUser(mockErpUser); // Fallback to mock on permission error
          setLoading(false);
          setIsAuthReady(true);
        });

        return () => unsubProfile();
      } else {
        // No login - automatically set as mock super admin
        setErpUser(mockErpUser);
        setLoading(false);
        setIsAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, erpUser, loading, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
