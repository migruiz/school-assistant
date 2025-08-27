import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBOaLyUZV3uzuHtYv77e_ri4youhdxxxHI",
  authDomain: "school-assistant-469921.firebaseapp.com",
  projectId: "school-assistant-469921",
  storageBucket: "school-assistant-469921.appspot.com",
  appId: "1:564895268744:web:22642b5e06c8958ac4443d"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export default firebase;