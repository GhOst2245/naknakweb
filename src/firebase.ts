import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCA9s1Qs18oCtK8eHX4ktyNxa3IejzHZ1o",
  authDomain: "handy-attic-gzp7b.firebaseapp.com",
  projectId: "handy-attic-gzp7b",
  storageBucket: "handy-attic-gzp7b.firebasestorage.app",
  messagingSenderId: "561914441097",
  appId: "1:561914441097:web:86f71f061bb1681a83c558"
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
  }, "ai-studio-nakliyepazaryeri-65b7d6e2-65ae-481a-bddd-10e46147ddf7");
} catch (error) {
  console.warn("Persistent cache initialization failed, falling back to memory cache:", error);
  try {
    dbInstance = initializeFirestore(app, {
      localCache: memoryLocalCache(),
      experimentalForceLongPolling: true
    }, "ai-studio-nakliyepazaryeri-65b7d6e2-65ae-481a-bddd-10e46147ddf7");
  } catch (innerError) {
    console.error("Firestore memory cache initialization also failed:", innerError);
    dbInstance = getFirestore(app, "ai-studio-nakliyepazaryeri-65b7d6e2-65ae-481a-bddd-10e46147ddf7");
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
