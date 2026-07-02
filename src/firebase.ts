import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache, getFirestore } from "firebase/firestore";

// Import the functions you need from the SDKs you need

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA3WaidSotTtX2ZOseCDRL_LsYLWFsHWz0",
  authDomain: "naknak-543dd.firebaseapp.com",
  projectId: "naknak-543dd",
  storageBucket: "naknak-543dd.firebasestorage.app",
  messagingSenderId: "41856255174",
  appId: "1:41856255174:web:1fca7937a5991bc2fe43c7",
  measurementId: "G-JPB03MWPNZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);




// Initialize Firestore with custom database ID and offline persistent cache with memory fallback to avoid BloomFilter/IndexedDB errors in iframe sandbox environments
let dbInstance;
try {
dbInstance = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  experimentalForceLongPolling: true
});
} catch (error) {
  console.warn("Persistent cache initialization failed, falling back to memory cache:", error);
  try {
dbInstance = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  experimentalForceLongPolling: true
});
  } catch (innerError) {
    console.error("Firestore memory cache initialization also failed:", innerError);
    dbInstance = getFirestore(app);
  }
}

export const db = dbInstance;

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
