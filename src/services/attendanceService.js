import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from 'firebase/firestore'
import { db } from '../firebase/firebase'

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
  const q = query(
    attendanceRef,
    where('studentId', '==', studentId),
    orderBy('date', 'desc')
  )
  const snapshot = await getDocs(q)

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }))
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