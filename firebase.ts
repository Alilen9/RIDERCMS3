import { initializeApp } from 'firebase/app';
import { getAuth, inMemoryPersistence, setPersistence } from 'firebase/auth';

// Your web app's Firebase configuration
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

// Get Auth instance
const auth = getAuth(app);

// By default, Firebase uses 'local' persistence (IndexedDB), which is what we want.
// This will keep the user signed in across browser sessions.
// No special `setPersistence` call is needed.

// This ID is used by the Auth component to mount the invisible reCAPTCHA
export const RECAPTCHA_CONTAINER_ID = 'recaptcha-container';

// Export the configured auth instance
export { auth };
