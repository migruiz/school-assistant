"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import 'firebase/compat/auth';
import { useRouter } from 'next/navigation';

import firebase from '../lib/firebase';

const AuthContext = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        router.push('/login');
        return;
      }

      try {
        // Get fresh ID token for backend validation
        const idToken = await firebaseUser.getIdToken(true);

        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
        });

        const { valid } = await res.json();

        if (!valid) {
          // Delete user if backend says invalid
          await firebaseUser.delete().catch(() => {});
          await firebase.auth().signOut();
          setUser(null);
          console.log('User deleted');
          router.push('/login');
        } else {
          setUser(firebaseUser); // valid user
        }
      } catch (err) {
        console.error('Auth validation failed', err);
        await firebaseUser.delete().catch(() => {});
        await firebase.auth().signOut();
        setUser(null);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
