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

const studentsRef = collection(db, 'students')

export async function createStudent(studentData) {
  const docRef = await addDoc(studentsRef, {
    name: studentData.name,
    studentId: studentData.studentId,
    classId: studentData.classId || null,
    telegramId: studentData.telegramId || null,
    phone: studentData.phone || '',
    gender: studentData.gender || '',
    status: 'active',
    qrTokenHash: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return docRef.id
}

export async function updateStudent(id, studentData) {
  const studentRef = doc(db, 'students', id)
  await updateDoc(studentRef, {
    name: studentData.name,
    studentId: studentData.studentId,
    classId: studentData.classId || null,
    telegramId: studentData.telegramId || null,
    phone: studentData.phone || '',
    gender: studentData.gender || '',
    updatedAt: serverTimestamp(),
  })
}

export async function deactivateStudent(id) {
  const studentRef = doc(db, 'students', id)
  await updateDoc(studentRef, {
    status: 'inactive',
    updatedAt: serverTimestamp(),
  })
}

export async function activateStudent(id) {
  const studentRef = doc(db, 'students', id)
  await updateDoc(studentRef, {
    status: 'active',
    updatedAt: serverTimestamp(),
  })
}

export async function getStudentById(id) {
  const studentRef = doc(db, 'students', id)
  const snapshot = await getDoc(studentRef)

  if (!snapshot.exists()) {
    return null
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  }
}

export async function getAllStudents() {
  const q = query(studentsRef, orderBy('name'))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }))
}

export async function getStudentsByClass(classId) {
  const q = query(studentsRef, where('classId', '==', classId), orderBy('name'))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }))
}

export async function linkTelegramId(studentDocId, telegramId) {
  const studentRef = doc(db, 'students', studentDocId)
  await updateDoc(studentRef, {
    telegramId,
    updatedAt: serverTimestamp(),
  })
}