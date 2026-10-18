const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { db, FieldValue } = require('./firebaseAdmin')

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
    throw new HttpsError('permission-denied', 'You do not have permission to perform this action.')
  }
}

function generateSixDigitCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

exports.generateLinkCode = onCall(async (request) => {
  const { auth, data } = request

  await assertIsStaff(auth ? auth.uid : null)

  const studentId = data ? data.studentId : null

  if (!studentId || typeof studentId !== 'string') {
    throw new HttpsError('invalid-argument', 'studentId is required.')
  }

  const studentRef = db.collection('students').doc(studentId)
  const studentSnap = await studentRef.get()

  if (!studentSnap.exists) {
    throw new HttpsError('not-found', 'Student not found.')
  }

  const code = generateSixDigitCode()
  const expiresAtMs = Date.now() + 10 * 60 * 1000

  await studentRef.update({
    linkCode: code,
    linkCodeExpiresAt: expiresAtMs,
    updatedAt: FieldValue.serverTimestamp(),
  })

  return {
    code,
    expiresAtMs,
  }
})