const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { db, FieldValue } = require('./firebaseAdmin')
const { validateQrAndGetStudent } = require('./validateQrToken')
const { getTodayDateString } = require('./dateHelper')

async function assertIsStaff(uid) {
  if (!uid) {
    throw new HttpsError('unauthenticated', 'You must be logged in.')
  }

  const userSnap = await db.collection('users').doc(uid).get()

  if (!userSnap.exists) {
    throw new HttpsError('permission-denied', 'No user profile found.')
  }

  const role = userSnap.data().role

  if (role !== 'admin' && role !== 'teacher') {
    throw new HttpsError('permission-denied', 'You do not have permission to record attendance.')
  }
}

exports.recordEntry = onCall(async (request) => {
  const { auth, data } = request

  await assertIsStaff(auth ? auth.uid : null)

  const qrText = data ? data.qrText : null

  if (!qrText || typeof qrText !== 'string') {
    throw new HttpsError('invalid-argument', 'qrText is required.')
  }

  let student
  try {
    student = await validateQrAndGetStudent(qrText)
  } catch (err) {
    return {
      success: false,
      result: err.message === 'STUDENT_INACTIVE' ? 'STUDENT_INACTIVE' : 'INVALID_QR',
    }
  }

  const today = getTodayDateString()
  const attendanceId = `${student.id}_${today}`
  const attendanceRef = db.collection('attendance').doc(attendanceId)
  const existingSnap = await attendanceRef.get()

  if (existingSnap.exists) {
    return {
      success: false,
      result: 'ALREADY_ENTERED',
      student: { name: student.name, classId: student.classId },
    }
  }

  await attendanceRef.set({
    studentId: student.id,
    date: today,
    entryTime: FieldValue.serverTimestamp(),
    exitTime: null,
    status: 'inside',
    entryRecordedBy: auth.uid,
    exitRecordedBy: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  return {
    success: true,
    result: 'ENTRY_RECORDED',
    student: { name: student.name, classId: student.classId },
  }
})