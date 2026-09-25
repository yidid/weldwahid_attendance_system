import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/firebase'

const classesRef = collection(db, 'classes')

export async function createClass(classData) {
  const docRef = await addDoc(classesRef, {
    name: classData.name,
    description: classData.description || '',
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return docRef.id
}

export async function updateClass(id, classData) {
  const classRef = doc(db, 'classes', id)
  await updateDoc(classRef, {
    name: classData.name,
    description: classData.description || '',
    updatedAt: serverTimestamp(),
  })
}

export async function setClassActive(id, active) {
  const classRef = doc(db, 'classes', id)
  await updateDoc(classRef, {
    active,
    updatedAt: serverTimestamp(),
  })
}

export async function getClassById(id) {
  const classRef = doc(db, 'classes', id)
  const snapshot = await getDoc(classRef)

  if (!snapshot.exists()) {
    return null
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  }
}

export async function getAllClasses() {
  const q = query(classesRef, orderBy('name'))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }))
}

export async function getActiveClasses() {
  const q = query(classesRef, where('active', '==', true), orderBy('name'))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }))
}