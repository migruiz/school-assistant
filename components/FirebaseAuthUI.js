// components/FirebaseAuthUI.js
'use client'
import { useEffect, useRef } from 'react';
import firebase from '../lib/firebase';

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
                    {
                        provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
                        recaptchaParameters: {
                            type: 'image', // 'audio'
                            size: 'normal', // 'invisible' or 'compact'
                            badge: 'bottomleft' //' bottomright' or 'inline' applies to invisible.
                        },
                        defaultCountry: 'IE', 
                        // You can also pass the full phone number string instead of the
                        // 'defaultCountry' and 'defaultNationalNumber'. However, in this case,
                        // the first country ID that matches the country code will be used to
                        // populate the country selector. So for countries that share the same
                        // country code, the selected country may not be the expected one.
                        // In that case, pass the 'defaultCountry' instead to ensure the exact
                        // country is selected. The 'defaultCountry' and 'defaultNationaNumber'
                        // will always have higher priority than 'loginHint' which will be ignored
                        // in their favor. In this case, the default country will be 'GB' even
                        // though 'loginHint' specified the country code as '+1'.
                        loginHint: '894108085'
                    }
                ],
                signInSuccessUrl: '/', // Redirect after login
            });
        });
    }, []);

    return <div ref={uiRef}></div>;
}
