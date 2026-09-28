const TIMEZONE = 'Africa/Addis_Ababa'

function getTodayDateString() {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(now)
}

module.exports = { TIMEZONE, getTodayDateString }