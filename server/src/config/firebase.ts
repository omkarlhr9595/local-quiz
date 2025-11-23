import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  // Check if Firebase is already initialized
  if (getApps().length > 0) {
    return {
      db: getFirestore(),
      storage: getStorage(),
    };
  }

  // Get credentials from environment variables
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!privateKey || !clientEmail || !projectId) {
    throw new Error(
      "Missing Firebase credentials. Please check your .env file."
    );
  }

  // Initialize Firebase Admin
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });

  const db = getFirestore();
  const storage = getStorage();

  console.log("✅ Firebase Admin initialized successfully");

  return { db, storage };
};

// Lazy initialization - only initialize when accessed
let _db: ReturnType<typeof getFirestore> | null = null;
let _storage: ReturnType<typeof getStorage> | null = null;

const getDb = (): ReturnType<typeof getFirestore> => {
  if (!_db) {
    const result = initializeFirebase();
    _db = result.db;
    _storage = result.storage;
  }
  return _db;
};

const getStorageInstance = (): ReturnType<typeof getStorage> => {
  if (!_storage) {
    const result = initializeFirebase();
    _db = result.db;
    _storage = result.storage;
  }
  return _storage;
};

// Export as objects that proxy to the actual instances
export const db = new Proxy({} as ReturnType<typeof getFirestore>, {
  get(_target, prop) {
    const instance = getDb();
    const value = (instance as any)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export const storage = new Proxy({} as ReturnType<typeof getStorage>, {
  get(_target, prop) {
    const instance = getStorageInstance();
    const value = (instance as any)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

