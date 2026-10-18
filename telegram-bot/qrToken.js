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

module.exports = { TOKEN_PREFIX, generateRawToken, hashToken, buildQrText }