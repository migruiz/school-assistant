'use client';
import dynamic from 'next/dynamic';

const FirebaseAuthUI = dynamic(() => import('../../components/FirebaseAuthUI'), {
  ssr: false // Disable SSR for this component
});

export default function Login() {
  return (
    <div>
      <h1>Login</h1>
      <FirebaseAuthUI />
    </div>
  );
}
