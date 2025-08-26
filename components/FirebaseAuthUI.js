// components/FirebaseAuthUI.js
'use client'
import { useEffect, useRef } from 'react';
import firebase  from '../lib/firebase';

// FirebaseUI and its CSS must only be loaded on the client
import 'firebaseui/dist/firebaseui.css';

export default function FirebaseAuthUI() {
    const uiRef = useRef(null);

  useEffect(() => {
    import('firebaseui').then(firebaseui => {
      // Use the auth instance from firebase/auth (v9 modular)
      const ui =
        firebaseui.auth.AuthUI.getInstance() ||
        new firebaseui.auth.AuthUI(firebase.auth()); // <-- compat style

      ui.start(uiRef.current, {
        signInOptions: [
          'phone',         // Phone auth
          'google.com'
        ],
        signInSuccessUrl: '/', // Redirect after login
      });
    });
  }, []);

  return <div ref={uiRef}></div>;
}
