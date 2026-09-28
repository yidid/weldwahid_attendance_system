const crypto = require('crypto')

const TOKEN_PREFIX = 'SS_ATTENDANCE:'

function generateRawToken() {
  return crypto.randomBytes(32).toString('hex')
}

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}

function buildQrText(rawToken) {
  return `${TOKEN_PREFIX}${rawToken}`
}

function parseQrText(qrText) {
  if (typeof qrText !== 'string' || !qrText.startsWith(TOKEN_PREFIX)) {
    return null
  }

  const rawToken = qrText.slice(TOKEN_PREFIX.length).trim()

  if (!rawToken) {
    return null
  }

  return rawToken
}

module.exports = {
  TOKEN_PREFIX,
  generateRawToken,
  hashToken,
  buildQrText,
  parseQrText,
}