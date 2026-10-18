const admin = require('firebase-admin')
const { cert, getApps, initializeApp } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')

if (getApps().length === 0) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON is missing. Set it to the Firebase service-account JSON.'
    )
  }

  let serviceAccount
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  } catch (error) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.',
      { cause: error }
    )
  }

  initializeApp({
    credential: cert(serviceAccount),
  })
}

const db = getFirestore()

module.exports = { admin, db, FieldValue }