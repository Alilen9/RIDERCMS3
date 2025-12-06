import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// IMPORTANT: Replace with your actual config from the Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyBw1OvbGUrwcJMUM7DI__maceCZMjMYf9I",
  authDomain: "ridercms-ced94.firebaseapp.com",
  databaseURL: "https://ridercms-ced94-default-rtdb.firebaseio.com",
  projectId: "ridercms-ced94",
  storageBucket: "ridercms-ced94.firebasestorage.app",
  messagingSenderId: "194585815067",
  appId: "1:194585815067:web:297f2ecef3c7018ca670be",
  measurementId: "G-0QQNJBS2WK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the auth instance to be used in other parts of the app
export const auth = getAuth(app);

// This is used for phone authentication
export const RECAPTCHA_CONTAINER_ID = '6LdPVSMsAAAAAJxGBy0C4NfY05CjfhNQ6tp4h-el';

