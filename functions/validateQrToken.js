const { HttpsError } = require('firebase-functions/v2/https')
const { db } = require('./firebaseAdmin')
const { hashToken, parseQrText } = require('./qrToken')

async function validateQrAndGetStudent(qrText) {
  const rawToken = parseQrText(qrText)

  if (!rawToken) {
    throw new HttpsError('invalid-argument', 'INVALID_QR')
  }

  const tokenHash = hashToken(rawToken)

  const studentsQuery = await db
    .collection('students')
    .where('qrTokenHash', '==', tokenHash)
    .limit(1)
    .get()

  if (studentsQuery.empty) {
    throw new HttpsError('not-found', 'INVALID_QR')
  }

  const studentDoc = studentsQuery.docs[0]
  const studentData = studentDoc.data()

  if (studentData.status !== 'active') {
    throw new HttpsError('permission-denied', 'STUDENT_INACTIVE')
  }

  return {
    id: studentDoc.id,
    ...studentData,
  }
}

module.exports = { validateQrAndGetStudent }