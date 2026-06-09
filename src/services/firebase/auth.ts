import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
  PhoneAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  updateProfile,
  User as FirebaseUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { COLLECTIONS } from '@constants/index';
import { User, UserRole } from '@types/index';

// ─── Auth State Listener ─────────────────────────────────────────────────────

export const subscribeToAuthState = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// ─── Email Auth ──────────────────────────────────────────────────────────────

export const loginWithEmail = async (email: string, password: string) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
};

export const registerWithEmail = async (
  email: string,
  password: string,
  displayName: string
) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });
  await createUserDocument(credential.user, 'parent');
  return credential.user;
};

// ─── Phone OTP Auth ──────────────────────────────────────────────────────────

export const sendOTP = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => {
  const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
  return confirmationResult;
};

export const verifyOTP = async (confirmationResult: any, otp: string) => {
  const credential = await confirmationResult.confirm(otp);
  const isNew = credential.additionalUserInfo?.isNewUser ?? false;
  if (isNew) {
    await createUserDocument(credential.user, 'parent');
  }
  return { user: credential.user, isNewUser: isNew };
};

// ─── Google Auth ─────────────────────────────────────────────────────────────

export const loginWithGoogle = async (idToken: string) => {
  const credential_obj = GoogleAuthProvider.credential(idToken);
  const credential = await signInWithCredential(auth, credential_obj);
  const isNew = credential.additionalUserInfo?.isNewUser ?? false;
  if (isNew) {
    await createUserDocument(credential.user, 'parent');
  }
  return { user: credential.user, isNewUser: isNew };
};

// ─── Sign Out ─────────────────────────────────────────────────────────────────

export const logout = async () => {
  await signOut(auth);
};

// ─── Password Reset ──────────────────────────────────────────────────────────

export const resetPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};

// ─── User Document ────────────────────────────────────────────────────────────

export const createUserDocument = async (firebaseUser: FirebaseUser, role: UserRole) => {
  const userRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    await setDoc(userRef, {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      phoneNumber: firebaseUser.phoneNumber,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      role,
      language: 'en',
      subscriptionTier: 'free',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
};

export const getUserDocument = async (uid: string): Promise<User | null> => {
  const userRef = doc(db, COLLECTIONS.USERS, uid);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    ...data,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
  } as User;
};

export const updateUserDocument = async (uid: string, data: Partial<User>) => {
  const userRef = doc(db, COLLECTIONS.USERS, uid);
  await updateDoc(userRef, { ...data, updatedAt: serverTimestamp() });
};
