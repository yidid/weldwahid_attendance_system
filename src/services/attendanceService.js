import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db } from '../firebase/firebase'
import { functions } from '../firebase/firebase'

const attendanceRef = collection(db, 'attendance')

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

export async function callRecordEntry(qrText) {
  const recordEntryFn = httpsCallable(functions, 'recordEntry')
  const response = await recordEntryFn({ qrText })
  return response.data
}

export async function callRecordExit(qrText) {
  const recordExitFn = httpsCallable(functions, 'recordExit')
  const response = await recordExitFn({ qrText })
  return response.data
}