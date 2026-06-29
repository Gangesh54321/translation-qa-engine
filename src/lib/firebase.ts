import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword as fbSignInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Check if firebase is configured with minimal required settings
export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);

export const app = isFirebaseConfigured 
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

// Initialize analytics safely (only in supported browser environments)
export let analytics: any = null;
if (app) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
      console.log("[Firebase] Analytics initialized successfully");
    }
  });
}

export const saveUserSession = async (appId: string, user: any, customDisplayName?: string) => {
  if (!db) return;
  const userRef = doc(db, 'apps', appId, 'users', user.uid);
  const dataToSave: any = {
    uid: user.uid,
    displayName: customDisplayName || user.displayName || '',
    email: user.email || '',
    photoURL: user.photoURL || '',
    lastLogin: serverTimestamp(),
  };
  
  // If the user object has credits, persist them
  if (typeof user.credits === 'number') {
    dataToSave.credits = user.credits;
  }
  
  await setDoc(userRef, dataToSave, { merge: true });
};

export const updateUserCredits = async (appId: string, userId: string, credits: number) => {
  if (!db) return;
  const userRef = doc(db, 'apps', appId, 'users', userId);
  await setDoc(userRef, {
    credits: credits,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  console.log(`[Firebase] Synced ${credits} credits to Firestore for user: ${userId}`);
};

export const logPaymentTransaction = async (
  appId: string,
  userId: string,
  paymentDetails: {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
    amount: number;
    currency: string;
    creditsAdded: number;
    status: 'success' | 'failed' | 'verified_simulated';
  }
) => {
  if (!db) return;
  // Store transaction in a subcollection under user or a root collection
  const txId = paymentDetails.razorpay_payment_id || `failed_${Date.now()}`;
  const txRef = doc(db, 'apps', appId, 'users', userId, 'transactions', txId);
  await setDoc(txRef, {
    ...paymentDetails,
    timestamp: serverTimestamp(),
  });
  console.log(`[Firebase] Payment logged in Firestore: ${txId}`);
};

export const syncMarketingLead = async (user: any, sourceApp: string, customDisplayName?: string) => {
  if (!db) return;
  const leadRef = doc(db, 'marketing_leads', user.uid);
  await setDoc(leadRef, {
    uid: user.uid,
    displayName: customDisplayName || user.displayName || '',
    email: user.email || '',
    photoURL: user.photoURL || '',
    sourceApp: sourceApp,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};

export const signUpWithEmailAndPassword = async (name: string, email: string, password: string) => {
  if (!isFirebaseConfigured || !auth) {
    throw new Error("Firebase is not configured. Please add VITE_FIREBASE_* credentials to your .env file.");
  }
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  // Update Firebase Authentication profile display name
  await updateProfile(credential.user, { displayName: name });
  return credential.user;
};

export const signInWithEmailAndPassword = async (email: string, password: string) => {
  if (!isFirebaseConfigured || !auth) {
    throw new Error("Firebase is not configured. Please add VITE_FIREBASE_* credentials to your .env file.");
  }
  const credential = await fbSignInWithEmailAndPassword(auth, email, password);
  return credential.user;
};

export const getUserCredits = async (appId: string, userId: string): Promise<number | null> => {
  if (!db) return null;
  try {
    const userRef = doc(db, 'apps', appId, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      return typeof data.credits === 'number' ? data.credits : null;
    }
  } catch (err) {
    console.error("[Firebase] Error fetching user credits:", err);
  }
  return null;
};



