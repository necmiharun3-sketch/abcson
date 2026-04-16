import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import firebaseAppletConfigImport from '../firebase-applet-config.json';

// Handle potential differences in how JSON is imported
const firebaseAppletConfig = (firebaseAppletConfigImport as any).default || firebaseAppletConfigImport;

const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: firebaseAppletConfig.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseAppletConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: firebaseAppletConfig.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseAppletConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseAppletConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: firebaseAppletConfig.measurementId || import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const missingFirebaseEnvKeys: string[] = [];

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Initialize Firestore with the specific database ID if provided and not default
// Use experimentalForceLongPolling to improve connectivity in sandboxed/iframe environments
const dbId = firebaseAppletConfig.firestoreDatabaseId;
const firestoreDb = initializeFirestore(app, {}, (dbId && dbId !== '(default)') ? dbId : undefined);

export const db = firestoreDb;
export const storage = getStorage(app);
export const functions = getFunctions(app, 'europe-west1');

if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099');
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
}

// Test connection as per guidelines
async function testConnection() {
  try {
    // We use a dummy path to test connectivity
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log("Firestore connection successful.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline. Using fallback if possible.");
    } else {
      console.log("Firestore connection test completed (may have permission error, which is fine).");
    }
  }
}
void testConnection();
