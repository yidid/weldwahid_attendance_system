import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '../firebase/firebase'

const attendanceRef = collection(db, 'attendance')
const TOKEN_PREFIX = 'SS_ATTENDANCE:'

export function getTodayDateString() {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Addis_Ababa',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(now)
}

export async function getAttendanceByDate(dateString) {
  const q = query(attendanceRef, where('date', '==', dateString))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }))
}

export async function getAttendanceForStudent(studentId) {
  const q = query(attendanceRef, where('studentId', '==', studentId))
  const snapshot = await getDocs(q)

  return snapshot.docs
    .map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }))
    .sort((first, second) => second.date.localeCompare(first.date))
}

export async function getAttendanceByDateRange(startDate, endDate) {
  const q = query(
    attendanceRef,
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'desc')
  )
  const snapshot = await getDocs(q)

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }))
}

async function assertStaffAccess() {
  const currentUser = auth.currentUser
  if (!currentUser) {
    throw new Error('You must be logged in.')
  }

  const userSnapshot = await getDoc(doc(db, 'users', currentUser.uid))
  const role = userSnapshot.exists() ? userSnapshot.data().role : null
  if (role !== 'admin' && role !== 'teacher') {
    throw new Error('You do not have permission to record attendance.')
  }

  return currentUser.uid
}

async function findStudentFromQr(qrText) {
  if (typeof qrText !== 'string' || !qrText.startsWith(TOKEN_PREFIX)) {
    return { result: 'INVALID_QR' }
  }

  const rawToken = qrText.slice(TOKEN_PREFIX.length).trim()
  if (!rawToken) {
    return { result: 'INVALID_QR' }
  }

  const tokenBytes = new TextEncoder().encode(rawToken)
  const digest = await crypto.subtle.digest('SHA-256', tokenBytes)
  const tokenHash = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

  const snapshot = await getDocs(
    query(collection(db, 'students'), where('qrTokenHash', '==', tokenHash))
  )

  if (snapshot.empty) {
    return { result: 'INVALID_QR' }
  }

  const studentSnapshot = snapshot.docs[0]
  const student = { id: studentSnapshot.id, ...studentSnapshot.data() }
  if (student.status !== 'active') {
    return { result: 'STUDENT_INACTIVE', student }
  }

  return { student }
}

async function recordAttendance(qrText, mode) {
  const staffUid = await assertStaffAccess()
  const { student, result } = await findStudentFromQr(qrText)

  if (result) {
    return { success: false, result }
  }

  const today = getTodayDateString()
  const attendanceId = `${student.id}_${today}`
  const attendanceRef = doc(db, 'attendance', attendanceId)
  const existingSnapshot = await getDoc(attendanceRef)

  if (mode === 'entry' && existingSnapshot.exists()) {
    return {
      success: false,
      result: 'ALREADY_ENTERED',
      student: { name: student.name, classId: student.classId },
    }
  }

  if (mode === 'exit' && !existingSnapshot.exists()) {
    return {
      success: false,
      result: 'NO_ENTRY_FOUND',
      student: { name: student.name, classId: student.classId },
    }
  }

  if (mode === 'exit' && existingSnapshot.data().status === 'completed') {
    return {
      success: false,
      result: 'ALREADY_EXITED',
      student: { name: student.name, classId: student.classId },
    }
  }

  if (mode === 'entry') {
    await setDoc(attendanceRef, {
      studentId: student.id,
      date: today,
      entryTime: serverTimestamp(),
      exitTime: null,
      status: 'inside',
      entryRecordedBy: staffUid,
      exitRecordedBy: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return {
      success: true,
      result: 'ENTRY_RECORDED',
      student: { name: student.name, classId: student.classId },
    }
  }

  await updateDoc(attendanceRef, {
    exitTime: serverTimestamp(),
    status: 'completed',
    exitRecordedBy: staffUid,
    updatedAt: serverTimestamp(),
  })

  return {
    success: true,
    result: 'EXIT_RECORDED',
    student: { name: student.name, classId: student.classId },
  }
}

export function callRecordEntry(qrText) {
  return recordAttendance(qrText, 'entry')
}

export function callRecordExit(qrText) {
  return recordAttendance(qrText, 'exit')
}