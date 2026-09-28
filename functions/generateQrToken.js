const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { db, FieldValue } = require('./firebaseAdmin')
const { generateRawToken, hashToken, buildQrText } = require('./qrToken')

async function assertIsAdmin(uid) {
  if (!uid) {
    throw new HttpsError('unauthenticated', 'You must be logged in.')
  }

  const userSnap = await db.collection('users').doc(uid).get()

  if (!userSnap.exists) {
    throw new HttpsError('permission-denied', 'No user profile found.')
  }

  const role = userSnap.data().role

  if (role !== 'admin') {
    throw new HttpsError('permission-denied', 'Only administrators can perform this action.')
  }
}

exports.generateQrToken = onCall(async (request) => {
  const { auth, data } = request

  await assertIsAdmin(auth ? auth.uid : null)

  const studentId = data ? data.studentId : null

  if (!studentId || typeof studentId !== 'string') {
    throw new HttpsError('invalid-argument', 'studentId is required.')
  }

  const studentRef = db.collection('students').doc(studentId)
  const studentSnap = await studentRef.get()

  if (!studentSnap.exists) {
    throw new HttpsError('not-found', 'Student not found.')
  }

  const rawToken = generateRawToken()
  const tokenHash = hashToken(rawToken)

  await studentRef.update({
    qrTokenHash: tokenHash,
    updatedAt: FieldValue.serverTimestamp(),
  })

  return {
    qrText: buildQrText(rawToken),
  }
})