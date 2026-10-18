import { collection, doc, getDocs, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/firebase'

const usersRef = collection(db, 'users')

export const ALLOWED_ROLES = ['admin', 'teacher']

export async function getAllUsers() {
  const snapshot = await getDocs(usersRef)

  return snapshot.docs
    .map((docSnap) => ({
      uid: docSnap.id,
      ...docSnap.data(),
    }))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
}

export async function updateUserRole(uid, role) {
  if (!ALLOWED_ROLES.includes(role)) {
    throw new Error('Invalid role.')
  }

  const userRef = doc(db, 'users', uid)
  await updateDoc(userRef, { role })
}