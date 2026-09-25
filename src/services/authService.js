import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/firebase'

export function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

export function logout() {
  return signOut(auth)
}

export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback)
}

export async function getUserProfile(uid) {
  const userRef = doc(db, 'users', uid)
  const snapshot = await getDoc(userRef)

  if (!snapshot.exists()) {
    return null
  }

  return {
    uid,
    ...snapshot.data(),
  }
}