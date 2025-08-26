// components/FirebaseAuthUI.js
import { useEffect, useRef } from 'react';
import { auth } from '../lib/firebase';

// FirebaseUI and its CSS must only be loaded on the client
import 'firebaseui/dist/firebaseui.css';

export default function FirebaseAuthUI() {
  const uiRef = useRef(null);

  useEffect(() => {
    // Dynamically import FirebaseUI to avoid SSR issues
    import('firebaseui').then(firebaseui => {
      const ui =
        firebaseui.auth.AuthUI.getInstance() ||
        new firebaseui.auth.AuthUI(auth);

      ui.start(uiRef.current, {
        signInOptions: [
          // Add your desired providers
          {
            provider: 'google.com', // Google
          },
          {
            provider: 'password', // Email/Password
          }
        ],
        signInSuccessUrl: '/', // Redirect after login
      });
    });
  }, []);

  return <div ref={uiRef}></div>;
}
