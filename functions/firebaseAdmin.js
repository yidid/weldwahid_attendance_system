const admin = require('firebase-admin')

if (admin.apps.length === 0) {
  admin.initializeApp()
}

const db = admin.firestore()
const FieldValue = admin.firestore.FieldValue

module.exports = { admin, db, FieldValue }